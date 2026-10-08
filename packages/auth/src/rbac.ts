import { Role } from '@civiq/db';

export type Permission =
  | 'issues:read'
  | 'issues:write'
  | 'issues:verify'
  | 'issues:delete'
  | 'users:read'
  | 'users:write'
  | 'organizations:read'
  | 'organizations:write'
  | 'roles:assign'
  | 'reports:read';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PLATFORM_SUPER_ADMIN: [
    'issues:read', 'issues:write', 'issues:verify', 'issues:delete',
    'users:read', 'users:write',
    'organizations:read', 'organizations:write',
    'roles:assign', 'reports:read',
  ],
  NATIONAL_ADMIN: [
    'issues:read', 'issues:write', 'issues:verify',
    'users:read',
    'organizations:read', 'organizations:write',
    'roles:assign', 'reports:read',
  ],
  STATE_ADMIN: [
    'issues:read', 'issues:write', 'issues:verify',
    'users:read',
    'organizations:read', 'organizations:write',
    'roles:assign', 'reports:read',
  ],
  DISTRICT_ULB_ADMIN: [
    'issues:read', 'issues:write', 'issues:verify',
    'users:read',
    'organizations:read',
    'roles:assign', 'reports:read',
  ],
  DEPARTMENT_OFFICER: [
    'issues:read', 'issues:write',
    'users:read',
    'reports:read',
  ],
  VERIFICATION_OFFICER: [
    'issues:read', 'issues:verify',
    'users:read',
  ],
  FIELD_SUPERVISOR: [
    'issues:read', 'issues:write',
    'users:read',
  ],
  FIELD_WORKER: [
    'issues:read', 'issues:write',
  ],
  DISASTER_COORDINATOR: [
    'issues:read', 'issues:write',
    'reports:read',
  ],
  AUDITOR: [
    'issues:read',
    'users:read',
    'organizations:read',
    'reports:read',
  ],
  CITIZEN: [
    'issues:read', 'issues:write',
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
