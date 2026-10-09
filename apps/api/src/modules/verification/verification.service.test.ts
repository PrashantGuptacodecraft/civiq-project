import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationService } from './verification.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    issue: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('VerificationService', () => {
  const service = new VerificationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully transition from PENDING to IN_REVIEW', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', role: 'VERIFICATION_OFFICER' } as any);
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ id: 'iss1', verificationStatus: 'PENDING', version: 1 } as any);

    const result = await service.transitionStatus({
      issueId: 'iss1',
      newStatus: 'IN_REVIEW',
      changedById: 'u1',
      reason: 'Starting review',
    });

    expect(result.success).toBe(true);
    expect(prisma.verificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousStatus: 'PENDING',
          newStatus: 'IN_REVIEW',
          reason: 'Starting review',
        }),
      })
    );
    expect(prisma.issue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'iss1', version: 1 },
        data: { verificationStatus: 'IN_REVIEW', version: { increment: 1 } },
      })
    );
  });

  it('should block transition if user lacks roles', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u2', role: 'CITIZEN' } as any);
    
    const result = await service.transitionStatus({
      issueId: 'iss1',
      newStatus: 'IN_REVIEW',
      changedById: 'u2',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
    expect(prisma.issue.update).not.toHaveBeenCalled();
  });

  it('should reject invalid state transitions', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', role: 'VERIFICATION_OFFICER' } as any);
    
    // PENDING cannot jump directly to VERIFIED
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ id: 'iss1', verificationStatus: 'PENDING' } as any);

    const result = await service.transitionStatus({
      issueId: 'iss1',
      newStatus: 'VERIFIED',
      changedById: 'u1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot transition from PENDING to VERIFIED');
    expect(prisma.verificationHistory.create).not.toHaveBeenCalled();
  });

  it('should handle IN_REVIEW to NEEDS_EVIDENCE successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', role: 'VERIFICATION_OFFICER' } as any);
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ id: 'iss2', verificationStatus: 'IN_REVIEW', version: 2 } as any);

    const result = await service.transitionStatus({
      issueId: 'iss2',
      newStatus: 'NEEDS_EVIDENCE',
      changedById: 'u1',
    });

    expect(result.success).toBe(true);
    expect(prisma.verificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousStatus: 'IN_REVIEW',
          newStatus: 'NEEDS_EVIDENCE',
        }),
      })
    );
  });
});
