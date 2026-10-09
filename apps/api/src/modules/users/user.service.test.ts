import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      upsert: vi.fn(),
    },
    privacyPreference: {
      upsert: vi.fn(),
    },
  },
}));

describe('UserService', () => {
  const service = new UserService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update account status', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1', status: 'BANNED' } as any);

    const user = await service.updateAccountStatus('u1', 'BANNED' as any);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'BANNED' },
    });
    expect(user.status).toBe('BANNED');
  });

  it('should mark contact verified', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1', emailVerifiedAt: new Date() } as any);

    await service.markContactVerified('u1', 'email');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          emailVerifiedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should record consent', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1' } as any);

    await service.recordConsent('u1', true, false);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          termsAcceptedAt: expect.any(Date),
        }),
      })
    );
    expect((prisma.user.update as any).mock.calls[0][0].data.privacyPolicyAcceptedAt).toBeUndefined();
  });

  it('should upsert profile fields', async () => {
    vi.mocked(prisma.userProfile.upsert).mockResolvedValue({ id: 'p1', displayName: 'Jane Doe' } as any);

    await service.updateProfile('u1', { displayName: 'Jane Doe', city: 'Pune' });
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        update: { displayName: 'Jane Doe', city: 'Pune' },
        create: expect.objectContaining({
          userId: 'u1',
          displayName: 'Jane Doe',
          city: 'Pune',
        }),
      })
    );
  });

  it('should upsert privacy preferences', async () => {
    vi.mocked(prisma.privacyPreference.upsert).mockResolvedValue({ id: 'pr1', shareLocation: true } as any);

    await service.updatePrivacyPreferences('u1', { shareLocation: true });
    expect(prisma.privacyPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        update: { shareLocation: true },
        create: expect.objectContaining({
          userId: 'u1',
          shareLocation: true,
        }),
      })
    );
  });
});
