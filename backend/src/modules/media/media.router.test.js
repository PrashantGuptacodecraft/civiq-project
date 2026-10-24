import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { mediaRouter } from './media.router';
import { mediaService } from './media.service';
import { prisma, MediaScanStatus } from '@civiq/shared-db';
import { createHash } from 'crypto';
import { getStorageProvider, MemoryStorageProvider, setStorageProvider } from './storage.provider';

vi.mock('@civiq/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
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

describe('MediaRouter - API Integration Tests', () => {
  let app: express.Application;
  let storage;

  const testToken = 'valid-media-session-token';
  const tokenHash = createHash('sha256').update(testToken).digest('hex');

  const mockUser = {
    id: 'user-reporter-1',
    email: 'reporter@civiq.dev',
    role: 'CITIZEN',
    status: 'ACTIVE',
  };

  const mockSession = {
    id: 'session-media-1',
    userId: mockUser.id,
    tokenHash,
    isRevoked: false,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    user: mockUser,
  };

  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new MemoryStorageProvider();
    setStorageProvider(storage);
    mediaService.setStorageProvider(storage);

    app = express();
    app.use(express.json({ limit: '15mb' }));
    app.use('/media', mediaRouter);
  });

  describe('POST /media/signed-upload', () => {
    it('returns 401 when Authorization token is missing', async () => {
      const res = await request(app)
        .post('/media/signed-upload')
        .send({
          filename: 'evidence.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Bearer token missing');
    });

    it('returns 201 with signed ticket when authenticated', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession );
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser );
      vi.mocked(prisma.issueEvidence.create).mockResolvedValue({ id: 'ev-new-1' } );
      vi.mocked(prisma.issueEvidence.update).mockResolvedValue({ id: 'ev-new-1' } );

      const res = await request(app)
        .post('/media/signed-upload')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          filename: 'crack_in_bridge.png',
          mimeType: 'image/png',
          sizeBytes: 50000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evidenceId).toBe('ev-new-1');
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('POST /media/upload', () => {
    it('returns 422 with quarantine explanation when unsafe content is uploaded', async () => {
      const eicarPayload = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');

      vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
        id: 'ev-quarantine-1',
        mimeType: 'image/jpeg',
        storageKey: 'quarantine/ev-quarantine-1/infected.jpg',
      } );
      vi.mocked(prisma.issueEvidence.update).mockResolvedValue({ id: 'ev-quarantine-1' } );

      const res = await request(app)
        .post('/media/upload')
        .send({
          evidenceId: 'ev-quarantine-1',
          base64Content: eicarPayload.toString('base64'),
          uploadedById: mockUser.id,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Content quarantined');
      expect(res.body.data.scanStatus).toBe(MediaScanStatus.QUARANTINED);
    });

    it('returns 200 with clean evidence metadata when clean image is uploaded', async () => {
      vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
        id: 'ev-clean-1',
        mimeType: 'image/png',
        storageKey: 'quarantine/ev-clean-1/photo.png',
      } );
      vi.mocked(prisma.issueEvidence.update).mockResolvedValue({ id: 'ev-clean-1' } );

      const res = await request(app)
        .post('/media/upload')
        .send({
          evidenceId: 'ev-clean-1',
          base64Content: validPngBuffer.toString('base64'),
          uploadedById: mockUser.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scanStatus).toBe(MediaScanStatus.CLEAN);
      expect(res.body.data.storageKey).toBe('clean/ev-clean-1/photo.png');
    });
  });

  describe('GET /media/:id/signed-download', () => {
    it('returns 403 when requesting download for quarantined content', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession );
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser );
      vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
        id: 'ev-quarantined',
        storageKey: 'unsafe/ev-quarantined/bad.jpg',
        scanStatus.QUARANTINED,
        uploadedById: mockUser.id,
      } );

      const res = await request(app)
        .get('/media/ev-quarantined/signed-download')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('quarantined');
    });

    it('returns 200 with download ticket when file is clean and user is authorized', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession );
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser );
      vi.mocked(prisma.issueEvidence.findUnique).mockResolvedValue({
        id: 'ev-clean-2',
        storageKey: 'clean/ev-clean-2/good.png',
        scanStatus.CLEAN,
        uploadedById: mockUser.id,
      } );

      const res = await request(app)
        .get('/media/ev-clean-2/signed-download')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toContain('/media/download?token=');
    });
  });

  describe('GET /media/download', () => {
    it('serves file with security headers for valid signed token', async () => {
      const storageKey = 'clean/ev-file/photo.png';
      await storage.putObject(storageKey, validPngBuffer, { contentType: 'image/png' });

      vi.mocked(prisma.issueEvidence.findFirst).mockResolvedValue({
        id: 'ev-file',
        storageKey,
        scanStatus.CLEAN,
      } );

      const signed = storage.generateSignedUrl(storageKey, 'download', { expiresInSeconds: 60 });

      const res = await request(app).get(`/media/download?token=${signed.token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBe("default-src 'none'");
      expect(res.body).toEqual(validPngBuffer);
    });

    it('returns 403 when download token is missing or forged', async () => {
      const res = await request(app).get('/media/download?token=fake_invalid_token');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});