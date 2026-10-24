export interface WorkingHoursConfig {
  startHour; // e.g. 9 for 09:00
  startMinute; // e.g. 0
  endHour; // e.g. 18 for 18:00
  endMinute; // e.g. 0
  workingDays[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timeZone; // e.g. 'Asia/Kolkata', 'UTC'
  holidays?[] | undefined; // 'YYYY-MM-DD'
}

export interface SlaRuleConfig {
  id;
  categoryId?;
  priorityTier?;
  jurisdictionId?;
  targetDurationHours;
  workingHoursMode;
  warningThresholdPercentage?; // default 75 (%)
  description?;
}

export interface SlaCalculationInput {
  issueId;
  categoryId;
  priorityTier?;
  severity?'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
  jurisdictionId?;
  createdAt;
  referenceTime?; // Evaluated at this point in time (defaults to now)
  customRule?;
}

export interface SlaAgingResult {
  ageHours; // Raw wall-clock hours elapsed
  businessElapsedHours; // Active working hours elapsed
  totalTargetHours; // Target SLA window
  percentageElapsed; // 0 - 100+ %
}

export interface SlaCountdownResult {
  remainingMs;
  remainingHours;
  countdownFormatted; // e.g. "2d 4h 15m" or "-3h 20m overdue"
  isOverdue;
  isWarning;
  status;
}

export interface SlaEvaluationResult {
  issueId;
  categoryId;
  priorityTier;
  jurisdictionId?;
  ruleApplied;
  workingHoursMode;
  createdAt;
  dueAt;
  aging;
  countdown;
  status;
  decisionEvidence;
}