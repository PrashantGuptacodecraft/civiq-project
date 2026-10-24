import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateHaversineDistanceKm, workerAssignmentEngine, } from './assignment.engine.js';
import { workerEligibilityEngine } from './eligibility.engine.js';
import { AssignmentService } from './assignment.service.js';
import { prisma } from '@civiq/db';
vi.mock('@civiq/db', () => ({
    prisma: {
        issue: {
            update: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));
describe('Worker Eligibility & Assignment Engine', () => {
    const jurisdictionNorth = 'jur-delhi-north';
    const jurisdictionSouth = 'jur-delhi-south';
    const deptRoads = 'dept-pwd-north';
    const deptWater = 'dept-djb-north';
    // Base coordinates: Connaught Place, New Delhi (28.6315, 77.2167)
    const incidentLocation = { latitude: 28.6315, longitude: 77.2167 };
    const sampleWorkers = [
        {
            id: 'worker-rajesh-road-expert',
            name: 'Rajesh Kumar (Road Specialist)',
            role: 'FIELD_WORKER',
            departmentId: deptRoads,
            jurisdictionId: jurisdictionNorth,
            skills: ['roads_pothole', 'roads_footpath_damage', 'asphalt_patching'],
            coverageJurisdictionIds: [jurisdictionNorth],
            currentLocation: { latitude: 28.635, longitude: 77.22 }, // ~0.5 km away
            availability: {
                status: 'AVAILABLE',
                maxConcurrentWorkload: 5,
            },
            workload: {
                activeAssignmentsCount: 1,
                pendingCriticalCount: 0,
                maxCapacity: 5,
                capacityUtilization: 0.2,
            },
        },
        {
            id: 'worker-vikram-road-general',
            name: 'Vikram Singh (General PWD Worker)',
            role: 'FIELD_WORKER',
            departmentId: deptRoads,
            jurisdictionId: jurisdictionNorth,
            skills: ['roads_*', 'general_field_worker'],
            coverageJurisdictionIds: [jurisdictionNorth],
            currentLocation: { latitude: 28.65, longitude: 77.23 }, // ~2.4 km away
            availability: {
                status: 'AVAILABLE',
                maxConcurrentWorkload: 5,
            },
            workload: {
                activeAssignmentsCount: 0,
                pendingCriticalCount: 0,
                maxCapacity: 5,
                capacityUtilization: 0.0,
            },
        },
        {
            id: 'worker-amit-busy',
            name: 'Amit Verma (Busy Worker)',
            role: 'FIELD_WORKER',
            departmentId: deptRoads,
            jurisdictionId: jurisdictionNorth,
            skills: ['roads_pothole'],
            coverageJurisdictionIds: [jurisdictionNorth],
            currentLocation: { latitude: 28.632, longitude: 77.217 },
            availability: {
                status: 'AVAILABLE',
                maxConcurrentWorkload: 4,
            },
            workload: {
                activeAssignmentsCount: 4, // At maximum capacity
                pendingCriticalCount: 1,
                maxCapacity: 4,
                capacityUtilization: 1.0,
            },
        },
        {
            id: 'worker-sunil-on-leave',
            name: 'Sunil Sharma (On Leave)',
            role: 'FIELD_WORKER',
            departmentId: deptRoads,
            jurisdictionId: jurisdictionNorth,
            skills: ['roads_pothole'],
            coverageJurisdictionIds: [jurisdictionNorth],
            availability: {
                status: 'ON_LEAVE',
                maxConcurrentWorkload: 5,
            },
            workload: {
                activeAssignmentsCount: 0,
                pendingCriticalCount: 0,
                maxCapacity: 5,
                capacityUtilization: 0.0,
            },
        },
        {
            id: 'worker-water-specialist',
            name: 'Manoj Gupta (Water Board)',
            role: 'FIELD_WORKER',
            departmentId: deptWater, // Different department
            jurisdictionId: jurisdictionNorth,
            skills: ['water_pipeline_leak', 'water_no_supply'],
            coverageJurisdictionIds: [jurisdictionNorth],
            availability: {
                status: 'AVAILABLE',
                maxConcurrentWorkload: 5,
            },
            workload: {
                activeAssignmentsCount: 1,
                pendingCriticalCount: 0,
                maxCapacity: 5,
                capacityUtilization: 0.2,
            },
        },
        {
            id: 'worker-south-delhi',
            name: 'Pradeep Yadav (South Delhi)',
            role: 'FIELD_WORKER',
            departmentId: deptRoads,
            jurisdictionId: jurisdictionSouth, // Different jurisdiction
            skills: ['roads_pothole'],
            coverageJurisdictionIds: [jurisdictionSouth],
            availability: {
                status: 'AVAILABLE',
                maxConcurrentWorkload: 5,
            },
            workload: {
                activeAssignmentsCount: 0,
                pendingCriticalCount: 0,
                maxCapacity: 5,
                capacityUtilization: 0.0,
            },
        },
    ];
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Haversine Distance Calculations', () => {
        it('accurately computes Haversine GPS distances', () => {
            // Distance between Connaught Place (28.6315, 77.2167) and India Gate (28.6129, 77.2295) is ~2.4 km
            const distance = calculateHaversineDistanceKm(28.6315, 77.2167, 28.6129, 77.2295);
            expect(distance).toBeGreaterThan(2.0);
            expect(distance).toBeLessThan(3.0);
        });
        it('returns 0 for identical coordinates', () => {
            const distance = calculateHaversineDistanceKm(28.6315, 77.2167, 28.6315, 77.2167);
            expect(distance).toBe(0);
        });
    });
    describe('Worker Eligibility Engine (Hard Constraints)', () => {
        it('marks active worker with skills, jurisdiction, and capacity as eligible', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[0], {
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
            });
            expect(result.isEligible).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });
        it('rejects worker who is ON_LEAVE', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[3], {
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
            });
            expect(result.isEligible).toBe(false);
            expect(result.reasons.some((r) => r.includes('ON_LEAVE'))).toBe(true);
        });
        it('rejects worker who has reached maximum concurrent workload capacity', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[2], {
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
            });
            expect(result.isEligible).toBe(false);
            expect(result.reasons.some((r) => r.includes('maximum concurrent workload'))).toBe(true);
        });
        it('rejects worker from a different department', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[4], {
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
            });
            expect(result.isEligible).toBe(false);
            expect(result.reasons.some((r) => r.includes('Department mismatch'))).toBe(true);
        });
        it('rejects worker whose jurisdiction and coverage areas do not cover the issue', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[5], {
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
            });
            expect(result.isEligible).toBe(false);
            expect(result.reasons.some((r) => r.includes('Jurisdiction mismatch'))).toBe(true);
        });
        it('rejects worker lacking skill qualification for the category', () => {
            const result = workerEligibilityEngine.checkWorkerEligibility(sampleWorkers[0], {
                categoryId: 'sanitation_open_manhole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'CRITICAL',
            });
            expect(result.isEligible).toBe(false);
            expect(result.reasons.some((r) => r.includes('Skill mismatch'))).toBe(true);
        });
    });
    describe('Deterministic Multi-Factor Scoring & Ranking', () => {
        it('produces deterministic scores and ranks the highest-matching worker first', () => {
            const recommendation = workerAssignmentEngine.generateRecommendation({
                issueId: 'iss-test-pothole',
                title: 'Deep pothole on Radial Road',
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'HIGH',
                location: incidentLocation,
                candidateWorkers: sampleWorkers,
            });
            expect(recommendation.recommendedWorker).toBeDefined();
            expect(recommendation.recommendedWorker?.worker.id).toBe('worker-rajesh-road-expert');
            expect(recommendation.recommendedWorker?.isEligible).toBe(true);
            expect(recommendation.recommendedWorker?.totalScore).toBeGreaterThan(80);
            // Verify score breakdown components
            const breakdown = recommendation.recommendedWorker.scoreBreakdown;
            expect(breakdown.skillScore).toBe(100); // Exact match
            expect(breakdown.jurisdictionScore).toBe(100); // Home jurisdiction
            expect(breakdown.proximityScore).toBeGreaterThanOrEqual(90); // ~0.5 km away
            expect(breakdown.workloadScore).toBe(80); // 1/5 active
            // Ineligible workers should be separated
            expect(recommendation.ineligibleCandidates.length).toBeGreaterThan(0);
            expect(recommendation.ineligibleCandidates.some((c) => c.worker.id === 'worker-sunil-on-leave')).toBe(true);
            expect(recommendation.ineligibleCandidates.some((c) => c.worker.id === 'worker-amit-busy')).toBe(true);
        });
        it('prefers lighter-loaded worker when skills and proximity are similar (load balancing)', () => {
            const workerA = {
                id: 'worker-heavy',
                name: 'Worker Heavy',
                role: 'FIELD_WORKER',
                departmentId: deptRoads,
                jurisdictionId: jurisdictionNorth,
                skills: ['roads_pothole'],
                coverageJurisdictionIds: [jurisdictionNorth],
                currentLocation: { latitude: 28.6315, longitude: 77.2167 },
                availability: { status: 'AVAILABLE', maxConcurrentWorkload: 5 },
                workload: { activeAssignmentsCount: 3, pendingCriticalCount: 0, maxCapacity: 5, capacityUtilization: 0.6 },
            };
            const workerB = {
                id: 'worker-light',
                name: 'Worker Light',
                role: 'FIELD_WORKER',
                departmentId: deptRoads,
                jurisdictionId: jurisdictionNorth,
                skills: ['roads_pothole'],
                coverageJurisdictionIds: [jurisdictionNorth],
                currentLocation: { latitude: 28.6315, longitude: 77.2167 },
                availability: { status: 'AVAILABLE', maxConcurrentWorkload: 5 },
                workload: { activeAssignmentsCount: 0, pendingCriticalCount: 0, maxCapacity: 5, capacityUtilization: 0.0 },
            };
            const recommendation = workerAssignmentEngine.generateRecommendation({
                issueId: 'iss-load-test',
                title: 'Road repair',
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
                location: incidentLocation,
                candidateWorkers: [workerA, workerB],
            });
            expect(recommendation.recommendedWorker?.worker.id).toBe('worker-light');
            expect(recommendation.recommendedWorker.totalScore).toBeGreaterThan(recommendation.rankedCandidates[1].totalScore);
            expect(recommendation.recommendedWorker.scoreBreakdown.workloadScore).toBe(100);
            expect(recommendation.rankedCandidates[1].scoreBreakdown.workloadScore).toBe(40);
        });
        it('prefers closer worker when skills and workload are identical (proximity factor)', () => {
            const workerFar = {
                id: 'worker-far',
                name: 'Worker Far (15 km)',
                role: 'FIELD_WORKER',
                departmentId: deptRoads,
                jurisdictionId: jurisdictionNorth,
                skills: ['roads_pothole'],
                coverageJurisdictionIds: [jurisdictionNorth],
                currentLocation: { latitude: 28.75, longitude: 77.2167 }, // ~13 km north
                availability: { status: 'AVAILABLE', maxConcurrentWorkload: 5 },
                workload: { activeAssignmentsCount: 1, pendingCriticalCount: 0, maxCapacity: 5, capacityUtilization: 0.2 },
            };
            const workerNear = {
                id: 'worker-near',
                name: 'Worker Near (0.8 km)',
                role: 'FIELD_WORKER',
                departmentId: deptRoads,
                jurisdictionId: jurisdictionNorth,
                skills: ['roads_pothole'],
                coverageJurisdictionIds: [jurisdictionNorth],
                currentLocation: { latitude: 28.636, longitude: 77.217 }, // ~0.5 km away
                availability: { status: 'AVAILABLE', maxConcurrentWorkload: 5 },
                workload: { activeAssignmentsCount: 1, pendingCriticalCount: 0, maxCapacity: 5, capacityUtilization: 0.2 },
            };
            const recommendation = workerAssignmentEngine.generateRecommendation({
                issueId: 'iss-prox-test',
                title: 'Pothole',
                categoryId: 'roads_pothole',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'MEDIUM',
                location: incidentLocation,
                candidateWorkers: [workerFar, workerNear],
            });
            expect(recommendation.recommendedWorker?.worker.id).toBe('worker-near');
            expect(recommendation.recommendedWorker.scoreBreakdown.proximityScore).toBeGreaterThan(recommendation.rankedCandidates[1].scoreBreakdown.proximityScore);
        });
        it('provides explainable match reasons in decision evidence', () => {
            const recommendation = workerAssignmentEngine.generateRecommendation({
                issueId: 'iss-evidence-test',
                title: 'Damaged sidewalk tiles',
                categoryId: 'roads_footpath_damage',
                jurisdictionId: jurisdictionNorth,
                departmentId: deptRoads,
                severity: 'LOW',
                location: incidentLocation,
                candidateWorkers: [sampleWorkers[0]],
            });
            const worker = recommendation.recommendedWorker;
            expect(worker.matchReasons.length).toBeGreaterThanOrEqual(4);
            expect(worker.matchReasons.some((r) => r.includes('Skill:'))).toBe(true);
            expect(worker.matchReasons.some((r) => r.includes('Jurisdiction:'))).toBe(true);
            expect(worker.matchReasons.some((r) => r.includes('Proximity:'))).toBe(true);
            expect(worker.matchReasons.some((r) => r.includes('Workload:'))).toBe(true);
            expect(recommendation.decisionEvidence).toBeDefined();
        });
    });
    describe('Assignment Service & Officer Override Workflow', () => {
        let service;
        beforeEach(() => {
            service = new AssignmentService();
            service.registerWorkers(sampleWorkers);
        });
        it('successfully assigns the recommended worker without requiring an override reason', async () => {
            vi.mocked(prisma.issue.update).mockResolvedValue({ id: 'iss-1' });
            vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-1' });
            const result = await service.assignWorkerToIssue({
                issueId: 'iss-1',
                assignedWorkerId: 'worker-rajesh-road-expert',
                officerId: 'officer-arun',
                recommendedWorkerId: 'worker-rajesh-road-expert',
            });
            expect(result.status).toBe('ASSIGNED');
            expect(result.assignedWorkerId).toBe('worker-rajesh-road-expert');
            expect(result.isOfficerOverride).toBe(false);
            expect(result.overrideReason).toBeUndefined();
            expect(prisma.issue.update).toHaveBeenCalledWith({
                where: { id: 'iss-1' },
                data: {
                    assignedToId: 'worker-rajesh-road-expert',
                    status: 'ASSIGNED',
                },
            });
            expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'ISSUE_ASSIGNED',
                    objectId: 'iss-1',
                }),
            }));
        });
        it('requires an override reason when bypassing the recommended worker', async () => {
            await expect(service.assignWorkerToIssue({
                issueId: 'iss-2',
                assignedWorkerId: 'worker-vikram-road-general', // Different from recommended
                recommendedWorkerId: 'worker-rajesh-road-expert',
                officerId: 'officer-arun',
                // No overrideReason provided!
            })).rejects.toThrow(/Officer override requires a valid reason/);
        });
        it('rejects officer override if reason is too short', async () => {
            await expect(service.assignWorkerToIssue({
                issueId: 'iss-2',
                assignedWorkerId: 'worker-vikram-road-general',
                recommendedWorkerId: 'worker-rajesh-road-expert',
                officerId: 'officer-arun',
                overrideReason: 'no', // Too short (< 5 chars)
            })).rejects.toThrow(/minimum 5 characters/);
        });
        it('successfully records officer override when a valid reason is provided', async () => {
            vi.mocked(prisma.issue.update).mockResolvedValue({ id: 'iss-3' });
            vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-2' });
            const overrideReason = 'Worker Vikram is currently stationed with the road roller at this specific junction.';
            const result = await service.assignWorkerToIssue({
                issueId: 'iss-3',
                assignedWorkerId: 'worker-vikram-road-general',
                recommendedWorkerId: 'worker-rajesh-road-expert',
                officerId: 'officer-arun',
                isOfficerOverride: true,
                overrideReason,
                notes: 'Priority asphalt patching requested by Ward Councilor.',
            });
            expect(result.status).toBe('ASSIGNED');
            expect(result.assignedWorkerId).toBe('worker-vikram-road-general');
            expect(result.isOfficerOverride).toBe(true);
            expect(result.overrideReason).toBe(overrideReason);
            expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'ISSUE_ASSIGNMENT_OVERRIDDEN',
                    objectId: 'iss-3',
                    payload: expect.objectContaining({
                        isOfficerOverride: true,
                        overrideReason,
                    }),
                }),
            }));
        });
        it('prevents assignment to a worker who is ON_LEAVE even with officer override', async () => {
            await expect(service.assignWorkerToIssue({
                issueId: 'iss-4',
                assignedWorkerId: 'worker-sunil-on-leave',
                officerId: 'officer-arun',
                isOfficerOverride: true,
                overrideReason: 'Tried to assign worker despite leave status',
            })).rejects.toThrow(/currently ON_LEAVE/);
        });
    });
});
