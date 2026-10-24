import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { aiAuditService } from './ai-audit.service';
import { aiAuditRouter } from './ai-audit.router';

describe('AiAuditService (Auditability & Governance)', () => {
  beforeEach(() => {
    aiAuditService.clear();
  });

  describe('Prompt and Config Hashing', () => {
    it('generates consistent SHA-256 hash for identical prompts and configurations', () => {
      const prompt = 'Classify civic issue: {{title}} {{description}}';
      const config = { temperature: 0.1, model: 'civiq-ai-core', threshold: 0.75 };

      const hash1 = aiAuditService.hashPromptOrConfig(prompt, config);
      const hash2 = aiAuditService.hashPromptOrConfig(prompt, config);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex string length
    });

    it('generates different hashes when prompt or config changes', () => {
      const prompt1 = 'Classify civic issue: {{title}}';
      const prompt2 = 'Classify civic issue: {{title}} {{description}}';
      const config = { temperature: 0.1 };

      const hash1 = aiAuditService.hashPromptOrConfig(prompt1, config);
      const hash2 = aiAuditService.hashPromptOrConfig(prompt2, config);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('recordInference', () => {
    it('persists AI inference result with redacted inputs and governance metadata', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        issueId: 'iss-101',
        traceId: 'trace-abc-123',
        modelName: 'civiq-classifier',
        modelVersion: '1.2.0',
        promptTemplate: 'You are an urban classifier. Title: {{title}}',
        configSnapshot: { temperature: 0.0, topK: 3 },
        confidence: 0.94,
        latencyMs: 45.2,
        rawInput: {
          title: 'Deep pothole reported by Ramesh 9876543210',
          description: 'Aadhaar 5432 1098 7654. Emergency near bus stop.',
          password: 'sensitive_internal_key',
        },
        inferenceOutput: {
          primary_category: 'roads_pothole',
          confidence: 0.94,
          predicted_severity: 'HIGH',
        },
      });

      expect(record.id).toMatch(/^ai_audit_/);
      expect(record.operation).toBe('CLASSIFICATION');
      expect(record.issueId).toBe('iss-101');
      expect(record.traceId).toBe('trace-abc-123');
      expect(record.modelName).toBe('civiq-classifier');
      expect(record.modelVersion).toBe('1.2.0');
      expect(record.promptConfigHash?.length).toBe(64);
      expect(record.confidence).toBe(0.94);
      expect(record.humanDecision).toBe('PENDING_REVIEW');
      expect(record.isRedacted).toBe(true);

      // Verify PII redaction inside stored rawInputRedacted
      expect(record.rawInputRedacted.title).toBe(
        'Deep pothole reported by Ramesh [REDACTED_PHONE]'
      );
      expect(record.rawInputRedacted.description).toBe(
        'Aadhaar [REDACTED_AADHAAR]. Emergency near bus stop.'
      );
      expect(record.rawInputRedacted.password).toBe('[REDACTED_SECRET]');
    });
  });

  describe('recordHumanDecision', () => {
    it('updates human decision, notes, reviewerId and reasons', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        issueId: 'iss-202',
        modelName: 'civiq-classifier',
        modelVersion: '1.2.0',
        confidence: 0.82,
        rawInput: { title: 'Water leakage' },
        inferenceOutput: { primary_category: 'water_pipeline_leak' },
      });

      const updated = await aiAuditService.recordHumanDecision({
        auditRecordId: record.id,
        decision: 'OVERRIDDEN',
        reviewerId: 'officer-456',
        notes: 'Inspection revealed it is sewage overflow, not clean water pipeline.',
        overrideReason: 'CATEGORY_INCORRECT',
        finalOutcome: { primaryCategory: 'sanitation_blocked_drain' },
      });

      expect(updated).not.toBeNull();
      expect(updated?.humanDecision).toBe('OVERRIDDEN');
      expect(updated?.humanDecisionBy).toBe('officer-456');
      expect(updated?.overrideReason).toBe('CATEGORY_INCORRECT');
      expect(updated?.humanDecidedAt).toBeDefined();
      expect(updated?.evaluationMetrics?.isAgreement).toBe(false);
      expect(updated?.evaluationMetrics?.discrepancyType).toBe('CATEGORY_MISMATCH');
    });
  });

  describe('createEvaluationRecord', () => {
    it('generates structured evaluation record format for agreement (ACCEPTED)', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'PRIORITY_SCORING',
        issueId: 'iss-303',
        modelName: 'civiq-priority-engine',
        modelVersion: '1.0.0',
        confidence: 0.91,
        rawInput: { title: 'Live wire sparking' },
        inferenceOutput: { priority_tier: 'P1_CRITICAL', priority_score: 92.0 },
      });

      await aiAuditService.recordHumanDecision({
        auditRecordId: record.id,
        decision: 'ACCEPTED',
        reviewerId: 'admin-1',
        notes: 'Confirmed critical danger.',
      });

      const evalRecord = await aiAuditService.createEvaluationRecord(record.id);

      expect(evalRecord).not.toBeNull();
      expect(evalRecord?.isAgreement).toBe(true);
      expect(evalRecord?.discrepancyType).toBe('NONE');
      expect(evalRecord?.confidenceCalibrated).toBe(true); // 0.91 >= 0.70 with agreement
      expect(evalRecord?.metrics.confidence).toBe(0.91);
      expect(evalRecord?.metrics.humanDecision).toBe('ACCEPTED');
    });

    it('identifies PRIORITY_TIER_OVERRIDE when human modifies priority tier', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'PRIORITY_SCORING',
        issueId: 'iss-304',
        modelName: 'civiq-priority-engine',
        modelVersion: '1.0.0',
        confidence: 0.85,
        rawInput: { title: 'Pothole on residential street' },
        inferenceOutput: { priority_tier: 'P2_HIGH', priority_score: 65.0 },
      });

      await aiAuditService.recordHumanDecision({
        auditRecordId: record.id,
        decision: 'MODIFIED',
        reviewerId: 'officer-88',
        overrideReason: 'NON_URGENT_RESIDENTIAL',
        finalOutcome: { priorityTier: 'P3_MEDIUM' },
      });

      const evalRecord = await aiAuditService.createEvaluationRecord(record.id);

      expect(evalRecord?.isAgreement).toBe(false);
      expect(evalRecord?.discrepancyType).toBe('PRIORITY_TIER_OVERRIDE');
    });

    it('identifies DUPLICATE_FALSE_POSITIVE discrepancy for duplicate detection', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'DUPLICATE_DETECTION',
        issueId: 'iss-305',
        modelName: 'civiq-dedup-ensemble',
        modelVersion: '1.0.0',
        confidence: 0.88,
        rawInput: { title: 'Streetlight Indiranagar vs MG Road' },
        inferenceOutput: { is_duplicate: true, top_similarity_score: 0.78 },
      });

      await aiAuditService.recordHumanDecision({
        auditRecordId: record.id,
        decision: 'REJECTED',
        reviewerId: 'officer-99',
        overrideReason: 'DIFFERENT_LOCATIONS',
        finalOutcome: { isDuplicate: false },
      });

      const evalRecord = await aiAuditService.createEvaluationRecord(record.id);

      expect(evalRecord?.isAgreement).toBe(false);
      expect(evalRecord?.discrepancyType).toBe('DUPLICATE_FALSE_POSITIVE');
    });
  });

  describe('getAdminComparisonView', () => {
    it('aggregates governance statistics: acceptance rate, rate, and top reasons', async () => {
      // 1. Accepted inference
      const r1 = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        confidence: 0.95,
        rawInput: { title: 'Issue 1' },
        inferenceOutput: { category: 'roads_pothole' },
      });
      await aiAuditService.recordHumanDecision({
        auditRecordId: r1.id,
        decision: 'ACCEPTED',
        reviewerId: 'user-1',
      });

      // 2. Second Accepted inference
      const r2 = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        confidence: 0.90,
        rawInput: { title: 'Issue 2' },
        inferenceOutput: { category: 'water_leak' },
      });
      await aiAuditService.recordHumanDecision({
        auditRecordId: r2.id,
        decision: 'ACCEPTED',
        reviewerId: 'user-2',
      });

      // 3. Overridden inference
      const r3 = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        confidence: 0.65,
        rawInput: { title: 'Issue 3' },
        inferenceOutput: { category: 'sanitation' },
      });
      await aiAuditService.recordHumanDecision({
        auditRecordId: r3.id,
        decision: 'OVERRIDDEN',
        reviewerId: 'user-3',
        overrideReason: 'MISCLASSIFIED_WATER',
      });

      // 4. Pending inference
      await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        confidence: 0.88,
        rawInput: { title: 'Issue 4' },
        inferenceOutput: { category: 'roads_pothole' },
      });

      const summary = await aiAuditService.getAdminComparisonView();

      expect(summary.totalInferences).toBe(4);
      expect(summary.acceptedCount).toBe(2);
      expect(summary.overriddenCount).toBe(1);
      expect(summary.pendingReviewCount).toBe(1);

      // Decided = 3. Accepted = 2/3 = 66.67%. Overridden = 1/3 = 33.33%
      expect(summary.acceptanceRate).toBe(66.67);
      expect(summary.overrideRate).toBe(33.33);

      expect(summary.avgConfidenceAccepted).toBeCloseTo(0.925, 2);
      expect(summary.avgConfidenceOverridden).toBeCloseTo(0.65, 2);

      expect(summary.topOverrideReasons.length).toBe(1);
      expect(summary.topOverrideReasons[0]?.reason).toBe('MISCLASSIFIED_WATER');
      expect(summary.topOverrideReasons[0]?.count).toBe(1);
    });

    it('filters records by operation', async () => {
      await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'm1',
        modelVersion: '1.0',
        rawInput: {},
        inferenceOutput: {},
      });
      await aiAuditService.recordInference({
        operation: 'PRIORITY_SCORING',
        modelName: 'm2',
        modelVersion: '1.0',
        rawInput: {},
        inferenceOutput: {},
      });

      const classView = await aiAuditService.getAdminComparisonView({
        operation: 'CLASSIFICATION',
      });
      expect(classView.totalInferences).toBe(1);
      expect(classView.records[0]?.operation).toBe('CLASSIFICATION');

      const prioView = await aiAuditService.getAdminComparisonView({
        operation: 'PRIORITY_SCORING',
      });
      expect(prioView.totalInferences).toBe(1);
      expect(prioView.records[0]?.operation).toBe('PRIORITY_SCORING');
    });
  });

  describe('REST Router Integration', () => {
    const app = express();
    app.use(express.json());
    app.use('/ai-audit', aiAuditRouter);

    it('GET /ai-audit/admin/comparison returns 200 with summary statistics', async () => {
      const res = await request(app).get('/ai-audit/admin/comparison');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalInferences).toBeDefined();
      expect(res.body.data.acceptanceRate).toBeDefined();
      expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('POST /ai-audit/records/:id/decision updates human decision via REST API', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        rawInput: { title: 'Test issue' },
        inferenceOutput: { category: 'roads_pothole' },
      });

      const res = await request(app)
        .post(`/ai-audit/records/${record.id}/decision`)
        .send({
          decision: 'ACCEPTED',
          reviewerId: 'officer-rest-1',
          notes: 'Looks correct.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.humanDecision).toBe('ACCEPTED');
      expect(res.body.data.humanDecisionBy).toBe('officer-rest-1');
    });

    it('GET /ai-audit/records/:id/evaluation returns evaluation metrics', async () => {
      const record = await aiAuditService.recordInference({
        operation: 'CLASSIFICATION',
        modelName: 'civiq-classifier',
        modelVersion: '1.0',
        confidence: 0.92,
        rawInput: { title: 'Pothole' },
        inferenceOutput: { primary_category: 'roads_pothole' },
      });

      await aiAuditService.recordHumanDecision({
        auditRecordId: record.id,
        decision: 'ACCEPTED',
        reviewerId: 'admin-eval',
      });

      const res = await request(app).get(`/ai-audit/records/${record.id}/evaluation`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAgreement).toBe(true);
      expect(res.body.data.confidenceCalibrated).toBe(true);
    });
  });
});