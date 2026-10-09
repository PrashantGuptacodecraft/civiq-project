import { prisma } from '@civiq/db';
import { randomBytes, createHash } from 'crypto';

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const SESSION_EXPIRY_DAYS = 30;

export class OtpService {
  /**
   * Helper to hash tokens or OTPs using SHA-256 (no salt needed for temporary random tokens)
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generates a numeric OTP
   */
  private generateNumericOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  }

  /**
   * Generates a secure random session token
   */
  private generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Send/generate an OTP for a given phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; retryAfter?: number; error?: string }> {
    // Check recent requests for cooldown rate-limiting
    const recentChallenge = await prisma.otpChallenge.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (recentChallenge) {
      const secondsSinceLast = (Date.now() - recentChallenge.createdAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return {
          success: false,
          retryAfter: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast),
          error: 'Please wait before requesting a new OTP.',
        };
      }
    }

    const rawOtp = this.generateNumericOtp();
    const otpHash = this.hashString(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpChallenge.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      }
    });

    // In a real app, we would dispatch an SMS here (do not log rawOtp)
    // For local dev/testing, we might return it to the test or log a masked version
    
    return { success: true };
  }

  /**
   * Verify an OTP and issue a session if valid
   */
  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return { success: false, error: 'No active OTP found.' };
    }

    if (challenge.expiresAt < new Date()) {
      return { success: false, error: 'OTP has expired.' };
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    const inputHash = this.hashString(otp);

    if (inputHash !== challenge.otpHash) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: challenge.attempts + 1 },
      });
      return { success: false, error: 'Invalid OTP.' };
    }

    // Mark verified
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    } else if (!user.phoneVerifiedAt) {
      // Mark phone as verified if it wasn't
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() }
      });
    }

    // Issue session
    const sessionToken = this.generateSessionToken();
    const tokenHash = this.hashString(sessionToken);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      }
    });

    return { success: true, sessionToken };
  }
}

export const otpService = new OtpService();
