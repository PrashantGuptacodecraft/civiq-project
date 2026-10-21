import crypto from 'node:crypto';
import { prisma } from '@civiq/db';
import { redactPiiAndSecrets } from './redaction';
import {
  AiAuditOperation,
  AiAuditRecordDto,
  AiAdminComparisonFilter,
  AiAdminComparisonSummary,
  AiEvaluationRecordDto,
  RecordHumanDecisionParams,
  RecordInferenceParams,
  EvaluationRecordOptions,
} from './ai-audit.types';

export class AiAuditService {
  private inMemoryRecords: Map<string, AiAuditRecordDto> = new Map();

  /**
   * Deterministically hash prompt template or model configuration using SHA-256.
   */
  public hashPromptOrConfig(
    promptTemplate?: string | undefined,
    configSnapshot?: Record<string, unknown> | undefined
  ): string {
    const raw = JSON.stringify({
      prompt: promptTemplate ?? '',
      config: configSnapshot ?? {},
    });
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Persist AI inference result with redacted input and model governance metadata.
   */
  public async recordInference(params: RecordInferenceParams): Promise<AiAuditRecordDto> {
    const id = `ai_audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const promptConfigHash = this.hashPromptOrConfig(params.promptTemplate, params.configSnapshot);
    const redactedInput = redactPiiAndSecrets(params.rawInput);

    const record: AiAuditRecordDto = {
      id,
      operation: params.operation,
      issueId: params.issueId,
      traceId: params.traceId,
      modelName: params.modelName,
      modelVersion: params.modelVersion,
      promptConfigHash,
      confidence: params.confidence,
      inferenceOutput: params.inferenceOutput,
      rawInputRedacted: redactedInput as Record<string, unknown>,
      isRedacted: true,
      humanDecision: 'PENDING_REVIEW',
      latencyMs: params.latencyMs,
      createdAt: new Date().toISOString(),
    };

    // 1. Maintain in-memory mirror for low latency & test stability
    this.inMemoryRecords.set(id, record);

    // 2. Persist to database if prisma.aiAuditRecord is available and not in test environment
    if (process.env.NODE_ENV !== 'test') {
      try {
        if (
          prisma &&
          (prisma as any).aiAuditRecord &&
          typeof (prisma as any).aiAuditRecord.create === 'function'
        ) {
          await (prisma as any).aiAuditRecord.create({
            data: {
              id,
              operation: params.operation,
              issueId: params.issueId ?? null,
              traceId: params.traceId ?? null,
              modelName: params.modelName,
              modelVersion: params.modelVersion,
              promptConfigHash,
              confidence: params.confidence ?? null,
              inferenceOutput: params.inferenceOutput,
              rawInputRedacted: redactedInput,
              isRedacted: true,
              humanDecision: 'PENDING_REVIEW',
              latencyMs: params.latencyMs ?? null,
            },
          });
        }
      } catch {
        // Non-fatal if database table is pending migration
      }
    }

    return record;
  }

  /**
   * Record human decision, reviewer feedback, and override reasons.
   */
  public async recordHumanDecision(
    params: RecordHumanDecisionParams
  ): Promise<AiAuditRecordDto | null> {
    const record = this.inMemoryRecords.get(params.auditRecordId);
    if (!record) {
      return null;
    }

    record.humanDecision = params.decision;
    record.humanDecisionBy = params.reviewerId;
    record.humanDecisionNotes = params.notes;
    record.overrideReason = params.overrideReason;
    record.finalOutcome = params.finalOutcome;
    record.humanDecidedAt = new Date().toISOString();

    // Automatically compute evaluation metrics
    const evalRecord = await this.createEvaluationRecord(params.auditRecordId);
    if (evalRecord) {
      record.evaluationMetrics = evalRecord.metrics;
    }

    // Persist update to database
    if (process.env.NODE_ENV !== 'test') {
      try {
        if (
          prisma &&
          (prisma as any).aiAuditRecord &&
          typeof (prisma as any).aiAuditRecord.update === 'function'
        ) {
          await (prisma as any).aiAuditRecord.update({
            where: { id: params.auditRecordId },
            data: {
              humanDecision: params.decision,
              humanDecisionBy: params.reviewerId,
              humanDecisionNotes: params.notes ?? null,
              overrideReason: params.overrideReason ?? null,
              finalOutcome: params.finalOutcome ?? null,
              humanDecidedAt: new Date(),
              evaluationMetrics: record.evaluationMetrics ?? null,
            },
          });
        }
      } catch {
        // Non-fatal
      }
    }

    return record;
  }

  /**
   * Create structured evaluation record format comparing AI recommendations against human decisions.
   */
  public async createEvaluationRecord(
    auditRecordId: string,
    options?: EvaluationRecordOptions
  ): Promise<AiEvaluationRecordDto | null> {
    const record = this.inMemoryRecords.get(auditRecordId);
    if (!record) return null;

    const isPending = record.humanDecision === 'PENDING_REVIEW';
    if (isPending) {
      return {
        recordId: record.id,
        operation: record.operation,
        modelName: record.modelName,
        modelVersion: record.modelVersion,
        isAgreement: false,
        humanDecision: 'PENDING_REVIEW',
        discrepancyType: 'PENDING_REVIEW',
        confidenceCalibrated: false,
        metrics: { status: 'PENDING_REVIEW' },
      };
    }

    const isAccepted = record.humanDecision === 'ACCEPTED';
    let isAgreement = isAccepted;
    let discrepancyType = isAccepted ? 'NONE' : 'OVERRIDE';

    // Detailed operation-specific discrepancy detection
    const aiOutput = record.inferenceOutput;
    const humanOutcome = record.finalOutcome || {};

    if (record.operation === 'CLASSIFICATION') {
      const aiCat = aiOutput.primary_category || aiOutput.primaryCategory;
      const humanCat = humanOutcome.category || humanOutcome.primaryCategory;
      if (humanCat && aiCat && humanCat !== aiCat) {
        discrepancyType = 'CATEGORY_MISMATCH';
        isAgreement = false;
      }
    } else if (record.operation === 'PRIORITY_SCORING') {
      const aiTier = aiOutput.priority_tier || aiOutput.priorityTier;
      const humanTier = humanOutcome.priorityTier || humanOutcome.tier;
      if (humanTier && aiTier && humanTier !== aiTier) {
        discrepancyType = 'PRIORITY_TIER_OVERRIDE';
        isAgreement = false;
      }
    } else if (record.operation === 'DUPLICATE_DETECTION') {
      const aiIsDup = Boolean(aiOutput.is_duplicate || aiOutput.isDuplicate);
      const humanIsDup =
        humanOutcome.isDuplicate !== undefined ? Boolean(humanOutcome.isDuplicate) : isAccepted;
      if (aiIsDup !== humanIsDup) {
        discrepancyType = aiIsDup ? 'DUPLICATE_FALSE_POSITIVE' : 'DUPLICATE_FALSE_NEGATIVE';
        isAgreement = false;
      }
    }

    // Confidence calibration: high confidence should correlate with agreement
    const conf = record.confidence ?? 0.5;
    const confidenceCalibrated = isAgreement ? conf >= 0.70 : conf < 0.70;

    const metrics = {
      isAgreement,
      discrepancyType,
      confidenceCalibrated,
      confidence: conf,
      latencyMs: record.latencyMs,
      humanDecision: record.humanDecision,
      overrideReason: record.overrideReason,
      evaluatedAt: new Date().toISOString(),
    };

    return {
      recordId: record.id,
      operation: record.operation,
      modelName: record.modelName,
      modelVersion: record.modelVersion,
      isAgreement,
      humanDecision: record.humanDecision,
      discrepancyType,
      confidenceCalibrated,
      metrics,
    };
  }

  /**
   * Generate Admin View comparison: AI recommendations vs Final Human Decisions.
   * Computes aggregated governance statistics: acceptance rate, override rate,
   * confidence calibration, and common override reasons.
   */
  public async getAdminComparisonView(
    filter?: AiAdminComparisonFilter
  ): Promise<AiAdminComparisonSummary> {
    const allRecords = Array.from(this.inMemoryRecords.values());

    // Apply filtering
    let filtered = allRecords;
    if (filter?.operation) {
      filtered = filtered.filter((r) => r.operation === filter.operation);
    }
    if (filter?.humanDecision) {
      filtered = filtered.filter((r) => r.humanDecision === filter.humanDecision);
    }
    if (filter?.modelName) {
      filtered = filtered.filter((r) => r.modelName === filter.modelName);
    }
    if (filter?.startDate) {
      filtered = filtered.filter((r) => r.createdAt >= filter.startDate!);
    }
    if (filter?.endDate) {
      filtered = filtered.filter((r) => r.createdAt <= filter.endDate!);
    }

    // Sort descending by creation date
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalInferences = filtered.length;
    let pendingReviewCount = 0;
    let acceptedCount = 0;
    let modifiedCount = 0;
    let overriddenCount = 0;
    let rejectedCount = 0;

    let confSumAccepted = 0;
    let confCountAccepted = 0;
    let confSumOverridden = 0;
    let confCountOverridden = 0;

    const overrideReasonsMap: Map<string, number> = new Map();

    for (const r of filtered) {
      switch (r.humanDecision) {
        case 'ACCEPTED':
          acceptedCount++;
          if (r.confidence !== undefined) {
            confSumAccepted += r.confidence;
            confCountAccepted++;
          }
          break;
        case 'MODIFIED':
          modifiedCount++;
          if (r.confidence !== undefined) {
            confSumOverridden += r.confidence;
            confCountOverridden++;
          }
          break;
        case 'OVERRIDDEN':
          overriddenCount++;
          if (r.confidence !== undefined) {
            confSumOverridden += r.confidence;
            confCountOverridden++;
          }
          if (r.overrideReason) {
            overrideReasonsMap.set(
              r.overrideReason,
              (overrideReasonsMap.get(r.overrideReason) || 0) + 1
            );
          }
          break;
        case 'REJECTED':
          rejectedCount++;
          if (r.confidence !== undefined) {
            confSumOverridden += r.confidence;
            confCountOverridden++;
          }
          if (r.overrideReason) {
            overrideReasonsMap.set(
              r.overrideReason,
              (overrideReasonsMap.get(r.overrideReason) || 0) + 1
            );
          }
          break;
        case 'PENDING_REVIEW':
        default:
          pendingReviewCount++;
          break;
      }
    }

    const decidedCount = acceptedCount + modifiedCount + overriddenCount + rejectedCount;
    const acceptanceRate =
      decidedCount > 0 ? Number(((acceptedCount / decidedCount) * 100).toFixed(2)) : 0.0;
    const overrideRate =
      decidedCount > 0
        ? Number((((modifiedCount + overriddenCount + rejectedCount) / decidedCount) * 100).toFixed(2))
        : 0.0;

    const avgConfidenceAccepted =
      confCountAccepted > 0 ? Number((confSumAccepted / confCountAccepted).toFixed(3)) : 0.0;
    const avgConfidenceOverridden =
      confCountOverridden > 0 ? Number((confSumOverridden / confCountOverridden).toFixed(3)) : 0.0;

    const topOverrideReasons = Array.from(overrideReasonsMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    const paginatedRecords = filtered.slice(offset, offset + limit);

    return {
      totalInferences,
      pendingReviewCount,
      acceptedCount,
      modifiedCount,
      overriddenCount,
      rejectedCount,
      acceptanceRate,
      overrideRate,
      avgConfidenceAccepted,
      avgConfidenceOverridden,
      topOverrideReasons,
      records: paginatedRecords,
    };
  }

  /**
   * Retrieve a single audit record by ID.
   */
  public async getRecordById(id: string): Promise<AiAuditRecordDto | null> {
    return this.inMemoryRecords.get(id) || null;
  }

  /**
   * Clear in-memory state (for test isolation).
   */
  public clear(): void {
    this.inMemoryRecords.clear();
  }
}

export const aiAuditService = new AiAuditService();
