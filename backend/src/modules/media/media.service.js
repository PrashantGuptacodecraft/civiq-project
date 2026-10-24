import { prisma, MediaScanStatus } from '@civiq/db';
import { createHash } from 'crypto';
import { ALLOWED_MIME_TYPES, MAX_MEDIA_SIZE_BYTES, MediaValidator, } from './media-validator.js';
import { getStorageProvider } from './storage.provider.js';
const ALLOWED_VIEWER_ROLES = [
    'PLATFORM_SUPER_ADMIN',
    'NATIONAL_ADMIN',
    'STATE_ADMIN',
    'DISTRICT_ULB_ADMIN',
    'DEPARTMENT_OFFICER',
    'VERIFICATION_OFFICER',
    'FIELD_SUPERVISOR',
    'FIELD_WORKER',
    'AUDITOR',
];
export class MediaService {
    storage;
    constructor(storageProvider) {
        this.storage = storageProvider ?? getStorageProvider();
    }
    setStorageProvider(storageProvider) {
        this.storage = storageProvider;
    }
    getStorageProvider() {
        return this.storage;
    }
    /**
     * Generates a signed upload ticket/URL allowing authenticated clients
     * to upload a private media asset constrained by size and MIME type.
     */
    async generateSignedUploadUrl(params) {
        const { userId, filename, mimeType, sizeBytes, issueId } = params;
        // 1. Verify user exists and is active
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== 'ACTIVE') {
            throw new Error('User is not authorized or account is inactive.');
        }
        // 2. Validate filename, size and declared MIME type
        if (MediaValidator.isForbiddenExtension(filename)) {
            throw new Error(`File extension in "${filename}" is strictly prohibited for security reasons.`);
        }
        const sizeCheck = MediaValidator.validateSize(sizeBytes);
        if (!sizeCheck.valid) {
            throw new Error(sizeCheck.error);
        }
        const mimeCheck = MediaValidator.validateMimeType(mimeType);
        if (!mimeCheck.valid) {
            throw new Error(mimeCheck.error);
        }
        const sanitizedFilename = MediaValidator.sanitizeFilename(filename);
        // 3. Pre-allocate an IssueEvidence record in PENDING_SCAN status
        const evidence = await prisma.issueEvidence.create({
            data: {
                issueId: issueId ?? null,
                storageKey: `quarantine/pending_${Date.now()}_${sanitizedFilename}`,
                mimeType: mimeType.toLowerCase(),
                sizeBytes,
                scanStatus: MediaScanStatus.PENDING_SCAN,
                uploadedById: userId,
                metadataTrusted: false,
            },
        });
        // 4. Construct a quarantine storage key
        const quarantineKey = `quarantine/${evidence.id}/${sanitizedFilename}`;
        // Update storage key to final quarantine key
        await prisma.issueEvidence.update({
            where: { id: evidence.id },
            data: { storageKey: quarantineKey },
        });
        // 5. Generate signed upload URL
        const signed = this.storage.generateSignedUrl(quarantineKey, 'upload', {
            expiresInSeconds: 900, // 15 mins
        });
        return {
            uploadUrl: signed.url,
            token: signed.token,
            evidenceId: evidence.id,
            storageKey: quarantineKey,
            expiresAt: signed.expiresAt,
            maxSizeBytes: MAX_MEDIA_SIZE_BYTES,
            allowedMimeTypes: [...ALLOWED_MIME_TYPES],
        };
    }
    /**
     * Validates and processes an uploaded file buffer.
     * If threats or spoofing are detected, the file is immediately quarantined.
     * If clean, the file is moved to clean private storage.
     */
    async processUpload(params) {
        const { evidenceId, buffer, uploadedById } = params;
        const evidence = await prisma.issueEvidence.findUnique({
            where: { id: evidenceId },
        });
        if (!evidence) {
            throw new Error(`Media evidence record not found: ${evidenceId}`);
        }
        // 1. Verify file size
        const sizeCheck = MediaValidator.validateSize(buffer.length);
        if (!sizeCheck.valid) {
            return this.quarantineMediaRecord({
                evidenceId,
                storageKey: evidence.storageKey,
                buffer,
                reason: sizeCheck.error ?? 'File size limit exceeded.',
            });
        }
        // 2. Scan content for threats and magic byte spoofing
        const scanResult = MediaValidator.scanThreats(buffer, evidence.mimeType);
        if (!scanResult.isSafe) {
            return this.quarantineMediaRecord({
                evidenceId,
                storageKey: evidence.storageKey,
                buffer,
                reason: `${scanResult.threatType}: ${scanResult.details ?? 'Security threat detected.'}`,
            });
        }
        // 3. Compute cryptographic hash
        const fileHash = createHash('sha256').update(buffer).digest('hex');
        // 4. Extract filename from storage key
        const filename = evidence.storageKey.split('/').pop() ?? 'attachment.bin';
        const cleanKey = `clean/${evidence.id}/${filename}`;
        // 5. Save clean file in private storage
        await this.storage.putObject(cleanKey, buffer, {
            contentType: evidence.mimeType,
            isPrivate: true,
            metadata: {
                evidenceId: evidence.id,
                uploadedById,
                fileHash,
            },
        });
        // Remove from quarantine path if different
        if (evidence.storageKey !== cleanKey && await this.storage.exists(evidence.storageKey)) {
            await this.storage.deleteObject(evidence.storageKey);
        }
        // 6. Update database record
        await prisma.issueEvidence.update({
            where: { id: evidence.id },
            data: {
                storageKey: cleanKey,
                scanStatus: MediaScanStatus.CLEAN,
                quarantineReason: null,
                fileHash,
                sizeBytes: buffer.length,
            },
        });
        return {
            evidenceId: evidence.id,
            storageKey: cleanKey,
            mimeType: evidence.mimeType,
            sizeBytes: buffer.length,
            fileHash,
            scanStatus: MediaScanStatus.CLEAN,
            quarantineReason: null,
            isClean: true,
        };
    }
    /**
     * Generates a signed, time-limited download URL for authorized users.
     * Quarantined or unscanned content CANNOT be downloaded.
     */
    async generateSignedDownloadUrl(params) {
        const { userId, evidenceId, expiresInSeconds } = params;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found.');
        }
        const evidence = await prisma.issueEvidence.findUnique({
            where: { id: evidenceId },
            include: { issue: true },
        });
        if (!evidence) {
            throw new Error(`Media not found: ${evidenceId}`);
        }
        // 1. Quarantined & Unscanned content protection check
        if (evidence.scanStatus === MediaScanStatus.QUARANTINED) {
            throw new Error('Access denied: This media has been quarantined due to safety or security violations.');
        }
        if (evidence.scanStatus === MediaScanStatus.PENDING_SCAN) {
            throw new Error('Access denied: This media is pending safety verification and scanning.');
        }
        // 2. Authorization check (Private by default)
        const isUploader = evidence.uploadedById === userId;
        const isReporter = evidence.issue?.reportedById === userId;
        const isPrivilegedOfficial = ALLOWED_VIEWER_ROLES.includes(user.role);
        if (!isUploader && !isReporter && !isPrivilegedOfficial) {
            throw new Error('Unauthorized: You do not have permission to access this private media.');
        }
        // 3. Generate signed download URL
        const signed = this.storage.generateSignedUrl(evidence.storageKey, 'download', {
            expiresInSeconds: expiresInSeconds ?? 900,
        });
        return {
            downloadUrl: signed.url,
            token: signed.token,
            evidenceId: evidence.id,
            expiresAt: signed.expiresAt,
        };
    }
    /**
     * Verifies signed token and retrieves raw private media stream/buffer.
     */
    async retrieveMediaByToken(token) {
        let payload;
        try {
            const decoded = Buffer.from(token, 'base64url').toString('utf-8');
            payload = JSON.parse(decoded);
        }
        catch {
            throw new Error('Invalid download token format.');
        }
        if (payload.op !== 'download') {
            throw new Error('Invalid token operation.');
        }
        const isValidSig = this.storage.verifySignature(payload.key, 'download', payload.exp, payload.sig);
        if (!isValidSig) {
            throw new Error('Invalid or expired signature for media download.');
        }
        // Check DB status of the media to ensure it wasn't quarantined after token issuance
        const evidence = await prisma.issueEvidence.findFirst({
            where: { storageKey: payload.key },
        });
        if (evidence && evidence.scanStatus === MediaScanStatus.QUARANTINED) {
            throw new Error('Content is quarantined and cannot be downloaded.');
        }
        const obj = await this.storage.getObject(payload.key);
        if (!obj) {
            throw new Error('Media file not found in storage.');
        }
        return {
            data: obj.data,
            contentType: obj.contentType,
            evidenceId: evidence?.id ?? 'unknown',
        };
    }
    /**
     * Quarantines unsafe content and updates database tracking.
     */
    async quarantineMedia(params) {
        const { evidenceId, reason } = params;
        const evidence = await prisma.issueEvidence.findUnique({
            where: { id: evidenceId },
        });
        if (!evidence) {
            throw new Error(`Media evidence record not found: ${evidenceId}`);
        }
        const unsafeKey = `unsafe/${evidence.id}/${evidence.storageKey.split('/').pop()}`;
        // Move in storage if present
        if (await this.storage.exists(evidence.storageKey)) {
            await this.storage.copyObject(evidence.storageKey, unsafeKey);
            await this.storage.deleteObject(evidence.storageKey);
        }
        await prisma.issueEvidence.update({
            where: { id: evidence.id },
            data: {
                storageKey: unsafeKey,
                scanStatus: MediaScanStatus.QUARANTINED,
                quarantineReason: reason,
            },
        });
    }
    async quarantineMediaRecord(params) {
        const { evidenceId, storageKey, buffer, reason } = params;
        const filename = storageKey.split('/').pop() ?? 'quarantined.bin';
        const unsafeKey = `unsafe/${evidenceId}/${filename}`;
        // Save unsafe object strictly under unsafe quarantine prefix
        await this.storage.putObject(unsafeKey, buffer, {
            contentType: 'application/octet-stream',
            isPrivate: true,
            metadata: { evidenceId, quarantined: 'true', reason },
        });
        if (storageKey !== unsafeKey && await this.storage.exists(storageKey)) {
            await this.storage.deleteObject(storageKey);
        }
        const fileHash = createHash('sha256').update(buffer).digest('hex');
        await prisma.issueEvidence.update({
            where: { id: evidenceId },
            data: {
                storageKey: unsafeKey,
                scanStatus: MediaScanStatus.QUARANTINED,
                quarantineReason: reason,
                fileHash,
                sizeBytes: buffer.length,
            },
        });
        return {
            evidenceId,
            storageKey: unsafeKey,
            mimeType: 'application/octet-stream',
            sizeBytes: buffer.length,
            fileHash,
            scanStatus: MediaScanStatus.QUARANTINED,
            quarantineReason: reason,
            isClean: false,
        };
    }
}
export const mediaService = new MediaService();
