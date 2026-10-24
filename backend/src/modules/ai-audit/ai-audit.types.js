import {
  AiAuditOperation,
  AiHumanDecisionType,
  AiAuditRecordDto,
  AiAdminComparisonFilter,
  AiAdminComparisonSummary,
  AiEvaluationRecordDto,
} from '@civiq/shared-contracts';

export interface RecordInferenceParams {
  operation;
  issueId?;
  traceId?;
  modelName;
  modelVersion;
  promptTemplate?;
  configSnapshot?, unknown> | undefined;
  confidence?;
  rawInput;
  inferenceOutput;
  latencyMs?;
}

export interface RecordHumanDecisionParams {
  auditRecordId;
  decision;
  reviewerId;
  notes?;
  overrideReason?;
  finalOutcome?, unknown> | undefined;
}

export interface EvaluationRecordOptions {
  agreementTolerance?; // For numerical scores e.g. priority
}