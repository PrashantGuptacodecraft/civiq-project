import { prisma, User } from '@civiq/db';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';

const SESSION_EXPIRY_DAYS = 30;
const RESET_TOKEN_EXPIRY_HOURS = 1;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export class PasswordAuthService {
  /**
   * Generates a securely hashed version of a password using scrypt.
   */
  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  /**
   * Verifies a password against a stored hash.
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const derivedKey = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');

    if (derivedKey.length !== keyBuffer.length) return false;
    return timingSafeEqual(derivedKey, keyBuffer);
  }

  private generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Registers a new user with email and password.
   */
  async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Prevent enumeration by returning success blindly on the frontend,
      // but internally we just drop the request or send a "already registered" email
      // For this method, we return generic error.
      return { success: false, error: 'Registration failed.' };
    }

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: this.hashPassword(password),
      }
    });

    return { success: true };
  }

  /**
   * Login with email and password.
   */
  async login(email: string, password: string): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Generic error to prevent enumeration
    const genericError = 'Invalid email or password.';

    if (!user || !user.passwordHash) {
      return { success: false, error: genericError };
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return { success: false, error: 'Account is suspended or banned.' };
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { success: false, error: 'Account is temporarily locked due to too many failed attempts.' };
    }

    const isValid = this.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
      });

      return { success: false, error: genericError };
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

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

  /**
   * Request a password reset email.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // To prevent enumeration, we always return success.
    if (!user) {
      return { success: true };
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashString(resetToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      }
    });

    // In a real app, send an email with resetToken here.
    return { success: true };
  }

  /**
   * Reset a password using a valid token.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const tokenHash = this.hashString(token);

    const resetRequest = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!resetRequest || resetRequest.usedAt || resetRequest.expiresAt < new Date()) {
      return { success: false, error: 'Invalid or expired reset token.' };
    }

    // Update password and mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: {
          passwordHash: this.hashPassword(newPassword),
          failedLoginAttempts: 0,
          lockedUntil: null,
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRequest.id },
        data: { usedAt: new Date() }
      })
    ]);

    return { success: true };
  }
}

export const passwordAuthService = new PasswordAuthService();
