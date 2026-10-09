import { prisma, User } from '@civiq/db';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, createHash } from 'crypto';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
const SESSION_EXPIRY_DAYS = 30;

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(clientOverride?: OAuth2Client) {
    this.client = clientOverride || new OAuth2Client(CLIENT_ID);
  }

  /**
   * Helper to hash session tokens securely.
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Verify Google ID token, link or create user, and issue session.
   */
  async verifyAndLogin(idToken: string): Promise<{ success: boolean; sessionToken?: string; user?: User; error?: string }> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        return { success: false, error: 'Invalid Google payload.' };
      }

      const email = payload.email;
      const googleUserId = payload.sub;

      // Check if OAuth account exists
      let oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: googleUserId,
          }
        },
        include: { user: true }
      });

      let user: User | null = null;

      if (oauthAccount) {
        user = oauthAccount.user;
      } else {
        // Find existing user by email
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Mark email verified if it wasn't
          if (!user.emailVerifiedAt && payload.email_verified) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { emailVerifiedAt: new Date() }
            });
          }
          // Link new provider account
          await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerAccountId: googleUserId,
            }
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              emailVerifiedAt: payload.email_verified ? new Date() : null,
            }
          });

          // Create OAuth linkage
          await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerAccountId: googleUserId,
            }
          });

          // Seed basic profile
          if (payload.name || payload.picture) {
            await prisma.userProfile.create({
              data: {
                userId: user.id,
                displayName: payload.name || 'Citizen',
                avatarUrl: payload.picture || null,
              }
            });
          }
        }
      }

      // Check if banned
      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        return { success: false, error: 'Account is suspended or banned.' };
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

      return { success: true, sessionToken, user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Helper to determine if user can submit issues (requires mobile verification)
   */
  canSubmitReports(user: User): boolean {
    return user.status === 'ACTIVE' && user.phoneVerifiedAt !== null;
  }
}

export const googleAuthService = new GoogleAuthService();
