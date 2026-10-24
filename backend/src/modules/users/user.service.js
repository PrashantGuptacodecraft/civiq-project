import { prisma } from '@civiq/db';
export class UserService {
    /**
     * Retrieves a user by ID, optionally including profile and privacy preferences.
     */
    async getUserById(userId, includeProfile = false, includePrivacy = false) {
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
    async updateAccountStatus(userId, status) {
        return prisma.user.update({
            where: { id: userId },
            data: { status },
        });
    }
    /**
     * Mark a specific contact method as verified.
     */
    async markContactVerified(userId, method) {
        const data = {};
        if (method === 'email')
            data.emailVerifiedAt = new Date();
        if (method === 'phone')
            data.phoneVerifiedAt = new Date();
        return prisma.user.update({
            where: { id: userId },
            data,
        });
    }
    /**
     * Update the user's KYC verification level.
     */
    async updateVerificationLevel(userId, level) {
        return prisma.user.update({
            where: { id: userId },
            data: { verificationLevel: level },
        });
    }
    /**
     * Record the user's consent to the terms of service and/or privacy policy.
     */
    async recordConsent(userId, terms, privacy) {
        const data = {};
        if (terms)
            data.termsAcceptedAt = new Date();
        if (privacy)
            data.privacyPolicyAcceptedAt = new Date();
        return prisma.user.update({
            where: { id: userId },
            data,
        });
    }
    /**
     * Update the user's public-facing profile fields.
     */
    async updateProfile(userId, profileData) {
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
    async updatePrivacyPreferences(userId, preferences) {
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
