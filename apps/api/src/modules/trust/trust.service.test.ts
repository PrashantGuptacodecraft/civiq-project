import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrustService } from './trust.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    issue: {
      findMany: vi.fn(),
    },
    trustProfile: {
      upsert: vi.fn(),
    },
  },
}));

describe('TrustService', () => {
  const service = new TrustService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('determineTrustLevel', () => {
    it('maps scores to correct levels', () => {
      expect(service.determineTrustLevel(160)).toBe('TRUSTED');
      expect(service.determineTrustLevel(150)).toBe('TRUSTED');
      expect(service.determineTrustLevel(149)).toBe('ESTABLISHED');
      expect(service.determineTrustLevel(70)).toBe('ESTABLISHED');
      expect(service.determineTrustLevel(69)).toBe('NEW');
      expect(service.determineTrustLevel(30)).toBe('NEW');
      expect(service.determineTrustLevel(29)).toBe('FLAGGED');
      expect(service.determineTrustLevel(0)).toBe('FLAGGED');
      expect(service.determineTrustLevel(-1)).toBe('SUSPENDED');
      expect(service.determineTrustLevel(-100)).toBe('SUSPENDED');
    });
  });

  describe('calculateTrustScore', () => {
    it('returns base 50 for new unverified user with no reports', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ verificationLevel: 'UNVERIFIED' } as any);
      vi.mocked(prisma.issue.findMany).mockResolvedValue([] as any);

      const metrics = await service.calculateTrustScore('u1');
      expect(metrics.trustScore).toBe(50);
      expect(metrics.validReports).toBe(0);
    });

    it('adds points for KYC verification', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ verificationLevel: 'KYC_VERIFIED' } as any);
      vi.mocked(prisma.issue.findMany).mockResolvedValue([] as any);

      const metrics = await service.calculateTrustScore('u2');
      expect(metrics.trustScore).toBe(100); // 50 base + 50 KYC
    });

    it('calculates complex report history accurately', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ verificationLevel: 'BASIC_VERIFIED' } as any); // +20 (Base 70)
      vi.mocked(prisma.issue.findMany).mockResolvedValue([
        { verificationStatus: 'VERIFIED' }, // +5
        { verificationStatus: 'VERIFIED' }, // +5
        { verificationStatus: 'REJECTED' }, // -5
        { verificationStatus: 'PENDING' },  // 0
      ] as any);

      const metrics = await service.calculateTrustScore('u3');
      expect(metrics.validReports).toBe(2);
      expect(metrics.rejectedReports).toBe(1);
      expect(metrics.trustScore).toBe(75); // 70 + 10 - 5
    });

    it('heavily penalizes confirmed abuse', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ verificationLevel: 'UNVERIFIED' } as any); // 50
      vi.mocked(prisma.issue.findMany).mockResolvedValue([
        { verificationStatus: 'SUSPICIOUS' }, // -50
        { verificationStatus: 'SUSPICIOUS' }, // -50
      ] as any);

      const metrics = await service.calculateTrustScore('u4');
      expect(metrics.confirmedAbuse).toBe(2);
      expect(metrics.trustScore).toBe(-50); // 50 - 100
    });
  });

  describe('updateTrustProfile', () => {
    it('recalculates and cascades suspension for scores < 0', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ verificationLevel: 'UNVERIFIED' } as any);
      vi.mocked(prisma.issue.findMany).mockResolvedValue([
        { verificationStatus: 'SUSPICIOUS' } // -50 => score 0 (FLAGGED) => not suspended yet
      ] as any);
      vi.mocked(prisma.trustProfile.upsert).mockResolvedValue({ trustLevel: 'FLAGGED' } as any);

      await service.updateTrustProfile('u5');
      expect(prisma.user.update).not.toHaveBeenCalled(); // 0 is FLAGGED, not suspended

      // Now force suspension
      vi.mocked(prisma.issue.findMany).mockResolvedValue([
        { verificationStatus: 'SUSPICIOUS' }, // -50 => score 0
        { verificationStatus: 'REJECTED' },   // -5 => score -5 (SUSPENDED)
      ] as any);
      vi.mocked(prisma.trustProfile.upsert).mockResolvedValue({ trustLevel: 'SUSPENDED' } as any);

      await service.updateTrustProfile('u6');
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u6' },
        data: { status: 'SUSPENDED' }
      });
      
      expect(prisma.trustProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            trustScore: -5,
            trustLevel: 'SUSPENDED',
          })
        })
      );
    });
  });
});
