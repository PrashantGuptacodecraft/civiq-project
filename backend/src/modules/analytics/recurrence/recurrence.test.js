/**
 * Phase 47 Exit Checks: Recurring Issue Analytics Tests
 * Validates asset linking, repeated failure detection across asset/category/location/time,
 * maintenance-review candidate generation, and REST API integration.
 */

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  recurrenceService,
  RecurrenceService,
} from './recurrence.service.js';
import { recurrenceRouter } from './recurrence.router.js';
import {
  MAINTENANCE_URGENCY,
  ASSET_TYPES,
  RECURRENCE_DISCLAIMER,
} from './recurrence.types.js';
import {
  SYNTHETIC_ASSET_REGISTRY,
  SYNTHETIC_RECURRING_ISSUES,
} from './recurrence.fixtures.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
  },
}));

describe('Phase 47: Recurring Issue Intelligence & Asset Linking Tests', () => {
  const referenceDate = new Date('2026-10-25T12:00:00Z');

  describe('1. Asset Linking Engine', () => {
    it('links issue with explicit assetId directly to registry asset', () => {
      const issue = SYNTHETIC_RECURRING_ISSUES.find((it) => it.id === 'iss-rec-001');
      const linked = recurrenceService.linkIssuesToAssets([issue])[0];

      expect(linked.assetId).toBe('AST-RD-104');
      expect(linked.assetName).toContain('FC Road Carriageway');
      expect(linked.assetType).toBe(ASSET_TYPES.ROAD_SEGMENT);
      expect(linked.assetDepartment).toBe('Roads & Public Works');
      expect(linked.isInferredAsset).toBe(false);
    });

    it('infers asset linkage via spatial proximity (< 50m) for unlinked coordinates near known assets', () => {
      // Issue at 18.5079, 73.8082 is ~15m from Valve V-118 (18.5078, 73.8081)
      const nearbyIssue = {
        id: 'iss-test-proximity',
        categoryId: 'water_pipeline_leak',
        latitude: 18.5079,
        longitude: 73.8082,
      };

      const linked = recurrenceService.linkIssuesToAssets([nearbyIssue])[0];
      expect(linked.assetId).toBe('AST-WS-118');
      expect(linked.isInferredAsset).toBe(true);
      expect(linked.proximityMeters).toBeLessThan(50);
    });

    it('creates deterministic inferred asset key for repeated unlinked spatial clusters', () => {
      const unlinkedIssue = SYNTHETIC_RECURRING_ISSUES.find((it) => it.id === 'iss-rec-011');
      const linked = recurrenceService.linkIssuesToAssets([unlinkedIssue])[0];

      expect(linked.assetId).toContain('INF-DRAINAGE_OVERFLOW');
      expect(linked.isInferredAsset).toBe(true);
      expect(linked.assetType).toBe(ASSET_TYPES.DRAINAGE_CULVERT);
    });
  });

  describe('2. Repeated Failure Detection across Asset, Location & Time', () => {
    it('detects repeated failures and computes MTBF and timeline', async () => {
      const result = await recurrenceService.getMaintenanceReviewCandidates({
        minFailures: 2,
        observationWindowDays: 90,
        referenceDate,
      });

      expect(result.success).toBe(true);
      expect(result.candidates.length).toBeGreaterThanOrEqual(3);

      // Check Road Candidate (AST-RD-104)
      const roadCandidate = result.candidates.find((c) => c.assetId === 'AST-RD-104');
      expect(roadCandidate).toBeDefined();
      expect(roadCandidate.failureCount).toBe(4);
      expect(roadCandidate.failureTimeline.length).toBe(4);
      expect(roadCandidate.meanTimeBetweenFailuresDays).toBeGreaterThan(0);
      expect(roadCandidate.meanTimeBetweenFailuresDays).toBeLessThan(30);

      // Check Electrical Candidate (AST-EL-402)
      const electricCandidate = result.candidates.find((c) => c.assetId === 'AST-EL-402');
      expect(electricCandidate).toBeDefined();
      expect(electricCandidate.failureCount).toBe(3);

      // Isolated issue (iss-rec-014) must be excluded
      const allCandidateIssueIds = result.candidates
        .flatMap((c) => c.failureTimeline)
        .map((it) => it.issueId);
      expect(allCandidateIssueIds).not.toContain('iss-rec-014');
    });
  });

  describe('3. Maintenance-Review Candidate Generation & Urgency Scoring', () => {
    it('generates URGENT_MAINTENANCE recommendation for high-frequency road failures', async () => {
      const result = await recurrenceService.getMaintenanceReviewCandidates({ referenceDate });
      const roadCandidate = result.candidates.find((c) => c.assetId === 'AST-RD-104');

      expect(roadCandidate.urgency).toBe(MAINTENANCE_URGENCY.URGENT_MAINTENANCE);
      expect(roadCandidate.recurrenceScore).toBeGreaterThanOrEqual(70);
      expect(roadCandidate.recommendation).toContain('Subsurface structural investigation recommended');
    });

    it('generates domain-specific recommendation for electrical transformer repeated failures', async () => {
      const result = await recurrenceService.getMaintenanceReviewCandidates({ referenceDate });
      const electricCandidate = result.candidates.find((c) => c.assetId === 'AST-EL-402');

      expect(electricCandidate.urgency).toBe(MAINTENANCE_URGENCY.URGENT_MAINTENANCE);
      expect(electricCandidate.recommendation).toContain('Transformer load audit');
    });

    it('generates domain-specific recommendation for water network valve recurrence', async () => {
      const result = await recurrenceService.getMaintenanceReviewCandidates({ referenceDate });
      const waterCandidate = result.candidates.find((c) => c.assetId === 'AST-WS-118');

      expect(waterCandidate.urgency).toBe(MAINTENANCE_URGENCY.SCHEDULED_REVIEW);
      expect(waterCandidate.recommendation).toContain('Pipe segment replacement');
    });
  });

  describe('4. Mandatory Non-Causal Analytical Labeling', () => {
    it('labels recurrence candidates as analytical observations, not causal proof', async () => {
      const result = await recurrenceService.getMaintenanceReviewCandidates({ referenceDate });

      expect(result.isAnalyticalObservation).toBe(true);
      expect(result.causalityProof).toBe(false);
      expect(result.disclaimer).toBe(RECURRENCE_DISCLAIMER);

      for (const candidate of result.candidates) {
        expect(candidate.isAnalyticalObservation).toBe(true);
        expect(candidate.causalityProof).toBe(false);
        expect(candidate.disclaimer).toBe(RECURRENCE_DISCLAIMER);
      }
    });
  });

  describe('5. REST API Endpoints Integration', () => {
    const app = express();
    app.use(express.json());
    app.use('/analytics', recurrenceRouter);

    it('GET /analytics/recurrence/candidates returns 200 with candidates and summary', async () => {
      const res = await request(app).get('/analytics/recurrence/candidates');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.candidates).toBeInstanceOf(Array);
      expect(res.body.candidates.length).toBeGreaterThanOrEqual(3);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.urgentMaintenanceCount).toBeGreaterThanOrEqual(2);
      expect(res.body.disclaimer).toBe(RECURRENCE_DISCLAIMER);
    });

    it('GET /analytics/recurrence/candidates filters by assetType and urgency', async () => {
      const res = await request(app)
        .get('/analytics/recurrence/candidates')
        .query({ assetType: 'ROAD_SEGMENT', urgency: 'URGENT_MAINTENANCE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.candidates.length).toBe(1);
      expect(res.body.candidates[0].assetId).toBe('AST-RD-104');
    });

    it('GET /analytics/recurrence/assets/:assetId returns asset recurrence timeline', async () => {
      const res = await request(app).get('/analytics/recurrence/assets/AST-RD-104');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.assetId).toBe('AST-RD-104');
      expect(res.body.asset.failureTimeline.length).toBe(4);

      const notFoundRes = await request(app).get('/analytics/recurrence/assets/UNKNOWN-ASSET');
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.success).toBe(false);
    });

    it('GET /analytics/recurrence/summary returns recurrence breakdown and KPIs', async () => {
      const res = await request(app).get('/analytics/recurrence/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalCandidates).toBeGreaterThanOrEqual(3);
      expect(res.body.summary.totalLinkedFailures).toBeGreaterThanOrEqual(10);
      expect(res.body.disclaimer).toBe(RECURRENCE_DISCLAIMER);
    });
  });
});
