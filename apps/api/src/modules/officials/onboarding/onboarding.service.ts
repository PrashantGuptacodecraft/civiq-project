import { prisma, Role, InviteStatus, OfficialInvite } from '@civiq/db';
import { randomBytes, createHash } from 'crypto';

const INVITE_EXPIRY_DAYS = 7;

export class OfficialOnboardingService {
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generates a new invitation for an official
   */
  async inviteOfficial(params: {
    email: string;
    employeeIdentifier?: string;
    role: Role;
    organizationId: string;
    departmentId?: string;
    invitedById: string;
  }): Promise<{ success: boolean; inviteId?: string; rawToken?: string; error?: string }> {
    const { email, employeeIdentifier, role, organizationId, departmentId, invitedById } = params;

    const normalizedEmail = email.toLowerCase().trim();

    // Ensure inviter has authority (simplified logic for now; would normally integrate with access.service)
    const inviter = await prisma.user.findUnique({
      where: { id: invitedById },
      include: { roleAssignments: true }
    });

    if (!inviter || (inviter.role !== 'PLATFORM_SUPER_ADMIN' && inviter.role !== 'DISTRICT_ULB_ADMIN')) {
      return { success: false, error: 'Unauthorized to send invites.' };
    }

    // Check if pending invite already exists
    const existing = await prisma.officialInvite.findFirst({
      where: {
        email: normalizedEmail,
        organizationId,
        departmentId: departmentId ?? null,
        status: 'PENDING'
      }
    });

    if (existing) {
      if (existing.expiresAt > new Date()) {
        return { success: false, error: 'A pending invite already exists for this email.' };
      }
      // If expired, we could revoke it and issue new, or just issue a new one
      await prisma.officialInvite.update({
        where: { id: existing.id },
        data: { status: 'EXPIRED' }
      });
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashString(rawToken);
    
    const invite = await prisma.officialInvite.create({
      data: {
        email: normalizedEmail,
        employeeIdentifier: employeeIdentifier ?? null,
        role,
        organizationId,
        departmentId: departmentId ?? null,
        invitedById,
        tokenHash,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    // In reality, an email would be sent to `normalizedEmail` containing `rawToken`.
    return { success: true, inviteId: invite.id, rawToken };
  }

  /**
   * Accepts an invitation by linking it to a registered user
   */
  async acceptInvite(userId: string, rawToken: string): Promise<{ success: boolean; error?: string }> {
    const tokenHash = this.hashString(rawToken);

    const invite = await prisma.officialInvite.findUnique({
      where: { tokenHash }
    });

    if (!invite) {
      return { success: false, error: 'Invalid invitation token.' };
    }

    if (invite.status !== 'PENDING') {
      return { success: false, error: 'Invitation is no longer valid.' };
    }

    if (invite.expiresAt < new Date()) {
      await prisma.officialInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });
      return { success: false, error: 'Invitation has expired.' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // Execute in transaction: Update invite, assign role, potentially upgrade user baseline role
    await prisma.$transaction(async (tx) => {
      await tx.officialInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: userId,
          acceptedAt: new Date()
        }
      });

      // Avoid duplicates
      const existingAssignment = await tx.roleAssignment.findFirst({
        where: {
          userId,
          role: invite.role,
          organizationId: invite.organizationId,
          departmentId: invite.departmentId ?? null
        }
      });

      if (!existingAssignment) {
        await tx.roleAssignment.create({
          data: {
            userId,
            role: invite.role,
            organizationId: invite.organizationId,
            departmentId: invite.departmentId ?? null
          }
        });
      }

      // Upgrade user baseline role if they are currently just a CITIZEN
      if (user.role === 'CITIZEN' && invite.role !== 'CITIZEN') {
        await tx.user.update({
          where: { id: userId },
          data: { role: invite.role }
        });
      }
    });

    return { success: true };
  }

  /**
   * Revoke an invitation (for org admins)
   */
  async revokeInvite(adminId: string, inviteId: string): Promise<{ success: boolean; error?: string }> {
    const invite = await prisma.officialInvite.findUnique({ where: { id: inviteId } });
    if (!invite) return { success: false, error: 'Invite not found.' };

    await prisma.officialInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' }
    });

    return { success: true };
  }
}

export const onboardingService = new OfficialOnboardingService();
