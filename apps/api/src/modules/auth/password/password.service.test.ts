import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordAuthService } from './password.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.all(actions)),
  },
}));

describe('PasswordAuthService', () => {
  const service = new PasswordAuthService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'u1' } as any);

    const result = await service.register('test@example.com', 'SecurePass123!');
    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          passwordHash: expect.any(String),
        }),
      })
    );
  });

  it('should obscure enumeration during registration', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as any);

    const result = await service.register('exist@example.com', 'Pass123');
    // Generic failure
    expect(result.success).toBe(false);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should login and reset failed attempts on success', async () => {
    // Generate valid hash for mock
    const validPassword = 'MySecretPassword';
    const hashMethod = (service as any).hashPassword.bind(service);
    const storedHash = hashMethod(validPassword);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u2',
      email: 'user@example.com',
      passwordHash: storedHash,
      failedLoginAttempts: 2,
      status: 'ACTIVE',
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    vi.mocked(prisma.session.create).mockResolvedValue({} as any);

    const result = await service.login('user@example.com', validPassword);
    
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();

    // Must reset failed attempts
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      })
    );
  });

  it('should obscure enumeration during login', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await service.login('unknown@example.com', 'pass');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password.');
  });

  it('should increment failed login attempts on wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u3',
      passwordHash: 'fake_hash:123',
      failedLoginAttempts: 0,
      status: 'ACTIVE',
    } as any);

    const result = await service.login('user@example.com', 'wrongpass');
    
    expect(result.success).toBe(false);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u3' },
        data: { failedLoginAttempts: 1, lockedUntil: null },
      })
    );
  });

  it('should lockout user after max failed attempts', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u4',
      passwordHash: 'fake_hash:123',
      failedLoginAttempts: 4, // next failure is 5 (max)
      status: 'ACTIVE',
    } as any);

    const result = await service.login('user@example.com', 'wrongpass');
    
    expect(result.success).toBe(false);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u4' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      })
    );
  });

  it('should obscure enumeration during password reset request', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await service.requestPasswordReset('nobody@example.com');
    // Success returned even though user doesn't exist
    expect(result.success).toBe(true);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('should process password reset with valid token', async () => {
    const rawToken = 'my_secret_token';
    const hashMethod = (service as any).hashString.bind(service);
    
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 't1',
      userId: 'u99',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // future
      usedAt: null,
    } as any);

    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

    const result = await service.resetPassword(rawToken, 'NewSecurePass123!');
    expect(result.success).toBe(true);

    // Checks that transaction executed
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
