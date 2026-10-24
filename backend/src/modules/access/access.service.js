import { prisma } from '@civiq/db';
import { can } from '@civiq/auth';
export class AccessService {
    /**
     * Builds an AuthContext for a given user by fetching their role assignments from the DB.
     */
    async getAuthContext(userId) {
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
    async checkPermission(userId, action, scope) {
        const context = await this.getAuthContext(userId);
        return can(context, action, scope);
    }
}
export const accessService = new AccessService();
