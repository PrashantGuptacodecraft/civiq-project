import { prisma, RoleAssignment } from '@civiq/db';
import { AuthContext, can, Permission, ResourceScope } from '@civiq/auth';

export class AccessService {
  /**
   * Builds an AuthContext for a given user by fetching their role assignments from the DB.
   */
  async getAuthContext(userId: string): Promise<AuthContext> {
    const assignments = await prisma.roleAssignment.findMany({
      where: { userId },
    });

    return {
      userId,
      roleAssignments: assignments,
    };
  }

  /**
   * Helper to evaluate permission against the database context directly.
   */
  async checkPermission(
    userId: string,
    action: Permission,
    scope?: ResourceScope
  ): Promise<boolean> {
    const context = await this.getAuthContext(userId);
    return can(context, action, scope);
  }
}

export const accessService = new AccessService();
