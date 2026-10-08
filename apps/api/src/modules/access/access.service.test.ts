import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessService } from './access.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    roleAssignment: {
      findMany: vi.fn(),
    },
  },
}));

describe('AccessService', () => {
  const service = new AccessService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch context and resolve permission', async () => {
    const mockAssignments = [
      { id: 'ra1', userId: 'u1', role: 'PLATFORM_SUPER_ADMIN', jurisdictionId: null, organizationId: null, departmentId: null }
    ];
    vi.mocked(prisma.roleAssignment.findMany).mockResolvedValue(mockAssignments as any);

    const hasAccess = await service.checkPermission('u1', 'issues:delete');
    
    expect(prisma.roleAssignment.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(hasAccess).toBe(true);
  });

  it('should deny if no assignments exist in DB', async () => {
    vi.mocked(prisma.roleAssignment.findMany).mockResolvedValue([]);

    const hasAccess = await service.checkPermission('u2', 'issues:read');
    
    expect(prisma.roleAssignment.findMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
    expect(hasAccess).toBe(false);
  });
});
