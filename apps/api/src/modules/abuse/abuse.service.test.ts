import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbuseDetectionService } from './abuse.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: { count: vi.fn() },
    issueEvidence: { count: vi.fn() },
    riskSignal: { count: vi.fn(), create: vi.fn() },
  },
}));

describe('AbuseDetectionService', () => {
  const service = new AbuseDetectionService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not flag normal behavior', async () => {
    vi.mocked(prisma.issue.count).mockResolvedValue(1);
    vi.mocked(prisma.issueEvidence.count).mockResolvedValue(1); // Only 1 instance of the file
    vi.mocked(prisma.riskSignal.count).mockResolvedValue(0);

    const result = await service.evaluateSubmissionRisk({
      userId: 'u1',
      fileHashes: ['hash123'],
    });

    expect(result.isHighRisk).toBe(false);
    expect(result.signals).toHaveLength(0);
    expect(prisma.riskSignal.create).not.toHaveBeenCalled();
  });

  it('should detect burst reporting and log signal', async () => {
    vi.mocked(prisma.issue.count).mockResolvedValue(10); // > limit of 5
    vi.mocked(prisma.issueEvidence.count).mockResolvedValue(0);
    vi.mocked(prisma.riskSignal.count).mockResolvedValue(0);
    vi.mocked(prisma.riskSignal.create).mockResolvedValue({ id: 'rs1' } as any);

    const result = await service.evaluateSubmissionRisk({
      userId: 'u2',
    });

    expect(result.isHighRisk).toBe(true);
    expect(result.signals).toContain('BURST_REPORTING');
    
    expect(prisma.riskSignal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u2',
          signalType: 'BURST_REPORTING',
          severity: 'HIGH'
        })
      })
    );
  });

  it('should detect repeated media files', async () => {
    vi.mocked(prisma.issue.count).mockResolvedValue(1);
    vi.mocked(prisma.issueEvidence.count).mockResolvedValue(3); // Hash exists 3 times globally
    vi.mocked(prisma.riskSignal.count).mockResolvedValue(0);
    vi.mocked(prisma.riskSignal.create).mockResolvedValue({ id: 'rs2' } as any);

    const result = await service.evaluateSubmissionRisk({
      userId: 'u3',
      fileHashes: ['stolen_hash'],
    });

    expect(result.isHighRisk).toBe(true);
    expect(result.signals).toContain('REPEATED_MEDIA');

    expect(prisma.riskSignal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u3',
          fileHash: 'stolen_hash',
          signalType: 'REPEATED_MEDIA',
          severity: 'CRITICAL'
        })
      })
    );
  });
});
