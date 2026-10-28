/**
 * Phase 54 Exit Checks: Asset Cost/Benefit Decision Support Tests
 * Validates cumulative repair cost vs replacement threshold evaluation,
 * policy-configured thresholds per asset category, explainable recommendations,
 * role-based financial redaction, and REST API endpoints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { assetService } from '../assets/asset.service.js';
import { maintenanceService } from '../maintenance/maintenance.service.js';
import {
  assetDecisionService,
  policyThresholdManager,
  DECISION_RECOMMENDATIONS,
  DECISION_REASON_CODES,
  REDACTED_FINANCIAL_VALUE,
} from './index.js';

describe('Phase 54: Cost/Benefit Asset Decision Support', () => {
  beforeEach(() => {
    assetService.reset();
    maintenanceService.reset();
    assetDecisionService.reset();
  });

  describe('1. Decision Engine: Cumulative Repair Cost vs Replacement Threshold', () => {
    it('recommends REPLACE_REVIEW_RECOMMENDED when cumulative repairs exceed policy threshold', async () => {
      // Create a road segment with ₹3,200,000 repairs on ₹5,000,000 replacement cost
      // Road default threshold is 0.60 (60% -> ₹3,000,000)
      const road = await assetService.createAsset({
        assetTag: 'AST-RD-TEST-01',
        name: 'High Wear Carriageway',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        jurisdictionId: 'mh-pune-pmc',
        conditionScore: 42,
        installationDate: '2019-01-01T00:00:00Z',
        metadata: {
          replacementCostInr: 5000000.0,
          expectedLifespanYears: 7.0,
        },
      });

      // Record maintenance repairs totaling ₹3,200,000
      await maintenanceService.recordMaintenanceAction(
        {
          assetId: road.id,
          actionType: 'EMERGENCY_REPAIR',
          partsCost: 1500000,
          laborCost: 500000,
          contractorCost: 1200000,
          notes: 'Full depth patch and subgrade stabilization',
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(road.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.REPLACE_REVIEW_RECOMMENDED);
      expect(decision.cumulativeRepairCost).toBe(3200000.0);
      expect(decision.estimatedReplacementCost).toBe(5000000.0);
      expect(decision.repairToReplacementRatio).toBe(0.64);
      expect(decision.appliedThresholdRatio).toBe(0.60);
      expect(decision.costOverrun).toBe(200000.0);
      expect(decision.costHeadroom).toBe(-200000.0);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.THRESHOLD_EXCEEDED);
      expect(decision.explanation).toContain('Capital replacement review recommended');
      expect(decision.explanation).toContain('exceeding the municipal 60% policy ceiling by ₹');
      expect(decision.isAuthoritative).toBe(false);
      expect(decision.disclaimer).toContain('Non-Authoritative');
    });

    it('recommends REHABILITATE_OR_OVERHAUL when repairs approach warning threshold', async () => {
      // Transformer default threshold is 0.50 (50%), warning threshold is 0.35 (35%), baseline ₹1,200,000
      const transformer = await assetService.createAsset({
        assetTag: 'AST-TR-TEST-01',
        name: 'Industrial Distribution Transformer',
        assetType: 'ELECTRICAL_TRANSFORMER',
        department: 'Electrical & Power Supply',
        jurisdictionId: 'mh-pune-pcmc',
        conditionScore: 55,
        metadata: {
          replacementCostInr: 1200000.0,
        },
      });

      // Record repairs totaling ₹500,000 (ratio = 41.67%, between 35% and 50%)
      await maintenanceService.recordMaintenanceAction(
        {
          assetId: transformer.id,
          actionType: 'COMPONENT_REPLACEMENT',
          partsCost: 350000,
          laborCost: 150000,
          notes: 'Secondary coil rewinding',
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(transformer.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.REHABILITATE_OR_OVERHAUL);
      expect(decision.repairToReplacementRatio).toBeCloseTo(0.4167, 3);
      expect(decision.appliedThresholdRatio).toBe(0.50);
      expect(decision.warningThresholdRatio).toBe(0.35);
      expect(decision.costOverrun).toBe(0.0);
      expect(decision.costHeadroom).toBe(100000.0);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.NEAR_THRESHOLD_WARNING);
      expect(decision.explanation).toContain('Comprehensive overhaul or rehabilitation recommended');
    });

    it('recommends CONTINUE_MAINTENANCE when repairs are well within warning threshold', async () => {
      // Streetlight default threshold is 0.70 (70%), warning is 0.45 (45%), baseline ₹80,000
      const light = await assetService.createAsset({
        assetTag: 'AST-SL-TEST-01',
        name: 'Paud Road Smart LED',
        assetType: 'STREETLIGHT',
        department: 'Electrical & Power Supply',
        jurisdictionId: 'mh-pune-pmc',
        conditionScore: 90,
        metadata: {
          replacementCostInr: 80000.0,
        },
      });

      // Record minor repair: ₹12,000 (15%)
      await maintenanceService.recordMaintenanceAction(
        {
          assetId: light.id,
          actionType: 'PREVENTIVE_MAINTENANCE',
          partsCost: 8000,
          laborCost: 4000,
          notes: 'Surge protector replacement',
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(light.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.CONTINUE_MAINTENANCE);
      expect(decision.repairToReplacementRatio).toBe(0.15);
      expect(decision.appliedThresholdRatio).toBe(0.70);
      expect(decision.costHeadroom).toBe(44000.0); // 56,000 - 12,000
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.COST_EFFECTIVE_REPAIRS);
      expect(decision.explanation).toContain('Routine maintenance remains cost-effective');
    });
  });

  describe('2. Policy-Configured Thresholds per Asset Category', () => {
    it('applies category-specific default threshold ratios and baseline replacement costs', async () => {
      const roadPolicy = policyThresholdManager.getThreshold('ROAD_SEGMENT');
      expect(roadPolicy.replacementThresholdRatio).toBe(0.60);
      expect(roadPolicy.baselineReplacementCostInr).toBe(5000000.0);

      const transformerPolicy = policyThresholdManager.getThreshold('ELECTRICAL_TRANSFORMER');
      expect(transformerPolicy.replacementThresholdRatio).toBe(0.50);
      expect(transformerPolicy.baselineReplacementCostInr).toBe(1200000.0);

      const waterPolicy = policyThresholdManager.getThreshold('WATER_PIPELINE');
      expect(waterPolicy.replacementThresholdRatio).toBe(0.55);
      expect(waterPolicy.baselineReplacementCostInr).toBe(3500000.0);

      const lightPolicy = policyThresholdManager.getThreshold('STREETLIGHT');
      expect(lightPolicy.replacementThresholdRatio).toBe(0.70);
      expect(lightPolicy.baselineReplacementCostInr).toBe(80000.0);
    });

    it('allows administrative updates to category threshold policies', async () => {
      // Tighten ROAD_SEGMENT threshold to 0.48
      const updated = assetDecisionService.updatePolicyThreshold(
        'ROAD_SEGMENT',
        {
          replacementThresholdRatio: 0.48,
          warningThresholdRatio: 0.30,
          baselineReplacementCostInr: 5500000.0,
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      expect(updated.replacementThresholdRatio).toBe(0.48);
      expect(updated.warningThresholdRatio).toBe(0.30);
      expect(updated.baselineReplacementCostInr).toBe(5500000.0);

      // Verify new threshold is used in evaluation
      const road = await assetService.createAsset({
        assetTag: 'AST-RD-POLICY-TEST',
        name: 'Policy Test Road Segment',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        jurisdictionId: 'mh-pune-pmc',
        conditionScore: 70,
        metadata: {
          replacementCostInr: 5500000.0,
        },
      });

      await maintenanceService.recordMaintenanceAction(
        {
          assetId: road.id,
          partsCost: 2000000,
          laborCost: 700000, // total ₹2,700,000 -> ratio = 49.09% (exceeds new 48%)
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(road.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.appliedThresholdRatio).toBe(0.48);
      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.REPLACE_REVIEW_RECOMMENDED);
    });

    it('rejects unauthorized users attempting to update threshold policy', async () => {
      expect(() => {
        assetDecisionService.updatePolicyThreshold(
          'ROAD_SEGMENT',
          { replacementThresholdRatio: 0.50 },
          { user: { role: 'CITIZEN' } }
        );
      }).toThrow(/requires administrative privileges/);
    });

    it('validates threshold ratio boundary constraints', async () => {
      expect(() => {
        assetDecisionService.updatePolicyThreshold(
          'ROAD_SEGMENT',
          { replacementThresholdRatio: 1.5 },
          { user: { role: 'PLATFORM_SUPER_ADMIN' } }
        );
      }).toThrow(/between 0.10 and 1.00/);

      expect(() => {
        assetDecisionService.updatePolicyThreshold(
          'ROAD_SEGMENT',
          { replacementThresholdRatio: 0.60, warningThresholdRatio: 0.65 },
          { user: { role: 'PLATFORM_SUPER_ADMIN' } }
        );
      }).toThrow(/less than replacement threshold ratio/);
    });
  });

  describe('3. Contextual Lifespan and Degradation Rules', () => {
    it('flags EXCEEDED_DESIGN_LIFESPAN and SEVERE_CONDITION_WEAR', async () => {
      // Culvert: 26 years old (exceeds 25y lifespan), condition 32/100, 4 failures
      const culvert = await assetService.createAsset({
        assetTag: 'AST-DR-OLD-01',
        name: 'Aged Deccan Culvert Section',
        assetType: 'DRAINAGE_CULVERT',
        department: 'Stormwater Drainage',
        jurisdictionId: 'mh-pune-pmc',
        conditionScore: 32,
        installationDate: '1998-01-01T00:00:00Z',
        metadata: {
          ageYears: 26.0,
          expectedLifespanYears: 25.0,
          replacementCostInr: 2500000.0,
        },
      });

      // 4 maintenance events
      for (let i = 0; i < 4; i++) {
        await maintenanceService.recordMaintenanceAction(
          {
            assetId: culvert.id,
            partsCost: 200000,
            laborCost: 100000,
          },
          { user: { role: 'DISTRICT_ULB_ADMIN' } }
        );
      }

      const decision = await assetDecisionService.evaluateAssetDecision(culvert.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.EXCEEDED_DESIGN_LIFESPAN);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.SEVERE_CONDITION_WEAR);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.CHRONIC_FAILURE_COST_ACCELERATION);
      expect(decision.contributingFactors.length).toBeGreaterThanOrEqual(3);
    });

    it('flags BUDGET_CAP_EXCEEDED when annual repairs breach category cap', async () => {
      // Transformer annual repair budget cap is ₹400,000
      const transformer = await assetService.createAsset({
        assetTag: 'AST-TR-CAP-01',
        name: 'Over-Budget Transformer',
        assetType: 'ELECTRICAL_TRANSFORMER',
        department: 'Electrical & Power Supply',
        jurisdictionId: 'mh-pune-pcmc',
        conditionScore: 70,
        metadata: {
          replacementCostInr: 1200000.0,
        },
      });

      await maintenanceService.recordMaintenanceAction(
        {
          assetId: transformer.id,
          partsCost: 300000,
          laborCost: 150000, // total ₹450,000 in past year (exceeds ₹400,000 cap)
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(transformer.id, {
        user: { role: 'DISTRICT_ULB_ADMIN' },
      });

      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.REHABILITATE_OR_OVERHAUL);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.BUDGET_CAP_EXCEEDED);
    });
  });

  describe('4. Role-Based Financial Redaction Enforcement', () => {
    it('reveals exact financial figures to authorized roles (DISTRICT_ULB_ADMIN, DEPARTMENT_OFFICER, AUDITOR)', async () => {
      const road = await assetService.createAsset({
        assetTag: 'AST-RD-AUTH-01',
        name: 'Auth Verification Carriageway',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        jurisdictionId: 'mh-pune-pmc',
        metadata: { replacementCostInr: 5000000.0 },
      });

      await maintenanceService.recordMaintenanceAction(
        {
          assetId: road.id,
          partsCost: 1000000,
          laborCost: 500000,
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(road.id, {
        user: { role: 'DEPARTMENT_OFFICER' },
      });

      expect(decision.isFinancialDataRedacted).toBe(false);
      expect(decision.cumulativeRepairCost).toBe(1500000.0);
      expect(decision.estimatedReplacementCost).toBe(5000000.0);
      expect(decision.explanation).toContain('₹');
    });

    it('redacts sensitive financial numbers when accessed by CITIZEN or non-financial role', async () => {
      const road = await assetService.createAsset({
        assetTag: 'AST-RD-CITIZEN-01',
        name: 'Citizen View Road',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        jurisdictionId: 'mh-pune-pmc',
        metadata: { replacementCostInr: 5000000.0 },
      });

      await maintenanceService.recordMaintenanceAction(
        {
          assetId: road.id,
          partsCost: 1000000,
          laborCost: 500000,
        },
        { user: { role: 'DISTRICT_ULB_ADMIN' } }
      );

      const decision = await assetDecisionService.evaluateAssetDecision(road.id, {
        user: { role: 'CITIZEN' },
      });

      expect(decision.isFinancialDataRedacted).toBe(true);
      expect(decision.cumulativeRepairCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(decision.estimatedReplacementCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(decision.costHeadroom).toBe(REDACTED_FINANCIAL_VALUE);
      expect(decision.costOverrun).toBe(REDACTED_FINANCIAL_VALUE);

      // Financial figures in explanation narrative are redacted
      expect(decision.explanation).not.toContain('₹1,500,000');
      expect(decision.explanation).toContain('[REDACTED_AMOUNT]');

      // But operational recommendation and reason codes remain accessible
      expect(decision.recommendation).toBe(DECISION_RECOMMENDATIONS.CONTINUE_MAINTENANCE);
      expect(decision.reasonCodes).toContain(DECISION_REASON_CODES.COST_EFFECTIVE_REPAIRS);
    });
  });

  describe('5. REST API Integration Endpoints', () => {
    it('GET /asset-decisions/policies returns all category replacement thresholds', async () => {
      const res = await request(app).get('/asset-decisions/policies');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.policies.ROAD_SEGMENT).toBeDefined();
      expect(res.body.policies.ROAD_SEGMENT.replacementThresholdRatio).toBe(0.60);
      expect(res.body.policies.ELECTRICAL_TRANSFORMER.replacementThresholdRatio).toBe(0.50);
    });

    it('PUT /asset-decisions/policies/:category updates policy with admin headers', async () => {
      const res = await request(app)
        .put('/asset-decisions/policies/ELECTRICAL_TRANSFORMER')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .send({
          replacementThresholdRatio: 0.45,
          warningThresholdRatio: 0.30,
          baselineReplacementCostInr: 1300000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.policy.replacementThresholdRatio).toBe(0.45);
      expect(res.body.policy.baselineReplacementCostInr).toBe(1300000);
    });

    it('PUT /asset-decisions/policies/:category returns 403 when user is not admin', async () => {
      const res = await request(app)
        .put('/asset-decisions/policies/ELECTRICAL_TRANSFORMER')
        .set('x-user-role', 'CITIZEN')
        .send({
          replacementThresholdRatio: 0.45,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('requires administrative privileges');
    });

    it('GET /asset-decisions/evaluate/:assetId evaluates asset decision support', async () => {
      const asset = await assetService.createAsset({
        assetTag: 'AST-API-EVAL-01',
        name: 'API Evaluated Road',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        jurisdictionId: 'mh-pune-pmc',
        conditionScore: 50,
      });

      const res = await request(app)
        .get(`/asset-decisions/evaluate/${asset.id}`)
        .set('x-user-role', 'DISTRICT_ULB_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.decision.assetId).toBe(asset.id);
      expect(res.body.decision.recommendation).toBeDefined();
      expect(res.body.decision.disclaimer).toContain('Non-Authoritative');
    });

    it('POST /asset-decisions/evaluate-batch evaluates multiple assets', async () => {
      const res = await request(app)
        .post('/asset-decisions/evaluate-batch')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .send({ jurisdictionId: 'mh-pune-pmc' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalEvaluated).toBeGreaterThan(0);
      expect(res.body.summary).toBeDefined();
      expect(Array.isArray(res.body.decisions)).toBe(true);
    });
  });
});
