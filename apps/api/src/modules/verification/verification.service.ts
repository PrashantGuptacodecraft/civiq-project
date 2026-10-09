import { prisma, VerificationStatus, Role } from '@civiq/db';

const ALLOWED_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  PENDING: ['IN_REVIEW', 'DUPLICATE', 'SUSPICIOUS'],
  IN_REVIEW: ['VERIFIED', 'REJECTED', 'NEEDS_EVIDENCE', 'DUPLICATE', 'SUSPICIOUS'],
  NEEDS_EVIDENCE: ['IN_REVIEW', 'REJECTED'],
  VERIFIED: ['IN_REVIEW'], // Can reopen if new conflicting info arises
  REJECTED: ['IN_REVIEW'],
  DUPLICATE: ['IN_REVIEW'],
  SUSPICIOUS: ['IN_REVIEW'],
};

const REQUIRED_ROLES: Role[] = [
  'PLATFORM_SUPER_ADMIN',
  'NATIONAL_ADMIN',
  'STATE_ADMIN',
  'DISTRICT_ULB_ADMIN',
  'DEPARTMENT_OFFICER',
  'VERIFICATION_OFFICER'
];

export class VerificationService {
  /**
   * Safe transition of an issue's verification state
   */
  async transitionStatus(params: {
    issueId: string;
    newStatus: VerificationStatus;
    changedById: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { issueId, newStatus, changedById, reason } = params;

    const user = await prisma.user.findUnique({ where: { id: changedById } });
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    if (!REQUIRED_ROLES.includes(user.role)) {
      return { success: false, error: 'Unauthorized to change verification status.' };
    }

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return { success: false, error: 'Issue not found.' };
    }

    const previousStatus = issue.verificationStatus;

    if (previousStatus === newStatus) {
      return { success: false, error: 'Issue is already in this status.' };
    }

    const allowed = ALLOWED_TRANSITIONS[previousStatus] || [];
    if (!allowed.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${previousStatus} to ${newStatus}.` };
    }

    await prisma.$transaction(async (tx) => {
      // Create history log
      await tx.verificationHistory.create({
        data: {
          issueId,
          previousStatus,
          newStatus,
          changedById,
          reason: reason ?? null,
        }
      });

      // Update issue, increment version
      await tx.issue.update({
        where: { id: issueId, version: issue.version }, // Optimistic lock
        data: {
          verificationStatus: newStatus,
          version: { increment: 1 }
        }
      });
    });

    return { success: true };
  }
}

export const verificationService = new VerificationService();
