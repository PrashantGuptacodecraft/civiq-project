import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from './audit.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('AuditService', () => {
  const service = new AuditService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redact secrets from payload before writing', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as any);

    await service.writeHumanLog('user-1', {
      action: 'UPDATE_USER',
      payload: {
        name: 'John Doe',
        passwordHash: 'secret123',
        nested: {
          token: 'abc-xyz',
          safeValue: 42
        }
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'HUMAN',
          payload: {
            name: 'John Doe',
            passwordHash: '[REDACTED]',
            nested: {
              token: '[REDACTED]',
              safeValue: 42
            }
          }
        })
      })
    );
  });

  it('should write a system log correctly', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-2' } as any);

    await service.writeSystemLog('cron-job', {
      action: 'SYNC_DATA',
      objectType: 'Jurisdiction',
      objectId: 'jur-1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'cron-job',
          actorType: 'SYSTEM',
          action: 'SYNC_DATA',
          objectType: 'Jurisdiction',
        })
      })
    );
  });

  it('should read logs by objectId', async () => {
    const mockLogs = [{ id: 'log-1', action: 'CREATE' }];
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);

    const logs = await service.getLogsForObject('Issue', 'issue-1');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { objectType: 'Issue', objectId: 'issue-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(logs).toEqual(mockLogs);
  });
});
