/**
 * Phase 50 Exit Checks: Geospatial Candidate & Asset Link Tests
 * Validates spatial distance calculations, nearest-asset candidate suggestions,
 * confirmed issue gating, multi-asset linking, link history audit trails,
 * and role-based authorization controls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { assetLinkRouter } from './asset-link.router.js';
import { assetLinkService } from './asset-link.service.js';
import { assetService } from '../assets/asset.service.js';
import {
  haversineDistanceMeters,
  computeAssetDistance,
  calculateCandidateConfidence,
  findNearestAssetCandidates,
} from './asset-link.spatial.js';
import { LINK_METHODS, LINK_STATUS, LINK_HISTORY_ACTIONS } from './asset-link.types.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findUnique: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Phase 50: Geospatial Candidate & Asset Link Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/assets-links', assetLinkRouter);

  beforeEach(() => {
    assetService.reset();
    assetLinkService.reset();
  });

  describe('1. Spatial Distance & Calculation Unit Tests', () => {
    it('haversineDistanceMeters computes accurate distance between GPS coordinates', () => {
      // Goodluck Chowk (18.5204, 73.8567) to FC Road section (18.5205, 73.8568)
      const distance = haversineDistanceMeters(18.5204, 73.8567, 18.5205, 73.8568);
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(25); // ~15 meters
    });

    it('haversineDistanceMeters returns Infinity for invalid coordinates', () => {
      expect(haversineDistanceMeters(null, 73.8567, 18.5205, 73.8568)).toBe(Infinity);
      expect(haversineDistanceMeters(18.5204, undefined, 18.5205, 73.8568)).toBe(Infinity);
    });

    it('computeAssetDistance handles LineString geometry segments correctly', () => {
      const roadAsset = {
        id: 'ast-line-1',
        latitude: null,
        longitude: null,
        geometryJson: {
          type: 'LineString',
          coordinates: [
            [73.8561, 18.5198],
            [73.8568, 18.5205],
            [73.8578, 18.5218],
          ],
        },
      };

      const pointNearMiddle = { latitude: 18.5205, longitude: 73.8568 };
      const dist = computeAssetDistance(pointNearMiddle, roadAsset);
      expect(dist).toBeLessThan(5); // Almost 0 meters away from middle node
    });

    it('calculateCandidateConfidence applies proximity decay and category affinity bonus', () => {
      const roadAsset = {
        id: 'ast-001',
        assetType: 'ROAD_SEGMENT',
        department: 'Roads & Public Works',
        lifecycleStatus: 'OPERATIONAL',
        conditionScore: 90,
      };

      // 1. Close distance (12m) + category affinity ('roads_pothole')
      const closeResult = calculateCandidateConfidence(12, roadAsset, {
        categoryId: 'roads_pothole',
        department: 'Roads & Public Works',
      });

      expect(closeResult.confidence).toBeGreaterThanOrEqual(0.95);
      expect(closeResult.matchReasons.some((r) => r.includes('High category affinity'))).toBe(true);

      // 2. Far distance (600m) without category affinity
      const farResult = calculateCandidateConfidence(600, roadAsset, {
        categoryId: 'sanitation_blocked_drain',
      });

      expect(farResult.confidence).toBeLessThan(0.40);
    });
  });

  describe('2. Geospatial Candidate Suggestions (Exit Checks)', () => {
    it('GET /assets-links/candidates/:issueId returns ranked nearest asset candidates', async () => {
      // iss-hs-001 is a verified pothole on FC Road (18.5204, 73.8567)
      const res = await request(app).get('/assets-links/candidates/iss-hs-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.issueId).toBe('iss-hs-001');
      expect(res.body.candidates.length).toBeGreaterThan(0);

      // Rank 1 should be the FC Road Carriageway (ast-001) due to proximity and exact category affinity
      const topCandidate = res.body.candidates[0];
      expect(topCandidate.rank).toBe(1);
      expect(topCandidate.assetId).toBe('ast-001');
      expect(topCandidate.assetType).toBe('ROAD_SEGMENT');
      expect(topCandidate.distanceMeters).toBeLessThan(50);
      expect(topCandidate.confidence).toBeGreaterThanOrEqual(0.9);
      expect(topCandidate.matchReasons.length).toBeGreaterThan(0);

      // Verify distant assets (like PCMC transformer ~15km away) are not returned
      const pcmcAsset = res.body.candidates.find((c) => c.assetId === 'ast-003');
      expect(pcmcAsset).toBeUndefined();
    });

    it('POST /assets-links/candidates-by-coords suggests candidates from arbitrary GPS location', async () => {
      const res = await request(app)
        .post('/assets-links/candidates-by-coords')
        .send({
          latitude: 18.5074,
          longitude: 73.8077,
          categoryId: 'roads_pothole',
          maxRadiusMeters: 300,
          limit: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.candidates.length).toBeLessThanOrEqual(3);

      // Top candidate in Kothrud should be the Paud Road Flyover (ast-002)
      expect(res.body.candidates[0].assetId).toBe('ast-002');
      expect(res.body.candidates[0].distanceMeters).toBeLessThan(10);
    });

    it('respects limit and maxRadiusMeters query parameters', async () => {
      const res = await request(app).get(
        '/assets-links/candidates/iss-hs-001?maxRadiusMeters=20&limit=1'
      );

      expect(res.status).toBe(200);
      expect(res.body.candidates.length).toBe(1);
      expect(res.body.candidates[0].distanceMeters).toBeLessThanOrEqual(20);
    });
  });

  describe('3. Confirmed Issue Gating & Validation', () => {
    it('rejects candidate suggestions or linking for an unconfirmed / rejected issue', async () => {
      // Register an unconfirmed issue
      assetLinkService.registerMockIssue({
        id: 'iss-rejected-01',
        title: 'Spam report',
        verificationStatus: 'REJECTED',
        latitude: 18.5204,
        longitude: 73.8567,
      });

      // 1. Candidate lookup rejected
      const candRes = await request(app).get('/assets-links/candidates/iss-rejected-01');
      expect(candRes.status).toBe(400);
      expect(candRes.body.error).toContain('Only confirmed/verified issues');

      // 2. Linking attempt rejected
      const linkRes = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-rejected-01',
          assetId: 'ast-001',
        });

      expect(linkRes.status).toBe(400);
      expect(linkRes.body.error).toContain('Only confirmed/verified issues');
    });

    it('returns 404 when querying candidates for a non-existent issue', async () => {
      const res = await request(app).get('/assets-links/candidates/iss-non-existent-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('4. Multi-Asset Linking & Querying', () => {
    it('links a confirmed issue to multiple infrastructure assets', async () => {
      const res = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetIds: ['ast-001', 'ast-005'], // Road segment and Box Culvert
          linkMethod: LINK_METHODS.GEOSPATIAL_SUGGESTION,
          notes: 'Pothole and drain blockage caused by road subsidence',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.links.length).toBe(2);

      const linkedAssetIds = res.body.links.map((l) => l.assetId);
      expect(linkedAssetIds).toContain('ast-001');
      expect(linkedAssetIds).toContain('ast-005');
      expect(res.body.links[0].status).toBe(LINK_STATUS.ACTIVE);
      expect(res.body.links[0].notes).toContain('Pothole and drain blockage');
    });

    it('retrieves all assets linked to an issue (GET /assets-links/issues/:issueId)', async () => {
      // First link ast-001 to iss-hs-001
      await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-001',
          confidence: 0.95,
        });

      const res = await request(app).get('/assets-links/issues/iss-hs-001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.links[0].assetId).toBe('ast-001');
      expect(res.body.links[0].asset.assetTag).toBe('AST-RD-104');
    });

    it('retrieves all issues linked to an asset (GET /assets-links/assets/:assetId)', async () => {
      // Link ast-001 to iss-hs-001 and iss-hs-002
      await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-001',
        });

      await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-002',
          assetId: 'ast-001',
        });

      const res = await request(app).get('/assets-links/assets/ast-001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.links.some((l) => l.issueId === 'iss-hs-001')).toBe(true);
      expect(res.body.links.some((l) => l.issueId === 'iss-hs-002')).toBe(true);
    });
  });

  describe('5. Link History Audit Trail & Unlinking', () => {
    it('maintains comprehensive audit history for link creation and updates', async () => {
      // 1. Create link
      await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-id', 'officer-pune-1')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-001',
          confidence: 0.85,
        });

      // 2. Update confidence
      await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-id', 'officer-pune-1')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-001',
          confidence: 0.98,
          notes: 'Field worker confirmed exact pole coordinates',
        });

      // 3. Query history
      const historyRes = await request(app).get('/assets-links/history/iss-hs-001');
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.total).toBe(2);

      // Latest action is CONFIDENCE_UPDATED
      expect(historyRes.body.history[0].action).toBe(LINK_HISTORY_ACTIONS.CONFIDENCE_UPDATED);
      expect(historyRes.body.history[0].previousConfidence).toBe(0.85);
      expect(historyRes.body.history[0].newConfidence).toBe(0.98);

      // Initial action is LINKED
      expect(historyRes.body.history[1].action).toBe(LINK_HISTORY_ACTIONS.LINKED);
    });

    it('unlinks an asset and appends UNLINKED event to history', async () => {
      const linkRes = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-004',
        });

      const linkId = linkRes.body.links[0].id;

      // Unlink
      const deleteRes = await request(app)
        .delete(`/assets-links/${linkId}`)
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({ reason: 'Incorrect asset matched; street is across intersection' });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify link is no longer active
      const activeRes = await request(app).get('/assets-links/issues/iss-hs-001');
      expect(activeRes.body.links.find((l) => l.id === linkId)).toBeUndefined();

      // Verify unlinked event is present in history
      const historyRes = await request(app).get('/assets-links/history/iss-hs-001');
      const unlinkedEvent = historyRes.body.history.find(
        (h) => h.action === LINK_HISTORY_ACTIONS.UNLINKED
      );
      expect(unlinkedEvent).toBeDefined();
      expect(unlinkedEvent.reason).toContain('Incorrect asset matched');
    });
  });

  describe('6. Authorization & Jurisdiction Scoping (AuthZ)', () => {
    it('returns 401 when attempting to link without authentication', async () => {
      const res = await request(app).post('/assets-links').send({
        issueId: 'iss-hs-001',
        assetId: 'ast-001',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('returns 403 when CITIZEN attempts to link an issue to an asset', async () => {
      const res = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'CITIZEN')
        .send({
          issueId: 'iss-hs-001',
          assetId: 'ast-001',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 when DEPARTMENT_OFFICER attempts cross-jurisdiction link', async () => {
      // ast-003 is located in PCMC (mh-pune-pcmc)
      // Officer belongs to Pune PMC (mh-pune-pmc)
      assetLinkService.registerMockIssue({
        id: 'iss-pcmc-01',
        verificationStatus: 'VERIFIED',
        jurisdictionId: 'mh-pune-pcmc',
        latitude: 18.6298,
        longitude: 73.7997,
      });

      const res = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc') // PMC officer
        .send({
          issueId: 'iss-pcmc-01',
          assetId: 'ast-003', // PCMC asset
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('jurisdiction mismatch');
    });

    it('allows PLATFORM_SUPER_ADMIN global linking across jurisdictions', async () => {
      assetLinkService.registerMockIssue({
        id: 'iss-pcmc-02',
        verificationStatus: 'VERIFIED',
        jurisdictionId: 'mh-pune-pcmc',
        latitude: 18.6298,
        longitude: 73.7997,
      });

      const res = await request(app)
        .post('/assets-links')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN')
        .send({
          issueId: 'iss-pcmc-02',
          assetId: 'ast-003',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
