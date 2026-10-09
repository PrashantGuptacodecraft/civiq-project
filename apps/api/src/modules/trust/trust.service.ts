import { prisma, TrustLevel, TrustProfile, UserVerificationLevel } from '@civiq/db';

export class TrustService {
  /**
   * Safe mapping from score to TrustLevel
   */
  determineTrustLevel(score: number): TrustLevel {
    if (score < 0) return 'SUSPENDED';
    if (score < 30) return 'FLAGGED';
    if (score < 70) return 'NEW';
    if (score < 150) return 'ESTABLISHED';
    return 'TRUSTED';
  }

  /**
   * Core scoring algorithm. Deterministic and repeatable.
   */
  async calculateTrustScore(userId: string): Promise<{
    trustScore: number;
    validReports: number;
    rejectedReports: number;
    confirmedAbuse: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { verificationLevel: true }
    });

    if (!user) throw new Error('User not found');

    let baseScore = 50.0;

    // Boost for identity verification
    if (user.verificationLevel === 'BASIC_VERIFIED') {
      baseScore += 20;
    } else if (user.verificationLevel === 'KYC_VERIFIED') {
      baseScore += 50;
    }

    // Retrieve report history
    const issues = await prisma.issue.findMany({
      where: { reportedById: userId },
      select: { verificationStatus: true }
    });

    let validReports = 0;
    let rejectedReports = 0;
    let confirmedAbuse = 0;

    for (const issue of issues) {
      if (issue.verificationStatus === 'VERIFIED') {
        validReports++;
      } else if (issue.verificationStatus === 'REJECTED') {
        rejectedReports++;
      } else if (issue.verificationStatus === 'SUSPICIOUS') {
        confirmedAbuse++;
      }
    }

    // Add scoring factors
    baseScore += (validReports * 5);
    baseScore -= (rejectedReports * 5);
    baseScore -= (confirmedAbuse * 50);

    return {
      trustScore: baseScore,
      validReports,
      rejectedReports,
      confirmedAbuse
    };
  }

  /**
   * Recalculates and persists a user's trust profile based on their current history
   */
  async updateTrustProfile(userId: string): Promise<TrustProfile> {
    const metrics = await this.calculateTrustScore(userId);
    const newLevel = this.determineTrustLevel(metrics.trustScore);

    const profile = await prisma.trustProfile.upsert({
      where: { userId },
      create: {
        userId,
        trustScore: metrics.trustScore,
        trustLevel: newLevel,
        validReports: metrics.validReports,
        rejectedReports: metrics.rejectedReports,
        confirmedAbuse: metrics.confirmedAbuse,
        lastRecalculatedAt: new Date()
      },
      update: {
        trustScore: metrics.trustScore,
        trustLevel: newLevel,
        validReports: metrics.validReports,
        rejectedReports: metrics.rejectedReports,
        confirmedAbuse: metrics.confirmedAbuse,
        lastRecalculatedAt: new Date()
      }
    });

    // Mirror suspension on the core user record if trust falls below 0
    if (newLevel === 'SUSPENDED') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' }
      });
    }

    return profile;
  }
}

export const trustService = new TrustService();
