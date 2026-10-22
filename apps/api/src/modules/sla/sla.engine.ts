import {
  PriorityTierLevel,
  SlaAgingResult,
  SlaCalculationInput,
  SlaCountdownResult,
  SlaEvaluationResult,
  SlaRuleConfig,
  SlaStatus,
} from './sla.types';
import { SlaRuleMatrix, slaRuleMatrix } from './sla.matrix';
import {
  WorkingHoursPolicy,
  defaultWorkingHoursPolicy,
} from './working-hours.policy';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(' ');
}

export class SlaEngine {
  private matrix: SlaRuleMatrix;
  private workingHoursPolicy: WorkingHoursPolicy;

  constructor(
    matrix: SlaRuleMatrix = slaRuleMatrix,
    workingHoursPolicy: WorkingHoursPolicy = defaultWorkingHoursPolicy
  ) {
    this.matrix = matrix;
    this.workingHoursPolicy = workingHoursPolicy;
  }

  /**
   * Evaluates end-to-end SLA for an issue: rule resolution, due date, aging, countdown, and overdue state.
   */
  public evaluateSla(input: SlaCalculationInput): SlaEvaluationResult {
    const createdAt =
      typeof input.createdAt === 'string' ? new Date(input.createdAt) : input.createdAt;
    const referenceTime = input.referenceTime
      ? typeof input.referenceTime === 'string'
        ? new Date(input.referenceTime)
        : input.referenceTime
      : new Date();

    // Map severity to priority tier if priorityTier not explicitly passed
    const priorityTier: PriorityTierLevel =
      input.priorityTier || this.inferPriorityTier(input.severity);

    // Resolve matching SLA rule
    const resolvedRule = this.matrix.resolveSlaRule({
      categoryId: input.categoryId,
      priorityTier,
      jurisdictionId: input.jurisdictionId,
    });

    // Apply custom overrides if specified
    const ruleApplied: SlaRuleConfig = {
      ...resolvedRule,
      ...(input.customRule || {}),
    };

    // Calculate due date
    const dueAt = this.calculateDueAt(createdAt, ruleApplied);

    // Calculate aging
    const aging = this.calculateAging(
      createdAt,
      referenceTime,
      ruleApplied.targetDurationHours,
      ruleApplied.workingHoursMode
    );

    // Calculate countdown and overdue state
    const countdown = this.calculateCountdown(
      dueAt,
      referenceTime,
      ruleApplied.warningThresholdPercentage ?? 75,
      aging.percentageElapsed
    );

    const decisionEvidence = {
      issueId: input.issueId,
      categoryId: input.categoryId,
      priorityTier,
      jurisdictionId: input.jurisdictionId,
      ruleId: ruleApplied.id,
      targetDurationHours: ruleApplied.targetDurationHours,
      workingHoursMode: ruleApplied.workingHoursMode,
      warningThresholdPercentage: ruleApplied.warningThresholdPercentage ?? 75,
      timeZone: this.workingHoursPolicy.getConfig().timeZone,
      createdAtIso: createdAt.toISOString(),
      referenceTimeIso: referenceTime.toISOString(),
      dueAtIso: dueAt.toISOString(),
      isOverdue: countdown.isOverdue,
      status: countdown.status,
    };

    return {
      issueId: input.issueId,
      categoryId: input.categoryId,
      priorityTier,
      jurisdictionId: input.jurisdictionId,
      ruleApplied,
      workingHoursMode: ruleApplied.workingHoursMode,
      createdAt,
      dueAt,
      aging,
      countdown,
      status: countdown.status,
      decisionEvidence,
    };
  }

  /**
   * Computes the exact due date for an issue based on working hours mode.
   */
  public calculateDueAt(createdAt: Date, rule: SlaRuleConfig): Date {
    if (rule.workingHoursMode === 'CONTINUOUS_24_7') {
      return new Date(createdAt.getTime() + rule.targetDurationHours * 3600 * 1000);
    }

    return this.workingHoursPolicy.addBusinessHours(
      createdAt,
      rule.targetDurationHours
    );
  }

  /**
   * Computes elapsed wall-clock and business aging against target hours.
   */
  public calculateAging(
    createdAt: Date,
    referenceTime: Date,
    targetHours: number,
    mode: 'CONTINUOUS_24_7' | 'BUSINESS_HOURS'
  ): SlaAgingResult {
    const rawElapsedMs = Math.max(0, referenceTime.getTime() - createdAt.getTime());
    const ageHours = Number((rawElapsedMs / (3600 * 1000)).toFixed(2));

    const businessElapsedHours =
      mode === 'CONTINUOUS_24_7'
        ? ageHours
        : this.workingHoursPolicy.calculateBusinessElapsedHours(createdAt, referenceTime);

    const effectiveElapsed =
      mode === 'CONTINUOUS_24_7' ? ageHours : businessElapsedHours;

    const percentageElapsed =
      targetHours > 0
        ? Number(((effectiveElapsed / targetHours) * 100).toFixed(2))
        : 100.0;

    return {
      ageHours,
      businessElapsedHours,
      totalTargetHours: targetHours,
      percentageElapsed,
    };
  }

  /**
   * Computes countdown, remaining time, warning, and overdue state.
   */
  public calculateCountdown(
    dueAt: Date,
    referenceTime: Date,
    warningThresholdPercentage: number,
    percentageElapsed: number
  ): SlaCountdownResult {
    const remainingMs = dueAt.getTime() - referenceTime.getTime();
    const remainingHours = Number((remainingMs / (3600 * 1000)).toFixed(2));

    const isOverdue = remainingMs <= 0 || percentageElapsed >= 100.0;
    const isWarning = !isOverdue && percentageElapsed >= warningThresholdPercentage;

    let status: SlaStatus = 'WITHIN_SLA';
    if (isOverdue) {
      status = 'BREACHED';
    } else if (isWarning) {
      status = 'WARNING';
    }

    let countdownFormatted: string;
    if (isOverdue) {
      const overdueMs = Math.abs(remainingMs);
      countdownFormatted = `-${formatDuration(overdueMs)} overdue`;
    } else {
      countdownFormatted = `${formatDuration(remainingMs)} remaining`;
    }

    return {
      remainingMs,
      remainingHours,
      countdownFormatted,
      isOverdue,
      isWarning,
      status,
    };
  }

  private inferPriorityTier(severity?: string): PriorityTierLevel {
    const upper = (severity || '').toUpperCase();
    if (upper === 'CRITICAL') return 'P1_CRITICAL';
    if (upper === 'HIGH') return 'P2_HIGH';
    if (upper === 'LOW') return 'P4_LOW';
    return 'P3_MEDIUM';
  }
}

export const slaEngine = new SlaEngine();
