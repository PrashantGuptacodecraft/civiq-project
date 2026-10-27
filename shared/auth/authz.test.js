import { describe, it, expect } from 'vitest';
import { can } from './authz.js';
describe('Authorization (AuthZ)', () => {
    it('should deny by default if no role assignments', () => {
        const context = { userId: 'u1', roleAssignments: [] };
        expect(can(context, 'issues:read')).toBe(false);
    });
    it('should allow PLATFORM_SUPER_ADMIN all general actions', () => {
        const context = {
            userId: 'admin1',
            roleAssignments: [
                { role: 'PLATFORM_SUPER_ADMIN' },
            ],
        };
        expect(can(context, 'issues:delete')).toBe(true);
        expect(can(context, 'roles:assign')).toBe(true);
    });
    it('should restrict DISTRICT_ULB_ADMIN to specific scopes', () => {
        const context = {
            userId: 'ulb1',
            roleAssignments: [
                { role: 'DISTRICT_ULB_ADMIN', jurisdictionId: 'pune-504' },
            ],
        };
        // Correct scope
        expect(can(context, 'issues:verify', { jurisdictionId: 'pune-504' })).toBe(true);
        // Outside scope
        expect(can(context, 'issues:verify', { jurisdictionId: 'mumbai-518' })).toBe(false);
    });
    it('should enforce role boundaries (CITIZEN vs VERIFICATION_OFFICER)', () => {
        const citizen = {
            userId: 'c1',
            roleAssignments: [{ role: 'CITIZEN' }],
        };
        expect(can(citizen, 'issues:write')).toBe(true); // Citizens can report issues
        expect(can(citizen, 'issues:verify')).toBe(false); // Citizens cannot verify
        const officer = {
            userId: 'o1',
            roleAssignments: [{ role: 'VERIFICATION_OFFICER' }],
        };
        expect(can(officer, 'issues:verify')).toBe(true);
        expect(can(officer, 'roles:assign')).toBe(false); // Only higher admins can assign roles
    });
    it('should allow multi-role users to inherit highest permission for scope', () => {
        const context = {
            userId: 'multi1',
            roleAssignments: [
                { role: 'CITIZEN', jurisdictionId: null }, // global citizen
                { role: 'VERIFICATION_OFFICER', jurisdictionId: 'pune-504' },
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
        ];
        roles.forEach(role => {
            const ctx = {
                userId: `user-${role}`,
                roleAssignments: [{ role }],
            };
            // Basic sanity checks per role expectations
            if (role === 'PLATFORM_SUPER_ADMIN') {
                expect(can(ctx, 'issues:delete')).toBe(true);
            }
            else {
                expect(can(ctx, 'issues:delete')).toBe(false);
            }
            if (['CITIZEN', 'FIELD_WORKER', 'FIELD_SUPERVISOR', 'DEPARTMENT_OFFICER'].includes(role)) {
                expect(can(ctx, 'issues:write')).toBe(true);
            }
            if (['AUDITOR', 'PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'DISASTER_COORDINATOR'].includes(role)) {
                expect(can(ctx, 'reports:read')).toBe(true);
            }
            // Phase 49: Asset Registry permissions
            expect(can(ctx, 'assets:read')).toBe(true);
            if (['PLATFORM_SUPER_ADMIN', 'DISTRICT_ULB_ADMIN'].includes(role)) {
                expect(can(ctx, 'assets:delete')).toBe(true);
            } else {
                expect(can(ctx, 'assets:delete')).toBe(false);
            }
            // Phase 51: Maintenance & Financial Access permissions
            expect(can(ctx, 'maintenance:read')).toBe(true);
            if (['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'AUDITOR'].includes(role)) {
                expect(can(ctx, 'maintenance:costs:read')).toBe(true);
            } else {
                expect(can(ctx, 'maintenance:costs:read')).toBe(false);
            }
        });
    });

    it('should enforce asset write permissions and jurisdiction scoping', () => {
        const citizen = { userId: 'c1', roleAssignments: [{ role: 'CITIZEN' }] };
        expect(can(citizen, 'assets:write')).toBe(false);

        const deptOfficerPune = {
            userId: 'do1',
            roleAssignments: [{ role: 'DEPARTMENT_OFFICER', jurisdictionId: 'mh-pune-pmc' }],
        };
        // Allowed in Pune jurisdiction
        expect(can(deptOfficerPune, 'assets:write', { jurisdictionId: 'mh-pune-pmc' })).toBe(true);
        // Denied outside Pune jurisdiction
        expect(can(deptOfficerPune, 'assets:write', { jurisdictionId: 'mh-mumbai-mcgm' })).toBe(false);

        // Phase 51: Maintenance write jurisdiction scoping
        expect(can(deptOfficerPune, 'maintenance:write', { jurisdictionId: 'mh-pune-pmc' })).toBe(true);
        expect(can(deptOfficerPune, 'maintenance:write', { jurisdictionId: 'mh-mumbai-mcgm' })).toBe(false);
        expect(can(citizen, 'maintenance:write')).toBe(false);
    });
});
