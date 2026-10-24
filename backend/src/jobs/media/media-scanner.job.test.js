import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaScannerJob } from './media-scanner.job.js';
import { prisma } from '@civiq/db';
vi.mock('@civiq/db', () => ({
    prisma: {
        issueEvidence: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
    MediaScanStatus: {
        PENDING_SCAN: 'PENDING_SCAN',
        CLEAN: 'CLEAN',
        QUARANTINED: 'QUARANTINED',
    },
}));
class MockWorkerStorage {
    store = new Map();
    async getObject(key) {
        return this.store.get(key) ?? null;
    }
    async putObject(key, data, options) {
        this.store.set(key, { data, contentType: options?.contentType ?? 'application/octet-stream' });
    }
    async deleteObject(key) {
        this.store.delete(key);
    }
    async exists(key) {
        return this.store.has(key);
    }
}
describe('MediaScannerJob - Background Media Scanner Worker', () => {
    let storage;
    let job;
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    beforeEach(() => {
        vi.clearAllMocks();
        storage = new MockWorkerStorage();
        job = new MediaScannerJob(storage);
    });
    it('promotes clean media from quarantine to clean private storage', async () => {
        const quarantineKey = 'quarantine/ev-w1/test.png';
        await storage.putObject(quarantineKey, validPng, { contentType: 'image/png' });
        vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
            id: 'ev-w1',
            mimeType: 'image/png',
            storageKey: quarantineKey,
        });
        vi.mocked(prisma.issueEvidence.update).mockResolvedValue({});
        const result = await job.process({ evidenceId: 'ev-w1', storageKey: quarantineKey });
        expect(result.isSafe).toBe(true);
        expect(result.scanStatus).toBe('CLEAN');
        expect(result.newStorageKey).toBe('clean/ev-w1/test.png');
        expect(await storage.exists('clean/ev-w1/test.png')).toBe(true);
        expect(await storage.exists(quarantineKey)).toBe(false);
    });
    it('locks EICAR infected media into unsafe quarantine prefix and marks QUARANTINED in DB', async () => {
        const quarantineKey = 'quarantine/ev-w2/bad.jpg';
        const infectedData = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
        await storage.putObject(quarantineKey, infectedData, { contentType: 'image/jpeg' });
        vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
            id: 'ev-w2',
            mimeType: 'image/jpeg',
            storageKey: quarantineKey,
        });
        vi.mocked(prisma.issueEvidence.update).mockResolvedValue({});
        const result = await job.process({ evidenceId: 'ev-w2', storageKey: quarantineKey });
        expect(result.isSafe).toBe(false);
        expect(result.scanStatus).toBe('QUARANTINED');
        expect(result.quarantineReason).toContain('MALWARE_SIGNATURE');
        expect(result.newStorageKey).toBe('unsafe/ev-w2/bad.jpg');
        expect(await storage.exists('unsafe/ev-w2/bad.jpg')).toBe(true);
    });
    it('quarantines executable payloads disguised as media', async () => {
        const quarantineKey = 'quarantine/ev-w3/trojan.png';
        const mzData = Buffer.from([0x4d, 0x5a, 0x00, 0x00]);
        await storage.putObject(quarantineKey, mzData, { contentType: 'image/png' });
        vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
            id: 'ev-w3',
            mimeType: 'image/png',
            storageKey: quarantineKey,
        });
        const result = await job.process({ evidenceId: 'ev-w3', storageKey: quarantineKey });
        expect(result.isSafe).toBe(false);
        expect(result.scanStatus).toBe('QUARANTINED');
        expect(result.quarantineReason).toContain('EXECUTABLE_PAYLOAD');
    });
    it('quarantines images containing active script payloads (XSS polyglot)', async () => {
        const quarantineKey = 'quarantine/ev-w4/xss.png';
        const xssData = Buffer.concat([validPng, Buffer.from('<script>alert(1)</script>')]);
        await storage.putObject(quarantineKey, xssData, { contentType: 'image/png' });
        vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
            id: 'ev-w4',
            mimeType: 'image/png',
            storageKey: quarantineKey,
        });
        const result = await job.process({ evidenceId: 'ev-w4', storageKey: quarantineKey });
        expect(result.isSafe).toBe(false);
        expect(result.scanStatus).toBe('QUARANTINED');
        expect(result.quarantineReason).toContain('EMBEDDED_SCRIPT');
    });
});
