import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscalationPolicy, DEFAULT_ESCALATION_CONFIG, } from './escalation.policy.js';
import { EscalationDedupEngine } from './escalation.dedup.js';
import { EscalationService, } from './escalation.service.js';
import { SlaEngine } from '../sla/sla.engine.js';
import { WorkingHoursPolicy, createDateInTimeZone } from '../sla/working-hours.policy.js';
import { SlaRuleMatrix } from '../sla/sla.matrix.js';
import { prisma } from '@civiq/db';
vi.mock('@civiq/db', () => ({
    prisma: {
        issue: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        roleAssignment: {
            findMany: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));
describe('SLA Escalation Workflow & Idempotency', () => {
    let policy;
    let dedupEngine;
    let slaEngine;
    let notificationServiceMock;
    let service;
    beforeEach(() => {
        vi.clearAllMocks();
        policy = new EscalationPolicy(DEFAULT_ESCALATION_CONFIG);
        dedupEngine = new EscalationDedupEngine();
        const workingHours = new WorkingHoursPolicy();
        const slaMatrix = new SlaRuleMatrix();
        slaEngine = new SlaEngine(slaMatrix, workingHours);
        notificationServiceMock = {
            dispatchNotification: vi.fn().mockResolvedValue({ delivered: true }),
        };
        service = new EscalationService(policy, dedupEngine, slaEngine, notificationServiceMock);
    });
    describe('Tiered Escalation Thresholds', () => {
        it('does not escalate when issue is within normal operating SLA (<75%)', async () => {
            // 10-hour business SLA. Created at 09:00 IST Wednesday, evaluated at 12:00 IST (30% elapsed)
            const createdAt = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 9, minute: 0 }, 'Asia/Kolkata');
            const refTime = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 12, minute: 0 }, 'Asia/Kolkata');
            const result = await service.checkAndEscalateIssue({
                issueId: 'iss-within-sla',
                issueTitle: 'Pothole on Main Road',
                categoryId: 'roads_pothole',
                severity: 'MEDIUM',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: refTime,
                customConfig: { warningThresholdPct: 75, breachThresholdPct: 100 },
            });
            expect(result.shouldEscalate).toBe(false);
            expect(result.escalationLevel).toBe('NONE');
            expect(result.targetRoles).toHaveLength(0);
            expect(result.isDuplicate).toBe(false);
            expect(notificationServiceMock.dispatchNotification).not.toHaveBeenCalled();
        });
        it('triggers WARNING escalation to Field Worker and Supervisor at 75% SLA threshold', async () => {
            // Pothole with 72h business SLA. Evaluated when ~80% elapsed
            // Created on 2026-10-14 09:00 IST. 72h SLA = 8 working days.
            // Let's test with a 10h target duration using customRule in SLA
            const createdAt = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 9, minute: 0 }, 'Asia/Kolkata');
            // Evaluated at 17:00 IST (8 hours elapsed / 10 hours target = 80%)
            const refTime = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 17, minute: 0 }, 'Asia/Kolkata');
            // Register temporary 10-hour rule
            slaEngine['matrix'].registerRule({
                id: 'rule-test-10h',
                categoryId: 'test_warning_category',
                targetDurationHours: 10,
                workingHoursMode: 'BUSINESS_HOURS',
                warningThresholdPercentage: 75,
            });
            const result = await service.checkAndEscalateIssue({
                issueId: 'iss-warning-threshold',
                issueTitle: 'Streetlight flickers near market',
                categoryId: 'test_warning_category',
                severity: 'MEDIUM',
                jurisdictionId: 'jur-delhi-north',
                assignedWorkerId: 'worker-rajesh',
                createdAt,
                referenceTime: refTime,
            });
            expect(result.shouldEscalate).toBe(true);
            expect(result.escalationLevel).toBe('WARNING');
            expect(result.targetRoles).toContain('FIELD_WORKER');
            expect(result.targetRoles).toContain('FIELD_SUPERVISOR');
            expect(result.isDuplicate).toBe(false);
            expect(result.escalationEvent).toBeDefined();
            expect(notificationServiceMock.dispatchNotification).toHaveBeenCalled();
            expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'SLA_ESCALATION_TRIGGERED',
                    objectId: 'iss-warning-threshold',
                }),
            }));
        });
        it('triggers SUPERVISOR_BREACH escalation when 100% SLA is breached', async () => {
            // 10-hour SLA. Evaluated at 11 hours elapsed (110% breached)
            const createdAt = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 9, minute: 0 }, 'Asia/Kolkata');
            // Next day 11:00 IST -> 9h day 1 + 2h day 2 = 11 business hours
            const refTime = createDateInTimeZone({ year: 2026, month: 10, day: 15, hour: 11, minute: 0 }, 'Asia/Kolkata');
            slaEngine['matrix'].registerRule({
                id: 'rule-test-breach',
                categoryId: 'test_breach_category',
                targetDurationHours: 10,
                workingHoursMode: 'BUSINESS_HOURS',
                warningThresholdPercentage: 75,
            });
            const result = await service.checkAndEscalateIssue({
                issueId: 'iss-breach',
                issueTitle: 'Garbage accumulation near school',
                categoryId: 'test_breach_category',
                severity: 'MEDIUM',
                priorityTier: 'P3_MEDIUM',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: refTime,
            });
            expect(result.shouldEscalate).toBe(true);
            expect(result.escalationLevel).toBe('SUPERVISOR_BREACH');
            expect(result.targetRoles).toContain('FIELD_SUPERVISOR');
            expect(result.targetRoles).toContain('DEPARTMENT_OFFICER');
            expect(result.isDuplicate).toBe(false);
            expect(notificationServiceMock.dispatchNotification).toHaveBeenCalled();
        });
        it('triggers OFFICER_CRITICAL_BREACH escalation for severe breach (>=150%)', async () => {
            // 10-hour SLA. Evaluated at 16 business hours elapsed (160% elapsed)
            const createdAt = createDateInTimeZone({ year: 2026, month: 10, day: 14, hour: 9, minute: 0 }, 'Asia/Kolkata');
            // Next day 16:00 IST -> 9h day 1 + 7h day 2 = 16 business hours
            const refTime = createDateInTimeZone({ year: 2026, month: 10, day: 15, hour: 16, minute: 0 }, 'Asia/Kolkata');
            slaEngine['matrix'].registerRule({
                id: 'rule-test-severe-breach',
                categoryId: 'test_severe_category',
                targetDurationHours: 10,
                workingHoursMode: 'BUSINESS_HOURS',
            });
            const result = await service.checkAndEscalateIssue({
                issueId: 'iss-severe-breach',
                issueTitle: 'Broken sewer drain overflowing',
                categoryId: 'test_severe_category',
                severity: 'HIGH',
                priorityTier: 'P2_HIGH',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: refTime,
            });
            expect(result.shouldEscalate).toBe(true);
            expect(result.escalationLevel).toBe('OFFICER_CRITICAL_BREACH');
            expect(result.targetRoles).toContain('DEPARTMENT_OFFICER');
            expect(result.targetRoles).toContain('DISTRICT_ULB_ADMIN');
        });
        it('immediately escalates P1_CRITICAL breaches directly to Department Officer', async () => {
            // Live wire (P1_CRITICAL, 4-hour 24/7 SLA).
            // Created Friday 10:00, evaluated Friday 15:00 (5 hours elapsed -> breached)
            const createdAt = new Date('2026-10-16T04:30:00.000Z'); // 10:00 IST
            const refTime = new Date('2026-10-16T09:30:00.000Z'); // 15:00 IST (5 hours)
            const result = await service.checkAndEscalateIssue({
                issueId: 'iss-crit-p1',
                issueTitle: 'Live high voltage wire fallen across highway',
                categoryId: 'electrical_hanging_wires',
                severity: 'CRITICAL',
                priorityTier: 'P1_CRITICAL',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: refTime,
            });
            expect(result.shouldEscalate).toBe(true);
            expect(result.escalationLevel).toBe('OFFICER_CRITICAL_BREACH');
            expect(result.targetRoles).toContain('DEPARTMENT_OFFICER');
            expect(result.targetRoles).toContain('DISTRICT_ULB_ADMIN');
        });
    });
    describe('Duplicate Storm Prevention & Idempotency', () => {
        it('suppresses duplicate escalation storm when called repeatedly within cooldown window', async () => {
            const createdAt = new Date('2026-10-16T04:30:00.000Z');
            const refTime1 = new Date('2026-10-16T09:30:00.000Z'); // 5 hours -> breached
            const input = {
                issueId: 'iss-storm-test',
                issueTitle: 'Live cable sparking',
                categoryId: 'electrical_hanging_wires',
                severity: 'CRITICAL',
                priorityTier: 'P1_CRITICAL',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: refTime1,
            };
            // 1. First trigger: Must succeed
            const firstResult = await service.checkAndEscalateIssue(input);
            expect(firstResult.shouldEscalate).toBe(true);
            expect(firstResult.isDuplicate).toBe(false);
            expect(notificationServiceMock.dispatchNotification).toHaveBeenCalled();
            vi.clearAllMocks();
            // 2. Second trigger 5 minutes later: Must be suppressed as duplicate
            const refTime2 = new Date('2026-10-16T09:35:00.000Z');
            const secondResult = await service.checkAndEscalateIssue({
                ...input,
                referenceTime: refTime2,
            });
            expect(secondResult.shouldEscalate).toBe(false);
            expect(secondResult.isDuplicate).toBe(true);
            expect(secondResult.suppressionReason).toContain('Suppressed to prevent duplicate alert storm');
            // Must NOT re-send notifications
            expect(notificationServiceMock.dispatchNotification).not.toHaveBeenCalled();
            // Must record audit log for the suppressed duplicate
            expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'SLA_ESCALATION_SUPPRESSED',
                    objectId: 'iss-storm-test',
                }),
            }));
        });
        it('allows escalating to a higher level when an issue transitions from WARNING to BREACH', async () => {
            slaEngine['matrix'].registerRule({
                id: 'rule-transition-test',
                categoryId: 'test_transition_cat',
                targetDurationHours: 10,
                workingHoursMode: 'CONTINUOUS_24_7',
                warningThresholdPercentage: 75,
            });
            const createdAt = new Date('2026-10-16T00:00:00.000Z');
            // 1. 8 hours later: WARNING level
            const warningTime = new Date('2026-10-16T08:00:00.000Z'); // 80%
            const warningRes = await service.checkAndEscalateIssue({
                issueId: 'iss-transition',
                issueTitle: 'Pothole',
                categoryId: 'test_transition_cat',
                severity: 'MEDIUM',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: warningTime,
            });
            expect(warningRes.shouldEscalate).toBe(true);
            expect(warningRes.escalationLevel).toBe('WARNING');
            expect(warningRes.isDuplicate).toBe(false);
            // 2. 11 hours later: SUPERVISOR_BREACH level
            const breachTime = new Date('2026-10-16T11:00:00.000Z'); // 110%
            const breachRes = await service.checkAndEscalateIssue({
                issueId: 'iss-transition',
                issueTitle: 'Pothole',
                categoryId: 'test_transition_cat',
                severity: 'MEDIUM',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: breachTime,
            });
            // Even though WARNING was triggered earlier, SUPERVISOR_BREACH is a new level and must trigger
            expect(breachRes.shouldEscalate).toBe(true);
            expect(breachRes.escalationLevel).toBe('SUPERVISOR_BREACH');
            expect(breachRes.isDuplicate).toBe(false);
        });
        it('allows recurring reminder after cooldown period expires', async () => {
            const createdAt = new Date('2026-10-16T00:00:00.000Z');
            const time1 = new Date('2026-10-16T10:00:00.000Z'); // 10h elapsed on 6h open manhole SLA (breached)
            const input = {
                issueId: 'iss-cooldown-expiry',
                issueTitle: 'Open manhole hazard',
                categoryId: 'sanitation_open_manhole',
                severity: 'CRITICAL',
                priorityTier: 'P1_CRITICAL',
                jurisdictionId: 'jur-delhi-north',
                createdAt,
                referenceTime: time1,
                customConfig: { cooldownMinutes: 60 },
            };
            // First trigger
            const res1 = await service.checkAndEscalateIssue(input);
            expect(res1.shouldEscalate).toBe(true);
            expect(res1.isDuplicate).toBe(false);
            // 61 minutes later (cooldown expired)
            const time2 = new Date('2026-10-16T11:01:00.000Z');
            const res2 = await service.checkAndEscalateIssue({
                ...input,
                referenceTime: time2,
            });
            expect(res2.shouldEscalate).toBe(true);
            expect(res2.isDuplicate).toBe(false);
        });
    });
    describe('Database Integration & Batch Scanning', () => {
        it('fetches single issue from database and evaluates escalation', async () => {
            const mockIssue = {
                id: 'iss-db-esc-1',
                title: 'Dangerous hanging wires near bus stop',
                categoryId: 'electrical_hanging_wires',
                severity: 'CRITICAL',
                jurisdictionId: 'jur-delhi-north',
                assignedToId: 'worker-rajesh',
                createdAt: new Date('2026-10-16T00:00:00.000Z'),
            };
            vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue);
            vi.mocked(prisma.roleAssignment.findMany).mockResolvedValue([
                {
                    userId: 'supervisor-1',
                    role: 'FIELD_SUPERVISOR',
                    user: { id: 'supervisor-1', email: 'sup@civiq.gov.in' },
                },
            ]);
            const refTime = new Date('2026-10-16T06:00:00.000Z'); // 6 hours (breached 4h SLA)
            const result = await service.checkAndEscalateIssueById('iss-db-esc-1', refTime);
            expect(result).not.toBeNull();
            expect(result?.issueId).toBe('iss-db-esc-1');
            expect(result?.shouldEscalate).toBe(true);
            expect(result?.escalationLevel).toBe('OFFICER_CRITICAL_BREACH');
            expect(prisma.auditLog.create).toHaveBeenCalled();
        });
        it('scans multiple overdue issues in batch and escalates eligible ones', async () => {
            const mockIssues = [
                {
                    id: 'iss-batch-1',
                    title: 'Issue 1 Overdue',
                    categoryId: 'sanitation_open_manhole',
                    severity: 'CRITICAL',
                    jurisdictionId: 'jur-delhi-north',
                    createdAt: new Date('2026-10-16T00:00:00.000Z'),
                },
                {
                    id: 'iss-batch-2',
                    title: 'Issue 2 Fresh',
                    categoryId: 'roads_pothole',
                    severity: 'LOW',
                    jurisdictionId: 'jur-delhi-north',
                    createdAt: new Date('2026-10-16T09:00:00.000Z'), // Brand new
                },
            ];
            vi.mocked(prisma.issue.findMany).mockResolvedValue(mockIssues);
            const refTime = new Date('2026-10-16T09:30:00.000Z');
            const results = await service.scanAndEscalateOverdueIssues({
                jurisdictionId: 'jur-delhi-north',
                referenceTime: refTime,
            });
            expect(results).toHaveLength(2);
            expect(results[0]?.shouldEscalate).toBe(true); // Open manhole overdue
            expect(results[1]?.shouldEscalate).toBe(false); // Brand new pothole within SLA
        });
    });
});
