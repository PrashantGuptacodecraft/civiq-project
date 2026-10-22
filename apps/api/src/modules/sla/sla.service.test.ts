import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WorkingHoursPolicy,
  createDateInTimeZone,
  getZonedTimeComponents,
  DEFAULT_INDIAN_WORKING_HOURS,
} from './working-hours.policy';
import { SlaRuleMatrix } from './sla.matrix';
import { SlaEngine, formatDuration } from './sla.engine';
import { SlaService, slaService } from './sla.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findUnique: vi.fn(),
    },
  },
}));

describe('SLA Rules & Working Hours Engine', () => {
  let policy: WorkingHoursPolicy;
  let matrix: SlaRuleMatrix;
  let engine: SlaEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    policy = new WorkingHoursPolicy(DEFAULT_INDIAN_WORKING_HOURS);
    matrix = new SlaRuleMatrix();
    engine = new SlaEngine(matrix, policy);
  });

  describe('Timezone & Calendar Conversion Tests (Asia/Kolkata vs UTC)', () => {
    it('correctly maps UTC timestamps to Indian Standard Time (IST, UTC+5:30)', () => {
      // 2026-10-14 03:30:00 UTC is exactly 2026-10-14 09:00:00 IST (Wednesday start of work)
      const dateUtc = new Date('2026-10-14T03:30:00.000Z');
      const zoned = getZonedTimeComponents(dateUtc, 'Asia/Kolkata');

      expect(zoned.year).toBe(2026);
      expect(zoned.month).toBe(10);
      expect(zoned.day).toBe(14);
      expect(zoned.hour).toBe(9);
      expect(zoned.minute).toBe(0);
      expect(zoned.dayOfWeek).toBe(3); // Wednesday
      expect(zoned.dateString).toBe('2026-10-14');
    });

    it('correctly converts local IST components back to UTC Date', () => {
      // 2026-10-14 18:00:00 IST is 2026-10-14 12:30:00 UTC
      const utcDate = createDateInTimeZone(
        {
          year: 2026,
          month: 10,
          day: 14,
          hour: 18,
          minute: 0,
        },
        'Asia/Kolkata'
      );

      expect(utcDate.toISOString()).toBe('2026-10-14T12:30:00.000Z');
    });

    it('identifies working vs non-working moments in IST', () => {
      // Wednesday 11:00 IST -> Working
      const workingDate = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 11, minute: 0 },
        'Asia/Kolkata'
      );
      expect(policy.isWorkingMoment(workingDate)).toBe(true);

      // Wednesday 20:00 IST -> Outside working hours (night)
      const eveningDate = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 20, minute: 0 },
        'Asia/Kolkata'
      );
      expect(policy.isWorkingMoment(eveningDate)).toBe(false);

      // Sunday 11:00 IST -> Outside working hours (weekend)
      const sundayDate = createDateInTimeZone(
        { year: 2026, month: 10, day: 18, hour: 11, minute: 0 },
        'Asia/Kolkata'
      );
      expect(policy.isWorkingMoment(sundayDate)).toBe(false);
    });
  });

  describe('Business Hours & Boundary Transitions Tests', () => {
    it('computes due time within the same working day', () => {
      // Wednesday 10:00 IST + 4 business hours -> Wednesday 14:00 IST
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 10, minute: 0 },
        'Asia/Kolkata'
      );
      const due = policy.addBusinessHours(start, 4);

      const zonedDue = getZonedTimeComponents(due, 'Asia/Kolkata');
      expect(zonedDue.day).toBe(14);
      expect(zonedDue.hour).toBe(14);
      expect(zonedDue.minute).toBe(0);
    });

    it('rolls over overnight when business hours cross the 18:00 IST closing boundary', () => {
      // Wednesday 16:30 IST + 3 business hours:
      // 1.5 hours on Wednesday (16:30 to 18:00)
      // Pauses overnight
      // 1.5 hours on Thursday (09:00 to 10:30)
      // Due: Thursday 10:30 IST
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 16, minute: 30 },
        'Asia/Kolkata'
      );
      const due = policy.addBusinessHours(start, 3);

      const zonedDue = getZonedTimeComponents(due, 'Asia/Kolkata');
      expect(zonedDue.day).toBe(15); // Thursday
      expect(zonedDue.hour).toBe(10);
      expect(zonedDue.minute).toBe(30);
    });

    it('rolls over across the weekend for Friday evening submissions', () => {
      // Friday 17:00 IST (2026-10-16) + 3 business hours:
      // 1 hour on Friday (17:00 to 18:00)
      // Pauses Saturday & Sunday
      // 2 hours on Monday (09:00 to 11:00)
      // Due: Monday 11:00 IST (2026-10-19)
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 16, hour: 17, minute: 0 },
        'Asia/Kolkata'
      );
      const due = policy.addBusinessHours(start, 3);

      const zonedDue = getZonedTimeComponents(due, 'Asia/Kolkata');
      expect(zonedDue.day).toBe(19); // Monday
      expect(zonedDue.hour).toBe(11);
      expect(zonedDue.minute).toBe(0);
    });

    it('advances weekend submissions to Monday 09:00 IST before counting business hours', () => {
      // Saturday 14:00 IST (2026-10-17) + 4 business hours:
      // Clock starts Monday 09:00 IST
      // Due: Monday 13:00 IST (2026-10-19)
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 17, hour: 14, minute: 0 },
        'Asia/Kolkata'
      );
      const due = policy.addBusinessHours(start, 4);

      const zonedDue = getZonedTimeComponents(due, 'Asia/Kolkata');
      expect(zonedDue.day).toBe(19); // Monday
      expect(zonedDue.hour).toBe(13);
      expect(zonedDue.minute).toBe(0);
    });

    it('calculates exact business hours elapsed excluding overnight and weekends', () => {
      // Start: Friday 16:00 IST
      // End: Monday 10:30 IST
      // Active hours:
      // Friday: 16:00 - 18:00 = 2 hours
      // Weekend: 0 hours
      // Monday: 09:00 - 10:30 = 1.5 hours
      // Total elapsed = 3.5 hours
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 16, hour: 16, minute: 0 },
        'Asia/Kolkata'
      );
      const end = createDateInTimeZone(
        { year: 2026, month: 10, day: 19, hour: 10, minute: 30 },
        'Asia/Kolkata'
      );

      const elapsed = policy.calculateBusinessElapsedHours(start, end);
      expect(elapsed).toBe(3.5);
    });
  });

  describe('24/7 Continuous Emergency Mode Tests', () => {
    it('applies continuous 24/7 clock for emergency categories ignoring working hours and weekends', () => {
      // Live electrical hanging wires: 4h 24/7 SLA
      // Created Friday 22:00 IST
      // Due: Saturday 02:00 IST (exactly 4 hours later, no weekend or night pause)
      const start = createDateInTimeZone(
        { year: 2026, month: 10, day: 16, hour: 22, minute: 0 },
        'Asia/Kolkata'
      );

      const result = engine.evaluateSla({
        issueId: 'iss-live-wire',
        categoryId: 'electrical_hanging_wires',
        priorityTier: 'P1_CRITICAL',
        createdAt: start,
        referenceTime: start,
      });

      expect(result.workingHoursMode).toBe('CONTINUOUS_24_7');
      expect(result.ruleApplied.targetDurationHours).toBe(4);

      const zonedDue = getZonedTimeComponents(result.dueAt, 'Asia/Kolkata');
      expect(zonedDue.day).toBe(17); // Saturday
      expect(zonedDue.hour).toBe(2);
      expect(zonedDue.minute).toBe(0);
    });
  });

  describe('Aging, Real-time Countdown & Overdue State Machine', () => {
    const start = createDateInTimeZone(
      { year: 2026, month: 10, day: 14, hour: 10, minute: 0 },
      'Asia/Kolkata'
    );

    it('reports WITHIN_SLA state when under 75% elapsed', () => {
      // 10 business hours target. Reference: 2 business hours later (12:00 IST) -> 20% elapsed
      const refTime = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 12, minute: 0 },
        'Asia/Kolkata'
      );

      const result = engine.evaluateSla({
        issueId: 'iss-status-1',
        categoryId: 'roads_pothole',
        createdAt: start,
        referenceTime: refTime,
        customRule: { targetDurationHours: 10, workingHoursMode: 'BUSINESS_HOURS' },
      });

      expect(result.status).toBe('WITHIN_SLA');
      expect(result.countdown.isWarning).toBe(false);
      expect(result.countdown.isOverdue).toBe(false);
      expect(result.aging.percentageElapsed).toBe(20);
      expect(result.countdown.countdownFormatted).toContain('remaining');
    });

    it('reports WARNING state when reaching 75% warning threshold', () => {
      // 10 business hours target. Reference: 8 business hours later -> 80% elapsed
      const refTime = createDateInTimeZone(
        { year: 2026, month: 10, day: 14, hour: 18, minute: 0 }, // 8 hours elapsed (10:00 to 18:00)
        'Asia/Kolkata'
      );

      const result = engine.evaluateSla({
        issueId: 'iss-status-2',
        categoryId: 'roads_pothole',
        createdAt: start,
        referenceTime: refTime,
        customRule: { targetDurationHours: 10, workingHoursMode: 'BUSINESS_HOURS' },
      });

      expect(result.status).toBe('WARNING');
      expect(result.countdown.isWarning).toBe(true);
      expect(result.countdown.isOverdue).toBe(false);
      expect(result.aging.percentageElapsed).toBe(80);
      expect(result.countdown.countdownFormatted).toContain('remaining');
    });

    it('reports BREACHED state when past deadline (>100% elapsed)', () => {
      // 10 business hours target (Due Thursday 11:00 IST). Reference: Thursday 14:00 IST -> Overdue!
      const refTime = createDateInTimeZone(
        { year: 2026, month: 10, day: 15, hour: 14, minute: 0 },
        'Asia/Kolkata'
      );

      const result = engine.evaluateSla({
        issueId: 'iss-status-3',
        categoryId: 'roads_pothole',
        createdAt: start,
        referenceTime: refTime,
        customRule: { targetDurationHours: 10, workingHoursMode: 'BUSINESS_HOURS' },
      });

      expect(result.status).toBe('BREACHED');
      expect(result.countdown.isOverdue).toBe(true);
      expect(result.aging.percentageElapsed).toBeGreaterThan(100);
      expect(result.countdown.countdownFormatted).toContain('overdue');
      expect(result.countdown.countdownFormatted).toContain('-');
    });

    it('formats countdown duration strings cleanly', () => {
      expect(formatDuration(3600 * 1000)).toBe('1h 0m');
      expect(formatDuration(86400 * 1000 * 2 + 3600 * 1000 * 3 + 60 * 1000 * 15)).toBe('2d 3h 15m');
      expect(formatDuration(45 * 1000 * 60)).toBe('45m');
    });
  });

  describe('Configurable SLA Matrix Resolution & Hierarchy', () => {
    it('applies custom jurisdiction override when configured', () => {
      // Normal pothole rule is 72 hours.
      // Register custom rule for Delhi Smart City Zone: 24 business hours
      const smartCityJur = 'jur-delhi-ndmc-smart';
      matrix.registerRule({
        id: 'rule-smart-city-pothole',
        categoryId: 'roads_pothole',
        jurisdictionId: smartCityJur,
        targetDurationHours: 24,
        workingHoursMode: 'BUSINESS_HOURS',
        description: 'Smart City expedited 24h pothole SLA',
      });

      const standardResult = engine.evaluateSla({
        issueId: 'iss-pothole-std',
        categoryId: 'roads_pothole',
        createdAt: new Date(),
      });
      expect(standardResult.ruleApplied.targetDurationHours).toBe(72);

      const smartCityResult = engine.evaluateSla({
        issueId: 'iss-pothole-smart',
        categoryId: 'roads_pothole',
        jurisdictionId: smartCityJur,
        createdAt: new Date(),
      });
      expect(smartCityResult.ruleApplied.targetDurationHours).toBe(24);
      expect(smartCityResult.ruleApplied.id).toBe('rule-smart-city-pothole');
    });

    it('escalates normal business hour category to continuous 24/7 when priority is P1_CRITICAL', () => {
      const result = engine.evaluateSla({
        issueId: 'iss-pothole-crit',
        categoryId: 'roads_pothole',
        priorityTier: 'P1_CRITICAL',
        createdAt: new Date(),
      });

      expect(result.workingHoursMode).toBe('CONTINUOUS_24_7');
      expect(result.ruleApplied.targetDurationHours).toBeLessThanOrEqual(4);
      expect(result.ruleApplied.id).toContain('escalated-p1');
    });
  });

  describe('Database Integration (getIssueSlaStatusById)', () => {
    it('fetches issue from database and calculates SLA status accurately', async () => {
      const mockIssue = {
        id: 'iss-db-sla-1',
        categoryId: 'water_pipeline_leak',
        severity: 'HIGH',
        jurisdictionId: 'jur-delhi-north',
        createdAt: new Date('2026-10-14T04:30:00.000Z'), // Wednesday 10:00 IST
      };

      vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue as any);

      const refTime = new Date('2026-10-14T06:30:00.000Z'); // 2 hours later
      const result = await slaService.getIssueSlaStatusById('iss-db-sla-1', refTime);

      expect(result).not.toBeNull();
      expect(result?.issueId).toBe('iss-db-sla-1');
      expect(result?.categoryId).toBe('water_pipeline_leak');
      expect(result?.priorityTier).toBe('P2_HIGH');
      expect(result?.ruleApplied.targetDurationHours).toBe(24);
      expect(result?.status).toBe('WITHIN_SLA');
    });

    it('returns null if issue is not found in database', async () => {
      vi.mocked(prisma.issue.findUnique).mockResolvedValue(null);

      const result = await slaService.getIssueSlaStatusById('non-existent-issue');
      expect(result).toBeNull();
    });
  });
});
