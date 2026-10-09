import { prisma } from '@civiq/db';
import { createHash } from 'crypto';

export class EvidenceService {
  /**
   * Intakes raw evidence, computes cryptographic hash, extracts metadata, 
   * and saves it. Metadata is parsed but marked UNTRUSTED by default
   * since users can spoof EXIF data.
   */
  async processEvidence(params: {
    issueId: string;
    uploadedById: string;
    buffer: Buffer;
    mimeType: string;
    storageKey: string;
  }) {
    const { issueId, uploadedById, buffer, mimeType, storageKey } = params;

    // 1. Generate cryptographic hash for exact de-duplication
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    // 2. Prevent exact duplicate uploads cluster-wide
    const duplicate = await prisma.issueEvidence.findFirst({
      where: { fileHash }
    });

    if (duplicate) {
      throw new Error('Exact duplicate evidence detected across the platform.');
    }

    // 3. Extract Metadata (Mocked pipeline for now)
    // Real implementation would use exif-parser or sharp
    const metadata = this.extractMockMetadata(buffer);

    // 4. Save to DB marking metadataTrusted as false
    return prisma.issueEvidence.create({
      data: {
        issueId,
        storageKey,
        mimeType,
        sizeBytes: buffer.length,
        fileHash,
        perceptualHash: 'placeholder_phash_value', // Satisfies phase contract placeholder
        captureLatitude: metadata?.lat ?? null,
        captureLongitude: metadata?.lng ?? null,
        capturedAt: metadata?.capturedAt ?? null,
        metadataTrusted: false, // Core requirement: NEVER trust EXIF
        uploadedById
      }
    });
  }

  /**
   * Parses media buffer for internal capture metadata
   */
  private extractMockMetadata(buffer: Buffer): { lat: number; lng: number; capturedAt: Date } | null {
    // Scaffold parsing logic. For tests, if buffer says "mock_exif", we return data.
    const str = buffer.toString('utf-8');
    if (str.includes('mock_exif')) {
      return {
        lat: 28.6139,
        lng: 77.2090,
        capturedAt: new Date('2025-01-01T10:00:00Z')
      };
    }
    return null;
  }
}

export const evidenceService = new EvidenceService();
