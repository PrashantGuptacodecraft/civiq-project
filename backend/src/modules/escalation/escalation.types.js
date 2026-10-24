import { PriorityTierLevel, SlaEvaluationResult } from '../sla/sla.types';

| 'OFFICER_CRITICAL_BREACH';

| 'DISTRICT_ULB_ADMIN';

export interface EscalationConfig {
  warningThresholdPct; // default 75
  breachThresholdPct; // default 100
  criticalBreachThresholdPct; // default 150
  cooldownMinutes; // default 60 minutes
}

export interface EscalationRecipient {
  userId;
  name?;
  email?;
  role;
}

export interface EscalationEvent {
  id;
  issueId;
  issueTitle;
  categoryId;
  jurisdictionId;
  departmentId?;
  level;
  slaPercentage;
  remainingHours;
  dueAt;
  recipients;
  idempotencyKey;
  triggeredAt;
  decisionEvidence;
}

export interface EscalationRecord {
  id;
  issueId;
  level;
  idempotencyKey;
  status: 'TRIGGERED' | 'SUPPRESSED_DUPLICATE';
  recipientsCount;
  triggeredAt;
  details;
}

export interface EvaluateEscalationInput {
  issueId;
  issueTitle;
  categoryId;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityTier?;
  jurisdictionId;
  departmentId?;
  assignedWorkerId?;
  createdAt;
  referenceTime?;
  customConfig?;
}

export interface EscalationEvaluationResult {
  issueId;
  shouldEscalate;
  escalationLevel;
  targetRoles;
  isDuplicate;
  suppressionReason?;
  escalationEvent?;
  slaEvaluation;
  decisionEvidence;
}