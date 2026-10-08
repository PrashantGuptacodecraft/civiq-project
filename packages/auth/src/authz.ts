import { Permission, getPermissionsForRole } from './rbac';
import { RoleAssignment } from '@civiq/db';

export interface AuthContext {
  userId: string;
  roleAssignments: RoleAssignment[];
}

export interface ResourceScope {
  jurisdictionId?: string | null;
  organizationId?: string | null;
  departmentId?: string | null;
}

/**
 * Evaluates whether an AuthContext (user) is allowed to perform a given Action
 * on a resource that belongs to the given ResourceScope.
 * 
 * Deny-by-default authorization helper.
 */
export function can(
  context: AuthContext,
  action: Permission,
  resourceScope?: ResourceScope
): boolean {
  if (!context.roleAssignments || context.roleAssignments.length === 0) {
    return false; // Deny by default
  }

  // A user is allowed if AT LEAST ONE role assignment grants the permission AND matches the scope
  for (const assignment of context.roleAssignments) {
    const permissions = getPermissionsForRole(assignment.role);
    if (!permissions.includes(action)) {
      continue;
    }

    // Check scope if the resource has a scope
    if (resourceScope) {
      const matchesJurisdiction =
        !assignment.jurisdictionId || assignment.jurisdictionId === resourceScope.jurisdictionId;
      const matchesOrganization =
        !assignment.organizationId || assignment.organizationId === resourceScope.organizationId;
      const matchesDepartment =
        !assignment.departmentId || assignment.departmentId === resourceScope.departmentId;

      if (matchesJurisdiction && matchesOrganization && matchesDepartment) {
        return true;
      }
    } else {
      // If resource has no specific scope required, we consider the permission granted 
      // if the assignment has the permission. (Or we could require global scope, but 
      // typically if we check a global action without scope, any role having it suffices).
      return true;
    }
  }

  return false;
}
