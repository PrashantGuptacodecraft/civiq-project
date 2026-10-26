export const ROLE_PERMISSIONS = {
    PLATFORM_SUPER_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify', 'issues:delete',
        'users:read', 'users:write',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write', 'assets:delete',
    ],
    NATIONAL_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write',
    ],
    STATE_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write',
    ],
    DISTRICT_ULB_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write', 'assets:delete',
    ],
    DEPARTMENT_OFFICER: [
        'issues:read', 'issues:write',
        'users:read',
        'reports:read',
        'assets:read', 'assets:write',
    ],
    VERIFICATION_OFFICER: [
        'issues:read', 'issues:verify',
        'users:read',
        'assets:read',
    ],
    FIELD_SUPERVISOR: [
        'issues:read', 'issues:write',
        'users:read',
        'assets:read',
    ],
    FIELD_WORKER: [
        'issues:read', 'issues:write',
        'assets:read',
    ],
    DISASTER_COORDINATOR: [
        'issues:read', 'issues:write',
        'reports:read',
        'assets:read',
    ],
    AUDITOR: [
        'issues:read',
        'users:read',
        'organizations:read',
        'reports:read',
        'assets:read',
    ],
    CITIZEN: [
        'issues:read', 'issues:write',
        'assets:read',
    ],
};
export function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
}
