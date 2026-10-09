import { prisma, Session } from '@civiq/db';
import { createHash } from 'crypto';

export class SessionService {
  /**
   * Helper to hash session tokens
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Lists all active (non-revoked, non-expired) sessions for a user
   */
  async listSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActiveAt: 'desc' }
    });
  }

  /**
   * Revoke a specific session (Logout)
   */
  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session || session.userId !== userId) {
      return false; // Not found or unauthorized
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true }
    });

    return true;
  }

  /**
   * Revoke all sessions for a user, optionally keeping one alive (Logout All Devices)
   */
  async revokeAllSessions(userId: string, keepSessionId?: string): Promise<void> {
    const whereClause: any = {
      userId,
      isRevoked: false
    };
    if (keepSessionId) {
      whereClause.id = { not: keepSessionId };
    }

    await prisma.session.updateMany({
      where: whereClause,
      data: { isRevoked: true }
    });
  }

  /**
   * Rotate/Refresh a session: marks it active, extends expiry
   */
  async touchSession(token: string, extensionDays = 30): Promise<Session | null> {
    const tokenHash = this.hashString(token);
    
    const session = await prisma.session.findUnique({ where: { tokenHash } });
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return null;
    }

    // Extend session
    const newExpiry = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000);

    return prisma.session.update({
      where: { id: session.id },
      data: {
        lastActiveAt: new Date(),
        expiresAt: newExpiry
      }
    });
  }

  /**
   * Check if a session meets sensitive action re-auth requirements
   * (e.g., must have been authenticated in the last `maxAgeMinutes`)
   */
  async requireReauth(token: string, maxAgeMinutes: number = 5): Promise<boolean> {
    const tokenHash = this.hashString(token);
    const session = await prisma.session.findUnique({ where: { tokenHash } });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return false;
    }

    const ageInMinutes = (Date.now() - session.authenticatedAt.getTime()) / (1000 * 60);
    return ageInMinutes <= maxAgeMinutes;
  }

  /**
   * Creates a session with device tracking
   */
  async createSession(userId: string, token: string, deviceInfo?: string, ipAddress?: string): Promise<Session> {
    const tokenHash = this.hashString(token);
    
    return prisma.session.create({
      data: {
        userId,
        tokenHash,
        deviceInfo: deviceInfo ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }
}

export const sessionService = new SessionService();
