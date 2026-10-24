import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaService } from './media.service.js';
import { MemoryStorageProvider } from './storage.provider.js';
import { prisma, MediaScanStatus } from '@civiq/db';
vi.mock('@civiq/db', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        issueEvidence: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
        },
    },
    MediaScanStatus: {
        PENDING_SCAN: 'PENDING_SCAN',
        CLEAN: 'CLEAN',
        QUARANTINED: 'QUARANTINED',
    },
}));
describe('MediaService - Upload Security & Private Storage Tests', () => {
    let storage;
    let service;
    const mockUser = {
        id: 'user-citizen-01',
        email: 'citizen@civiq.dev',
        role: 'CITIZEN',
        status: 'ACTIVE',
    };
    const mockOfficial = {
        id: 'user-officer-01',
        email: 'officer@civiq.dev',
        role: 'VERIFICATION_OFFICER',
        status: 'ACTIVE',
    };
    const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validJpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    beforeEach(() => {
        vi.clearAllMocks();
        storage = new MemoryStorageProvider();
        service = new MediaService(storage);
    });
    describe('Signed Upload URL Generation', () => {
        it('generates a valid signed upload ticket for an active user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.issueEvidence.create).mockResolvedValue({ id: 'ev-101' });
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue({ id: 'ev-101' });
            const ticket = await service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: 'pothole_evidence.png',
                mimeType: 'image/png',
                sizeBytes: 1024 * 500, // 500KB
            });
            expect(ticket.evidenceId).toBe('ev-101');
            expect(ticket.storageKey).toBe('quarantine/ev-101/pothole_evidence.png');
            expect(ticket.uploadUrl).toContain('/media/upload?token=');
            expect(ticket.token).toBeDefined();
            expect(ticket.maxSizeBytes).toBe(10 * 1024 * 1024);
            expect(ticket.allowedMimeTypes).toContain('image/png');
        });
        it('rejects upload ticket for suspended or inactive accounts', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                ...mockUser,
                status: 'SUSPENDED',
            });
            await expect(service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: 'report.jpg',
                mimeType: 'image/jpeg',
                sizeBytes: 1024,
            })).rejects.toThrow('User is not authorized or account is inactive');
        });
        it('rejects forbidden executable file extensions', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            await expect(service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: 'payload.exe',
                mimeType: 'application/octet-stream',
                sizeBytes: 1024,
            })).rejects.toThrow('strictly prohibited');
        });
        it('rejects oversized files exceeding 10MB limit', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            await expect(service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: 'huge_video.png',
                mimeType: 'image/png',
                sizeBytes: 11 * 1024 * 1024,
            })).rejects.toThrow('exceeds the maximum allowed limit of 10MB');
        });
        it('rejects unsupported MIME types', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            await expect(service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: 'document.xyz',
                mimeType: 'application/unknown-format',
                sizeBytes: 1024,
            })).rejects.toThrow('Unsupported MIME type');
        });
        it('sanitizes dangerous filenames against directory traversal and null bytes', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.issueEvidence.create).mockResolvedValue({ id: 'ev-102' });
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue({ id: 'ev-102' });
            const ticket = await service.generateSignedUploadUrl({
                userId: mockUser.id,
                filename: '../../../etc/passwd\0.png',
                mimeType: 'image/png',
                sizeBytes: 2048,
            });
            expect(ticket.storageKey).toBe('quarantine/ev-102/passwd.png');
            expect(ticket.storageKey).not.toContain('..');
            expect(ticket.storageKey).not.toContain('\0');
        });
    });
    describe('Upload Processing & Content Threat Scanning', () => {
        it('approves and promotes clean PNG file to clean private storage', async () => {
            const mockEvidence = {
                id: 'ev-201',
                mimeType: 'image/png',
                storageKey: 'quarantine/ev-201/test.png',
            };
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue(mockEvidence);
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue(mockEvidence);
            const result = await service.processUpload({
                evidenceId: 'ev-201',
                buffer: validPngHeader,
                uploadedById: mockUser.id,
            });
            expect(result.isClean).toBe(true);
            expect(result.scanStatus).toBe(MediaScanStatus.CLEAN);
            expect(result.storageKey).toBe('clean/ev-201/test.png');
            expect(result.quarantineReason).toBeNull();
            expect(result.fileHash).toHaveLength(64); // sha256
            // Storage object exists in clean path
            const stored = await storage.getObject('clean/ev-201/test.png');
            expect(stored).not.toBeNull();
        });
        it('quarantines file containing EICAR anti-malware test signature', async () => {
            const mockEvidence = {
                id: 'ev-202',
                mimeType: 'image/jpeg',
                storageKey: 'quarantine/ev-202/infected.jpg',
            };
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue(mockEvidence);
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue(mockEvidence);
            const eicarPayload = Buffer.concat([
                validJpegHeader,
                Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
            ]);
            const result = await service.processUpload({
                evidenceId: 'ev-202',
                buffer: eicarPayload,
                uploadedById: mockUser.id,
            });
            expect(result.isClean).toBe(false);
            expect(result.scanStatus).toBe(MediaScanStatus.QUARANTINED);
            expect(result.quarantineReason).toContain('MALWARE_SIGNATURE');
            expect(result.storageKey).toContain('unsafe/ev-202');
            // Stored in unsafe quarantine prefix
            const stored = await storage.getObject(result.storageKey);
            expect(stored).not.toBeNull();
        });
        it('quarantines file disguised with .png extension containing DOS/Windows executable header (MZ)', async () => {
            const mockEvidence = {
                id: 'ev-203',
                mimeType: 'image/png',
                storageKey: 'quarantine/ev-203/trojan.png',
            };
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue(mockEvidence);
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue(mockEvidence);
            // MZ header (4D 5A)
            const mzPayload = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
            const result = await service.processUpload({
                evidenceId: 'ev-203',
                buffer: mzPayload,
                uploadedById: mockUser.id,
            });
            expect(result.isClean).toBe(false);
            expect(result.scanStatus).toBe(MediaScanStatus.QUARANTINED);
            expect(result.quarantineReason).toContain('EXECUTABLE_PAYLOAD');
        });
        it('quarantines file with MIME spoofing (declared image/png but random non-png bytes)', async () => {
            const mockEvidence = {
                id: 'ev-204',
                mimeType: 'image/png',
                storageKey: 'quarantine/ev-204/fake.png',
            };
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue(mockEvidence);
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue(mockEvidence);
            const fakePayload = Buffer.from('just plain text pretending to be png');
            const result = await service.processUpload({
                evidenceId: 'ev-204',
                buffer: fakePayload,
                uploadedById: mockUser.id,
            });
            expect(result.isClean).toBe(false);
            expect(result.scanStatus).toBe(MediaScanStatus.QUARANTINED);
            expect(result.quarantineReason).toContain('MIME_SPOOFING');
        });
        it('quarantines image payload containing embedded active XSS/PHP script', async () => {
            const mockEvidence = {
                id: 'ev-205',
                mimeType: 'image/png',
                storageKey: 'quarantine/ev-205/xss.png',
            };
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue(mockEvidence);
            vi.mocked(prisma.issueEvidence.update).mockResolvedValue(mockEvidence);
            const xssPayload = Buffer.concat([
                validPngHeader,
                Buffer.from('<script>alert("pwned")</script>'),
            ]);
            const result = await service.processUpload({
                evidenceId: 'ev-205',
                buffer: xssPayload,
                uploadedById: mockUser.id,
            });
            expect(result.isClean).toBe(false);
            expect(result.scanStatus).toBe(MediaScanStatus.QUARANTINED);
            expect(result.quarantineReason).toContain('EMBEDDED_SCRIPT');
        });
    });
    describe('Signed Download URL Security Controls', () => {
        it('generates a signed download ticket for clean media requested by authorized uploader', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
                id: 'ev-301',
                storageKey: 'clean/ev-301/photo.jpg',
                scanStatus: MediaScanStatus.CLEAN,
                uploadedById: mockUser.id,
                issue: { reportedById: mockUser.id },
            });
            const ticket = await service.generateSignedDownloadUrl({
                userId: mockUser.id,
                evidenceId: 'ev-301',
            });
            expect(ticket.evidenceId).toBe('ev-301');
            expect(ticket.downloadUrl).toContain('/media/download?token=');
            expect(ticket.token).toBeDefined();
        });
        it('generates a signed download ticket for authorized verification officer', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOfficial);
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
                id: 'ev-301',
                storageKey: 'clean/ev-301/photo.jpg',
                scanStatus: MediaScanStatus.CLEAN,
                uploadedById: 'someone-else',
                issue: { reportedById: 'someone-else' },
            });
            const ticket = await service.generateSignedDownloadUrl({
                userId: mockOfficial.id,
                evidenceId: 'ev-301',
            });
            expect(ticket.evidenceId).toBe('ev-301');
            expect(ticket.downloadUrl).toBeDefined();
        });
        it('STRICT ACCESS DENIAL: blocks download URL generation for QUARANTINED media', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOfficial);
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
                id: 'ev-302',
                storageKey: 'unsafe/ev-302/malware.jpg',
                scanStatus: MediaScanStatus.QUARANTINED,
                quarantineReason: 'MALWARE_SIGNATURE: EICAR',
                uploadedById: mockOfficial.id,
            });
            await expect(service.generateSignedDownloadUrl({
                userId: mockOfficial.id,
                evidenceId: 'ev-302',
            })).rejects.toThrow('quarantined due to safety or security violations');
        });
        it('blocks download URL generation for PENDING_SCAN unscanned media', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOfficial);
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
                id: 'ev-303',
                storageKey: 'quarantine/ev-303/pending.jpg',
                scanStatus: MediaScanStatus.PENDING_SCAN,
                uploadedById: mockOfficial.id,
            });
            await expect(service.generateSignedDownloadUrl({
                userId: mockOfficial.id,
                evidenceId: 'ev-303',
            })).rejects.toThrow('pending safety verification and scanning');
        });
        it('enforces private-by-default: unauthorized citizen cannot access another citizen private media', async () => {
            const unauthorizedCitizen = { id: 'intruder-id', role: 'CITIZEN' };
            vi.mocked(prisma.user.findUnique).mockResolvedValue(unauthorizedCitizen);
            vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
                id: 'ev-304',
                storageKey: 'clean/ev-304/secret.jpg',
                scanStatus: MediaScanStatus.CLEAN,
                uploadedById: 'original-reporter-id',
                issue: { reportedById: 'original-reporter-id' },
            });
            await expect(service.generateSignedDownloadUrl({
                userId: unauthorizedCitizen.id,
                evidenceId: 'ev-304',
            })).rejects.toThrow('Unauthorized: You do not have permission');
        });
    });
    describe('Signed Download Token Verification & Media Retrieval', () => {
        it('retrieves media data with valid signed token', async () => {
            const testKey = 'clean/ev-401/photo.jpg';
            await storage.putObject(testKey, validJpegHeader, { contentType: 'image/jpeg' });
            vi.mocked(prisma.issueEvidence.findFirst).mockResolvedValue({
                id: 'ev-401',
                storageKey: testKey,
                scanStatus: MediaScanStatus.CLEAN,
            });
            const signed = storage.generateSignedUrl(testKey, 'download', { expiresInSeconds: 60 });
            const retrieved = await service.retrieveMediaByToken(signed.token);
            expect(retrieved.contentType).toBe('image/jpeg');
            expect(retrieved.data).toEqual(validJpegHeader);
            expect(retrieved.evidenceId).toBe('ev-401');
        });
        it('rejects tampered or forged signed tokens', async () => {
            const testKey = 'clean/ev-402/photo.jpg';
            const signed = storage.generateSignedUrl(testKey, 'download', { expiresInSeconds: 60 });
            // Tamper signature
            const decoded = JSON.parse(Buffer.from(signed.token, 'base64url').toString());
            decoded.sig = 'forged_fake_signature_hash_12345678';
            const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString('base64url');
            await expect(service.retrieveMediaByToken(tamperedToken)).rejects.toThrow('Invalid or expired signature');
        });
        it('rejects expired signed tokens', async () => {
            const testKey = 'clean/ev-403/photo.jpg';
            const expiredSigned = storage.generateSignedUrl(testKey, 'download', {
                expiresInSeconds: -10, // Expired 10 seconds ago
            });
            await expect(service.retrieveMediaByToken(expiredSigned.token)).rejects.toThrow('Invalid or expired signature');
        });
    });
});
