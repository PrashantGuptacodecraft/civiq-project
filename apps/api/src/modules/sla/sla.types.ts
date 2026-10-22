export type SlaStatus = 'WITHIN_SLA' | 'WARNING' | 'BREACHED';

export type WorkingHoursMode = 'CONTINUOUS_24_7' | 'BUSINESS_HOURS';

export type PriorityTierLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export interface WorkingHoursConfig {
  startHour: number; // e.g. 9 for 09:00
  startMinute: number; // e.g. 0
  endHour: number; // e.g. 18 for 18:00
  endMinute: number; // e.g. 0
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timeZone: string; // e.g. 'Asia/Kolkata', 'UTC'
  holidays?: string[] | undefined; // 'YYYY-MM-DD'
}

export interface SlaRuleConfig {
  id: string;
  categoryId?: string | undefined;
  priorityTier?: PriorityTierLevel | undefined;
  jurisdictionId?: string | undefined;
  targetDurationHours: number;
  workingHoursMode: WorkingHoursMode;
  warningThresholdPercentage?: number | undefined; // default 75 (%)
  description?: string | undefined;
}

export interface SlaCalculationInput {
  issueId: string;
  categoryId: string;
  priorityTier?: PriorityTierLevel | undefined;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  jurisdictionId?: string | undefined;
  createdAt: Date | string;
  referenceTime?: Date | string | undefined; // Evaluated at this point in time (defaults to now)
  customRule?: Partial<SlaRuleConfig> | undefined;
}

export interface SlaAgingResult {
  ageHours: number; // Raw wall-clock hours elapsed
  businessElapsedHours: number; // Active working hours elapsed
  totalTargetHours: number; // Target SLA window
  percentageElapsed: number; // 0 - 100+ %
}

export interface SlaCountdownResult {
  remainingMs: number;
  remainingHours: number;
  countdownFormatted: string; // e.g. "2d 4h 15m" or "-3h 20m overdue"
  isOverdue: boolean;
  isWarning: boolean;
  status: SlaStatus;
}

export interface SlaEvaluationResult {
  issueId: string;
  categoryId: string;
  priorityTier: PriorityTierLevel;
  jurisdictionId?: string | undefined;
  ruleApplied: SlaRuleConfig;
  workingHoursMode: WorkingHoursMode;
  createdAt: Date;
  dueAt: Date;
  aging: SlaAgingResult;
  countdown: SlaCountdownResult;
  status: SlaStatus;
  decisionEvidence: Record<string, unknown>;
}
