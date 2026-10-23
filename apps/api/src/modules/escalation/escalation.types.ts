import { PriorityTierLevel, SlaEvaluationResult } from '../sla/sla.types';

export type EscalationLevel =
  | 'NONE'
  | 'WARNING'
  | 'SUPERVISOR_BREACH'
  | 'OFFICER_CRITICAL_BREACH';

export type EscalationTargetRole =
  | 'FIELD_WORKER'
  | 'FIELD_SUPERVISOR'
  | 'DEPARTMENT_OFFICER'
  | 'DISTRICT_ULB_ADMIN';

export interface EscalationConfig {
  warningThresholdPct: number; // default 75
  breachThresholdPct: number; // default 100
  criticalBreachThresholdPct: number; // default 150
  cooldownMinutes: number; // default 60 minutes
}

export interface EscalationRecipient {
  userId: string;
  name?: string | undefined;
  email?: string | undefined;
  role: EscalationTargetRole;
}

export interface EscalationEvent {
  id: string;
  issueId: string;
  issueTitle: string;
  categoryId: string;
  jurisdictionId: string;
  departmentId?: string | undefined;
  level: EscalationLevel;
  slaPercentage: number;
  remainingHours: number;
  dueAt: Date;
  recipients: EscalationRecipient[];
  idempotencyKey: string;
  triggeredAt: Date;
  decisionEvidence: Record<string, unknown>;
}

export interface EscalationRecord {
  id: string;
  issueId: string;
  level: EscalationLevel;
  idempotencyKey: string;
  status: 'TRIGGERED' | 'SUPPRESSED_DUPLICATE';
  recipientsCount: number;
  triggeredAt: Date;
  details: Record<string, unknown>;
}

export interface EvaluateEscalationInput {
  issueId: string;
  issueTitle: string;
  categoryId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityTier?: PriorityTierLevel | undefined;
  jurisdictionId: string;
  departmentId?: string | undefined;
  assignedWorkerId?: string | undefined;
  createdAt: Date | string;
  referenceTime?: Date | string | undefined;
  customConfig?: Partial<EscalationConfig> | undefined;
}

export interface EscalationEvaluationResult {
  issueId: string;
  shouldEscalate: boolean;
  escalationLevel: EscalationLevel;
  targetRoles: EscalationTargetRole[];
  isDuplicate: boolean;
  suppressionReason?: string | undefined;
  escalationEvent?: EscalationEvent | undefined;
  slaEvaluation: SlaEvaluationResult;
  decisionEvidence: Record<string, unknown>;
}
