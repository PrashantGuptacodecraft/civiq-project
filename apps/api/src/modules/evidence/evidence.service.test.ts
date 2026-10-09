import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidenceService } from './evidence.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issueEvidence: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('EvidenceService', () => {
  const service = new EvidenceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash file and save without metadata if none exists', async () => {
    vi.mocked(prisma.issueEvidence.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.issueEvidence.create).mockResolvedValue({ id: 'ev1' } as any);

    const buffer = Buffer.from('empty_image_data');
    const result = await service.processEvidence({
      issueId: 'iss1',
      uploadedById: 'u1',
      buffer,
      mimeType: 'image/jpeg',
      storageKey: 's3/path.jpg',
    });

    expect(result.id).toBe('ev1');
    expect(prisma.issueEvidence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          issueId: 'iss1',
          sizeBytes: buffer.length,
          fileHash: expect.any(String),
          captureLatitude: null,
          metadataTrusted: false,
        }),
      })
    );
  });

  it('should parse metadata but explicitly mark it UNTRUSTED', async () => {
    vi.mocked(prisma.issueEvidence.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.issueEvidence.create).mockResolvedValue({ id: 'ev2' } as any);

    const buffer = Buffer.from('image_with_mock_exif');
    await service.processEvidence({
      issueId: 'iss1',
      uploadedById: 'u1',
      buffer,
      mimeType: 'image/jpeg',
      storageKey: 's3/path.jpg',
    });

    expect(prisma.issueEvidence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          captureLatitude: 28.6139,
          captureLongitude: 77.2090,
          capturedAt: new Date('2025-01-01T10:00:00Z'),
          metadataTrusted: false, // CRITICAL security check
        }),
      })
    );
  });

  it('should block exact file duplicates globally based on hash collision', async () => {
    vi.mocked(prisma.issueEvidence.findFirst).mockResolvedValue({ id: 'ev_existing' } as any);

    const buffer = Buffer.from('stolen_image');
    
    await expect(
      service.processEvidence({
        issueId: 'iss2',
        uploadedById: 'u2',
        buffer,
        mimeType: 'image/png',
        storageKey: 's3/stolen.png',
      })
    ).rejects.toThrow('duplicate evidence');
  });
});
