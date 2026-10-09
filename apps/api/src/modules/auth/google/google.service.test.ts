import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAuthService } from './google.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    oAuthAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    userProfile: {
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

// Mock OAuth2Client
const mockVerifyIdToken = vi.fn();
class MockOAuth2Client {
  verifyIdToken = mockVerifyIdToken;
}

describe('GoogleAuthService', () => {
  const service = new GoogleAuthService(new MockOAuth2Client() as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login existing linked user successfully', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'test@example.com', sub: 'google123', email_verified: true })
    });

    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue({
      providerAccountId: 'google123',
      user: { id: 'u1', status: 'ACTIVE' }
    } as any);

    const result = await service.verifyAndLogin('valid-token');
    
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) })
    );
  });

  it('should link unlinked existing user by email', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'test@example.com', sub: 'google456', email_verified: true })
    });

    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u2', email: 'test@example.com', status: 'ACTIVE' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u2' } as any);

    const result = await service.verifyAndLogin('valid-token');

    expect(result.success).toBe(true);
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u2', providerAccountId: 'google456' })
      })
    );
  });

  it('should register a entirely new user', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'new@example.com', sub: 'google789', email_verified: true, name: 'New User' })
    });

    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u3', status: 'ACTIVE' } as any);

    const result = await service.verifyAndLogin('valid-token');

    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: 'new@example.com' }) })
    );
    expect(prisma.userProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u3', displayName: 'New User' }) })
    );
  });

  it('should deny login for banned users', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'banned@example.com', sub: 'banned123' })
    });

    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue({
      providerAccountId: 'banned123',
      user: { id: 'u4', status: 'BANNED' }
    } as any);

    const result = await service.verifyAndLogin('valid-token');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('banned');
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('canSubmitReports should check phone verification', () => {
    expect(service.canSubmitReports({ status: 'ACTIVE', phoneVerifiedAt: new Date() } as any)).toBe(true);
    expect(service.canSubmitReports({ status: 'ACTIVE', phoneVerifiedAt: null } as any)).toBe(false);
    expect(service.canSubmitReports({ status: 'BANNED', phoneVerifiedAt: new Date() } as any)).toBe(false);
  });
});
