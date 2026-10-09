import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from './session.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('SessionService', () => {
  const service = new SessionService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list active sessions', async () => {
    vi.mocked(prisma.session.findMany).mockResolvedValue([{ id: 's1' }] as any);

    const sessions = await service.listSessions('u1');
    expect(sessions).toHaveLength(1);
    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', isRevoked: false }),
      })
    );
  });

  it('should revoke a session', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', userId: 'u1' } as any);

    const success = await service.revokeSession('s1', 'u1');
    expect(success).toBe(true);
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isRevoked: true },
    });
  });

  it('should fail to revoke a session belonging to another user', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', userId: 'u2' } as any);

    const success = await service.revokeSession('s1', 'u1'); // u1 tries to revoke u2's session
    expect(success).toBe(false);
    expect(prisma.session.update).not.toHaveBeenCalled();
  });

  it('should revoke all sessions', async () => {
    await service.revokeAllSessions('u1', 'keep-s1');

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        id: { not: 'keep-s1' },
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
  });

  it('should extend active sessions', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: 's1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 100000)
    } as any);

    await service.touchSession('some-token');

    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          lastActiveAt: expect.any(Date),
          expiresAt: expect.any(Date),
        }),
      })
    );
  });

  it('should enforce re-authentication logic based on authenticatedAt age', async () => {
    // Session authenticated 10 minutes ago
    const oldSession = {
      id: 's1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 100000),
      authenticatedAt: new Date(Date.now() - 10 * 60 * 1000)
    };

    vi.mocked(prisma.session.findUnique).mockResolvedValue(oldSession as any);
    
    // Require re-auth if older than 5 mins => Should fail (false)
    let valid = await service.requireReauth('token', 5);
    expect(valid).toBe(false);

    // Require re-auth if older than 15 mins => Should pass (true)
    valid = await service.requireReauth('token', 15);
    expect(valid).toBe(true);
  });
});
