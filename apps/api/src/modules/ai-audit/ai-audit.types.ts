import {
  AiAuditOperation,
  AiHumanDecisionType,
  AiAuditRecordDto,
  AiAdminComparisonFilter,
  AiAdminComparisonSummary,
  AiEvaluationRecordDto,
} from '@civiq/contracts';

export type {
  AiAuditOperation,
  AiHumanDecisionType,
  AiAuditRecordDto,
  AiAdminComparisonFilter,
  AiAdminComparisonSummary,
  AiEvaluationRecordDto,
};

export interface RecordInferenceParams {
  operation: AiAuditOperation;
  issueId?: string | undefined;
  traceId?: string | undefined;
  modelName: string;
  modelVersion: string;
  promptTemplate?: string | undefined;
  configSnapshot?: Record<string, unknown> | undefined;
  confidence?: number | undefined;
  rawInput: Record<string, unknown>;
  inferenceOutput: Record<string, unknown>;
  latencyMs?: number | undefined;
}

export interface RecordHumanDecisionParams {
  auditRecordId: string;
  decision: AiHumanDecisionType;
  reviewerId: string;
  notes?: string | undefined;
  overrideReason?: string | undefined;
  finalOutcome?: Record<string, unknown> | undefined;
}

export interface EvaluationRecordOptions {
  agreementTolerance?: number | undefined; // For numerical scores e.g. priority
}
