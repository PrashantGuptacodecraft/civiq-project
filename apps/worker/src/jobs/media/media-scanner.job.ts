import { prisma, MediaScanStatus } from '@civiq/db';
import {
  MediaScanJobPayload,
  MediaScanJobResult,
  MAX_MEDIA_SIZE_BYTES,
  FORBIDDEN_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  ThreatScanResult,
} from '@civiq/contracts';
import { createHash } from 'crypto';

export interface IWorkerStorage {
  getObject(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  putObject(key: string, data: Buffer, options?: { contentType?: string }): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class MediaScannerJob {
  private storage: IWorkerStorage;

  constructor(storage: IWorkerStorage) {
    this.storage = storage;
  }

  /**
   * Scans a media asset in quarantine, validates magic bytes and threats,
   * and either approves it to clean private storage or locks it in quarantine.
   */
  async process(payload: MediaScanJobPayload): Promise<MediaScanJobResult> {
    const { evidenceId, storageKey } = payload;

    const evidence = await prisma.issueEvidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new Error(`Evidence record ${evidenceId} not found.`);
    }

    // 1. Fetch file buffer from quarantine storage
    const obj = await this.storage.getObject(storageKey);
    if (!obj) {
      throw new Error(`Media object not found at storageKey: ${storageKey}`);
    }

    const buffer = obj.data;

    // 2. Scan threats and validate
    const scanResult = this.scanThreats(buffer, evidence.mimeType);

    if (!scanResult.isSafe) {
      const filename = storageKey.split('/').pop() ?? 'quarantined.bin';
      const unsafeKey = `unsafe/${evidenceId}/${filename}`;
      const reason = `${scanResult.threatType}: ${scanResult.details ?? 'Safety violation'}`;

      // Move to unsafe prefix
      await this.storage.putObject(unsafeKey, buffer, { contentType: 'application/octet-stream' });
      if (storageKey !== unsafeKey && await this.storage.exists(storageKey)) {
        await this.storage.deleteObject(storageKey);
      }

      await prisma.issueEvidence.update({
        where: { id: evidenceId },
        data: {
          storageKey: unsafeKey,
          scanStatus: MediaScanStatus.QUARANTINED,
          quarantineReason: reason,
        },
      });

      return {
        evidenceId,
        scanStatus: 'QUARANTINED',
        quarantineReason: reason,
        newStorageKey: unsafeKey,
        isSafe: false,
      };
    }

    // 3. File is clean: compute hash and promote to clean private storage
    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const filename = storageKey.split('/').pop() ?? 'clean.bin';
    const cleanKey = `clean/${evidenceId}/${filename}`;

    await this.storage.putObject(cleanKey, buffer, { contentType: evidence.mimeType });
    if (storageKey !== cleanKey && await this.storage.exists(storageKey)) {
      await this.storage.deleteObject(storageKey);
    }

    await prisma.issueEvidence.update({
      where: { id: evidenceId },
      data: {
        storageKey: cleanKey,
        scanStatus: MediaScanStatus.CLEAN,
        quarantineReason: null,
        fileHash,
        sizeBytes: buffer.length,
      },
    });

    return {
      evidenceId,
      scanStatus: 'CLEAN',
      quarantineReason: null,
      newStorageKey: cleanKey,
      isSafe: true,
    };
  }

  /**
   * Internal heuristics and threat scanner.
   */
  private scanThreats(buffer: Buffer, declaredMimeType: string): ThreatScanResult {
    if (buffer.length <= 0) {
      return { isSafe: false, threatType: 'SIZE_EXCEEDED', details: 'Zero-byte empty file.' };
    }

    if (buffer.length > MAX_MEDIA_SIZE_BYTES) {
      return { isSafe: false, threatType: 'SIZE_EXCEEDED', details: 'File exceeds 10MB limit.' };
    }

    const str = buffer.toString('utf-8');

    // EICAR test string
    if (str.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
      return { isSafe: false, threatType: 'MALWARE_SIGNATURE', details: 'Anti-malware test signature (EICAR) detected.' };
    }

    // Executable headers (MZ or ELF)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return { isSafe: false, threatType: 'EXECUTABLE_PAYLOAD', details: 'DOS/Windows MZ executable header detected.' };
    }
    if (buffer.length >= 4 && buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return { isSafe: false, threatType: 'EXECUTABLE_PAYLOAD', details: 'Linux ELF executable header detected.' };
    }

    // Magic byte matching
    const magicMatch = this.verifyMagic(buffer, declaredMimeType);
    if (!magicMatch) {
      return { isSafe: false, threatType: 'MIME_SPOOFING', details: `Declared MIME "${declaredMimeType}" does not match file header.` };
    }

    // Script injection in images
    if (declaredMimeType.startsWith('image/')) {
      const lower = str.toLowerCase();
      if (
        lower.includes('<script') ||
        lower.includes('javascript:') ||
        lower.includes('<?php')
      ) {
        return { isSafe: false, threatType: 'EMBEDDED_SCRIPT', details: 'Active script or PHP code embedded in image.' };
      }
    }

    return { isSafe: true };
  }

  private verifyMagic(buffer: Buffer, mime: string): boolean {
    if (buffer.length < 4) return false;

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return mime === 'image/jpeg';
    }
    // PNG
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
      buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
    ) {
      return mime === 'image/png';
    }
    // PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return mime === 'application/pdf';
    }
    // WebP
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return mime === 'image/webp';
    }

    if (mime === 'image/heic' || mime === 'image/heif') {
      return true;
    }

    return false;
  }
}
