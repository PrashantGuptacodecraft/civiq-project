import { prisma, User, UserProfile, PrivacyPreference, AccountStatus, UserVerificationLevel } from '@civiq/db';

export class UserService {
  /**
   * Retrieves a user by ID, optionally including profile and privacy preferences.
   */
  async getUserById(userId: string, includeProfile = false, includePrivacy = false) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: includeProfile,
        privacyPreferences: includePrivacy,
      },
    });
  }

  /**
   * Update the user's account status (e.g., SUSPENDED, BANNED).
   */
  async updateAccountStatus(userId: string, status: AccountStatus): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  /**
   * Mark a specific contact method as verified.
   */
  async markContactVerified(userId: string, method: 'email' | 'phone'): Promise<User> {
    const data: any = {};
    if (method === 'email') data.emailVerifiedAt = new Date();
    if (method === 'phone') data.phoneVerifiedAt = new Date();
    
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Update the user's KYC verification level.
   */
  async updateVerificationLevel(userId: string, level: UserVerificationLevel): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { verificationLevel: level },
    });
  }

  /**
   * Record the user's consent to the terms of service and/or privacy policy.
   */
  async recordConsent(userId: string, terms: boolean, privacy: boolean): Promise<User> {
    const data: any = {};
    if (terms) data.termsAcceptedAt = new Date();
    if (privacy) data.privacyPolicyAcceptedAt = new Date();

    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Update the user's public-facing profile fields.
   */
  async updateProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    return prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        displayName: profileData.displayName || 'Anonymous User',
        ...profileData,
      },
    });
  }

  /**
   * Update the user's private settings/preferences.
   */
  async updatePrivacyPreferences(userId: string, preferences: Partial<Omit<PrivacyPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    return prisma.privacyPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });
  }
}

export const userService = new UserService();
