export const ROLE_PERMISSIONS = {
    PLATFORM_SUPER_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify', 'issues:delete',
        'users:read', 'users:write',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write', 'assets:delete',
        'maintenance:read', 'maintenance:write', 'maintenance:costs:read',
    ],
    NATIONAL_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write',
        'maintenance:read', 'maintenance:write', 'maintenance:costs:read',
    ],
    STATE_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read', 'organizations:write',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write',
        'maintenance:read', 'maintenance:write', 'maintenance:costs:read',
    ],
    DISTRICT_ULB_ADMIN: [
        'issues:read', 'issues:write', 'issues:verify',
        'users:read',
        'organizations:read',
        'roles:assign', 'reports:read',
        'assets:read', 'assets:write', 'assets:delete',
        'maintenance:read', 'maintenance:write', 'maintenance:costs:read',
    ],
    DEPARTMENT_OFFICER: [
        'issues:read', 'issues:write',
        'users:read',
        'reports:read',
        'assets:read', 'assets:write',
        'maintenance:read', 'maintenance:write', 'maintenance:costs:read',
    ],
    VERIFICATION_OFFICER: [
        'issues:read', 'issues:verify',
        'users:read',
        'assets:read',
        'maintenance:read',
    ],
    FIELD_SUPERVISOR: [
        'issues:read', 'issues:write',
        'users:read',
        'assets:read',
        'maintenance:read', 'maintenance:write',
    ],
    FIELD_WORKER: [
        'issues:read', 'issues:write',
        'assets:read',
        'maintenance:read',
    ],
    DISASTER_COORDINATOR: [
        'issues:read', 'issues:write',
        'reports:read',
        'assets:read',
        'maintenance:read',
    ],
    AUDITOR: [
        'issues:read',
        'users:read',
        'organizations:read',
        'reports:read',
        'assets:read',
        'maintenance:read', 'maintenance:costs:read',
    ],
    CITIZEN: [
        'issues:read', 'issues:write',
        'assets:read',
        'maintenance:read',
    ],
};
export function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
}
