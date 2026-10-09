import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpService } from './otp.service';
import { prisma } from '@civiq/db';
import { createHash } from 'crypto';

vi.mock('@civiq/db', () => ({
  prisma: {
    otpChallenge: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

describe('OtpService', () => {
  const service = new OtpService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate OTP and enforce cooldown', async () => {
    const recentChallenge = {
      id: 'c1',
      phone: '1234567890',
      createdAt: new Date(Date.now() - 10 * 1000) // 10 seconds ago
    };
    
    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValueOnce(recentChallenge as any);

    const result1 = await service.requestOtp('1234567890');
    expect(result1.success).toBe(false);
    expect(result1.retryAfter).toBeGreaterThan(0);
    expect(prisma.otpChallenge.create).not.toHaveBeenCalled();

    // Mock no recent challenge
    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValueOnce(null);
    const result2 = await service.requestOtp('1234567890');
    expect(result2.success).toBe(true);
    expect(prisma.otpChallenge.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '1234567890',
          otpHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    );
  });

  it('should verify OTP and issue session', async () => {
    const rawOtp = '123456';
    const otpHash = createHash('sha256').update(rawOtp).digest('hex');
    
    const challenge = {
      id: 'c2',
      phone: '1234567890',
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000) // valid
    };

    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValue(challenge as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', phoneVerifiedAt: new Date() } as any);
    
    const result = await service.verifyOtp('1234567890', rawOtp);
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();

    expect(prisma.otpChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c2' },
        data: { verifiedAt: expect.any(Date) }
      })
    );

    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          tokenHash: expect.any(String),
        })
      })
    );
  });

  it('should reject incorrect OTP and increment attempts', async () => {
    const rawOtp = '123456';
    const wrongOtp = '000000';
    const otpHash = createHash('sha256').update(rawOtp).digest('hex');
    
    const challenge = {
      id: 'c3',
      phone: '1234567890',
      otpHash,
      attempts: 2,
      expiresAt: new Date(Date.now() + 60 * 1000)
    };

    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValue(challenge as any);
    
    const result = await service.verifyOtp('1234567890', wrongOtp);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid OTP.');

    expect(prisma.otpChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c3' },
        data: { attempts: 3 }
      })
    );
  });

  it('should block brute-force attempts after limit reached', async () => {
    const challenge = {
      id: 'c4',
      phone: '1234567890',
      otpHash: 'dummy',
      attempts: 5, // MAX_ATTEMPTS reached
      expiresAt: new Date(Date.now() + 60 * 1000)
    };

    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValue(challenge as any);
    
    const result = await service.verifyOtp('1234567890', '111111');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Too many failed attempts');
  });

  it('should reject expired OTPs', async () => {
    const challenge = {
      id: 'c5',
      phone: '1234567890',
      otpHash: 'dummy',
      attempts: 0,
      expiresAt: new Date(Date.now() - 60 * 1000) // expired 1 minute ago
    };

    vi.mocked(prisma.otpChallenge.findFirst).mockResolvedValue(challenge as any);
    
    const result = await service.verifyOtp('1234567890', '111111');
    expect(result.success).toBe(false);
    expect(result.error).toBe('OTP has expired.');
  });
});
