import { describe, it, expect } from 'vitest';
import { can, AuthContext } from './authz';
import { RoleAssignment } from '@civiq/db';

describe('Authorization (AuthZ)', () => {
  it('should deny by default if no role assignments', () => {
    const context: AuthContext = { userId: 'u1', roleAssignments: [] };
    expect(can(context, 'issues:read')).toBe(false);
  });

  it('should allow PLATFORM_SUPER_ADMIN all general actions', () => {
    const context: AuthContext = {
      userId: 'admin1',
      roleAssignments: [
        { role: 'PLATFORM_SUPER_ADMIN' } as RoleAssignment,
      ],
    };
    expect(can(context, 'issues:delete')).toBe(true);
    expect(can(context, 'roles:assign')).toBe(true);
  });

  it('should restrict DISTRICT_ULB_ADMIN to specific scopes', () => {
    const context: AuthContext = {
      userId: 'ulb1',
      roleAssignments: [
        { role: 'DISTRICT_ULB_ADMIN', jurisdictionId: 'pune-504' } as RoleAssignment,
      ],
    };

    // Correct scope
    expect(can(context, 'issues:verify', { jurisdictionId: 'pune-504' })).toBe(true);
    
    // Outside scope
    expect(can(context, 'issues:verify', { jurisdictionId: 'mumbai-518' })).toBe(false);
  });

  it('should enforce role boundaries (CITIZEN vs VERIFICATION_OFFICER)', () => {
    const citizen: AuthContext = {
      userId: 'c1',
      roleAssignments: [{ role: 'CITIZEN' } as RoleAssignment],
    };

    expect(can(citizen, 'issues:write')).toBe(true); // Citizens can report issues
    expect(can(citizen, 'issues:verify')).toBe(false); // Citizens cannot verify

    const officer: AuthContext = {
      userId: 'o1',
      roleAssignments: [{ role: 'VERIFICATION_OFFICER' } as RoleAssignment],
    };

    expect(can(officer, 'issues:verify')).toBe(true);
    expect(can(officer, 'roles:assign')).toBe(false); // Only higher admins can assign roles
  });

  it('should allow multi-role users to inherit highest permission for scope', () => {
    const context: AuthContext = {
      userId: 'multi1',
      roleAssignments: [
        { role: 'CITIZEN', jurisdictionId: null } as RoleAssignment, // global citizen
        { role: 'VERIFICATION_OFFICER', jurisdictionId: 'pune-504' } as RoleAssignment,
      ],
    };

    // Can write globally (from citizen)
    expect(can(context, 'issues:write')).toBe(true);
    
    // Can verify in Pune
    expect(can(context, 'issues:verify', { jurisdictionId: 'pune-504' })).toBe(true);
    
    // Cannot verify in Mumbai
    expect(can(context, 'issues:verify', { jurisdictionId: 'mumbai-518' })).toBe(false);
  });

  it('should validate permissions for all planned roles in the matrix', () => {
    const roles = [
      'PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN',
      'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'VERIFICATION_OFFICER',
      'FIELD_SUPERVISOR', 'FIELD_WORKER', 'DISASTER_COORDINATOR',
      'AUDITOR', 'CITIZEN'
    ] as const;

    roles.forEach(role => {
      const ctx: AuthContext = {
        userId: `user-${role}`,
        roleAssignments: [{ role } as RoleAssignment],
      };
      
      // Basic sanity checks per role expectations
      if (role === 'PLATFORM_SUPER_ADMIN') {
        expect(can(ctx, 'issues:delete')).toBe(true);
      } else {
        expect(can(ctx, 'issues:delete')).toBe(false);
      }

      if (['CITIZEN', 'FIELD_WORKER', 'FIELD_SUPERVISOR', 'DEPARTMENT_OFFICER'].includes(role)) {
        expect(can(ctx, 'issues:write')).toBe(true);
      }

      if (['AUDITOR', 'PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'DISASTER_COORDINATOR'].includes(role)) {
        expect(can(ctx, 'reports:read')).toBe(true);
      }
    });
  });
});
