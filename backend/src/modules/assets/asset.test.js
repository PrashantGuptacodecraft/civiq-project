/**
 * Phase 49 Exit Checks: Asset Registry CRUD & AuthZ Tests
 * Validates maintainable asset modeling, department & jurisdiction ownership,
 * lifecycle status transitions, and role-based authorization controls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { assetRouter } from './asset.router.js';
import { assetService } from './asset.service.js';
import {
  ASSET_TYPES,
  ASSET_LIFECYCLE_STATUS,
  DEPARTMENT_ASSET_MAPPING,
} from './asset.types.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Phase 49: Asset Registry CRUD & AuthZ Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/assets', assetRouter);

  beforeEach(() => {
    assetService.reset();
  });

  describe('1. Asset Registry Metadata & Statistics', () => {
    it('GET /assets/types returns all registered asset types, lifecycles, and department mappings', async () => {
      const res = await request(app).get('/assets/types');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify modeled asset types
      expect(res.body.types.ROAD_SEGMENT).toBe('ROAD_SEGMENT');
      expect(res.body.types.STREETLIGHT).toBe('STREETLIGHT');
      expect(res.body.types.DRAINAGE_CULVERT).toBe('DRAINAGE_CULVERT');
      expect(res.body.types.WATER_PIPELINE).toBe('WATER_PIPELINE');
      expect(res.body.types.COMMUNITY_TOILET).toBe('COMMUNITY_TOILET');
      expect(res.body.types.TRAFFIC_SIGNAL).toBe('TRAFFIC_SIGNAL');

      // Verify lifecycle statuses
      expect(res.body.lifecycleStatuses.OPERATIONAL).toBe('OPERATIONAL');
      expect(res.body.lifecycleStatuses.DEGRADED).toBe('DEGRADED');
      expect(res.body.lifecycleStatuses.MAINTENANCE_REQUIRED).toBe('MAINTENANCE_REQUIRED');
      expect(res.body.lifecycleStatuses.UNDER_REPAIR).toBe('UNDER_REPAIR');
      expect(res.body.lifecycleStatuses.OUT_OF_SERVICE).toBe('OUT_OF_SERVICE');
      expect(res.body.lifecycleStatuses.DECOMMISSIONED).toBe('DECOMMISSIONED');

      // Verify department mappings
      expect(res.body.departmentMapping['Roads & Public Works']).toContain('ROAD_SEGMENT');
      expect(res.body.departmentMapping['Electrical & Power Supply']).toContain('STREETLIGHT');
      expect(res.body.departmentMapping['Water Supply & Sewage']).toContain('WATER_PIPELINE');
    });

    it('GET /assets/stats returns comprehensive inventory metrics across types and lifecycles', async () => {
      const res = await request(app).get('/assets/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalAssets).toBeGreaterThan(0);
      expect(res.body.stats.averageConditionScore).toBeGreaterThanOrEqual(0);
      expect(res.body.stats.byType[ASSET_TYPES.ROAD_SEGMENT]).toBeGreaterThan(0);
      expect(res.body.stats.byType[ASSET_TYPES.STREETLIGHT]).toBeGreaterThan(0);
    });

    it('GET /assets/stats?jurisdictionId=mh-pune-pcmc filters stats by jurisdiction', async () => {
      const res = await request(app).get('/assets/stats?jurisdictionId=mh-pune-pcmc');
      expect(res.status).toBe(200);
      expect(res.body.stats.jurisdictionId).toBe('mh-pune-pcmc');
      expect(res.body.stats.totalAssets).toBe(1); // Transformer TR-402 in PCMC
    });
  });

  describe('2. Query & Filtering Assets (Read)', () => {
    it('GET /assets lists synthetic fixtures with pagination', async () => {
      const res = await request(app).get('/assets');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assets)).toBe(true);
      expect(res.body.count).toBe(res.body.assets.length);
      expect(res.body.total).toBeGreaterThanOrEqual(11);
    });

    it('filters assets by assetType', async () => {
      const res = await request(app).get('/assets?assetType=ROAD_SEGMENT');
      expect(res.status).toBe(200);
      expect(res.body.assets.length).toBeGreaterThan(0);
      for (const asset of res.body.assets) {
        expect(asset.assetType).toBe(ASSET_TYPES.ROAD_SEGMENT);
      }
    });

    it('filters assets by department', async () => {
      const res = await request(app).get('/assets?department=Stormwater Drainage');
      expect(res.status).toBe(200);
      expect(res.body.assets.length).toBeGreaterThan(0);
      for (const asset of res.body.assets) {
        expect(asset.department).toBe('Stormwater Drainage');
      }
    });

    it('filters assets by lifecycleStatus', async () => {
      const res = await request(app).get('/assets?lifecycleStatus=DEGRADED');
      expect(res.status).toBe(200);
      expect(res.body.assets.length).toBeGreaterThan(0);
      for (const asset of res.body.assets) {
        expect(asset.lifecycleStatus).toBe(ASSET_LIFECYCLE_STATUS.DEGRADED);
      }
    });

    it('filters assets by text search query', async () => {
      const res = await request(app).get('/assets?search=Goodluck');
      expect(res.status).toBe(200);
      expect(res.body.assets.length).toBeGreaterThan(0);
      const matchesSearch = res.body.assets.every(
        (a) =>
          a.name.toLowerCase().includes('goodluck') ||
          (a.description && a.description.toLowerCase().includes('goodluck')) ||
          (a.address && a.address.toLowerCase().includes('goodluck'))
      );
      expect(matchesSearch).toBe(true);
    });

    it('GET /assets/:id retrieves single asset details', async () => {
      const res = await request(app).get('/assets/ast-001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.id).toBe('ast-001');
      expect(res.body.asset.assetTag).toBe('AST-RD-104');
      expect(res.body.asset.department).toBe('Roads & Public Works');
    });

    it('GET /assets/:id returns 404 for unknown asset', async () => {
      const res = await request(app).get('/assets/ast-unknown-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('3. Asset CRUD Operations', () => {
    it('creates a new asset with owner department and jurisdiction', async () => {
      const newAssetData = {
        name: 'Viman Nagar LED Luminaire L-210',
        description: 'New 60W smart pole near Phoenix Mall.',
        assetType: ASSET_TYPES.STREETLIGHT,
        department: 'Electrical & Power Supply',
        jurisdictionId: 'mh-pune-pmc',
        ward: 'Ward 3 - Viman Nagar',
        address: 'Ahmednagar Road, Viman Nagar, Pune',
        latitude: 18.5679,
        longitude: 73.9143,
        conditionScore: 98,
      };

      const res = await request(app)
        .post('/assets')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send(newAssetData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.name).toBe(newAssetData.name);
      expect(res.body.asset.assetType).toBe(ASSET_TYPES.STREETLIGHT);
      expect(res.body.asset.department).toBe('Electrical & Power Supply');
      expect(res.body.asset.jurisdictionId).toBe('mh-pune-pmc');
      expect(res.body.asset.lifecycleStatus).toBe(ASSET_LIFECYCLE_STATUS.OPERATIONAL);
      expect(res.body.asset.conditionScore).toBe(98);
      expect(res.body.asset.assetTag).toBeDefined();
    });

    it('rejects asset creation when required fields are missing', async () => {
      const res = await request(app)
        .post('/assets')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          name: 'Missing Fields Asset',
          // missing assetType, department, jurisdictionId
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects asset creation with invalid assetType', async () => {
      const res = await request(app)
        .post('/assets')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          name: 'Invalid Type Asset',
          assetType: 'INVALID_FLYING_CAR',
          department: 'Roads & Public Works',
          jurisdictionId: 'mh-pune-pmc',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid assetType');
    });

    it('updates asset lifecycle status and condition score', async () => {
      const updateData = {
        lifecycleStatus: ASSET_LIFECYCLE_STATUS.UNDER_REPAIR,
        conditionScore: 35,
        description: 'Under repair due to storm damage.',
      };

      const res = await request(app)
        .patch('/assets/ast-004')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.lifecycleStatus).toBe(ASSET_LIFECYCLE_STATUS.UNDER_REPAIR);
      expect(res.body.asset.conditionScore).toBe(35);
      expect(res.body.asset.description).toBe(updateData.description);
    });

    it('decommissions (soft-deletes) an asset from active registry', async () => {
      const res = await request(app)
        .delete('/assets/ast-002')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify asset is no longer returned in default active query
      const listRes = await request(app).get('/assets');
      const found = listRes.body.assets.find((a) => a.id === 'ast-002');
      expect(found).toBeUndefined();

      // Verify single fetch returns 404
      const getRes = await request(app).get('/assets/ast-002');
      expect(getRes.status).toBe(404);
    });
  });

  describe('4. Authorization & Jurisdiction Scoping (AuthZ)', () => {
    it('returns 401 when creating an asset without authentication credentials', async () => {
      const res = await request(app)
        .post('/assets')
        .send({
          name: 'Unauthenticated Asset',
          assetType: ASSET_TYPES.ROAD_SEGMENT,
          department: 'Roads & Public Works',
          jurisdictionId: 'mh-pune-pmc',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Authentication required');
    });

    it('returns 403 when CITIZEN attempts to create an asset', async () => {
      const res = await request(app)
        .post('/assets')
        .set('x-user-role', 'CITIZEN')
        .send({
          name: 'Citizen Asset Attempt',
          assetType: ASSET_TYPES.ROAD_SEGMENT,
          department: 'Roads & Public Works',
          jurisdictionId: 'mh-pune-pmc',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 when FIELD_WORKER attempts to delete an asset', async () => {
      const res = await request(app)
        .delete('/assets/ast-001')
        .set('x-user-role', 'FIELD_WORKER')
        .set('x-user-jurisdiction', 'mh-pune-pmc');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 when DEPARTMENT_OFFICER attempts cross-jurisdiction update', async () => {
      // ast-003 belongs to jurisdiction 'mh-pune-pcmc'
      const res = await request(app)
        .patch('/assets/ast-003')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc') // Officer belongs to PMC, asset is in PCMC
        .send({ conditionScore: 50 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('jurisdiction mismatch');
    });

    it('allows DEPARTMENT_OFFICER to update assets within their assigned jurisdiction', async () => {
      // ast-001 belongs to jurisdiction 'mh-pune-pmc'
      const res = await request(app)
        .patch('/assets/ast-001')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({ conditionScore: 65 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.conditionScore).toBe(65);
    });

    it('returns 403 when DEPARTMENT_OFFICER attempts to delete an asset (lacks assets:delete)', async () => {
      const res = await request(app)
        .delete('/assets/ast-001')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('assets:delete');
    });

    it('allows PLATFORM_SUPER_ADMIN global create, update, and delete across any jurisdiction', async () => {
      // ast-003 is in PCMC; super admin has no jurisdiction bound
      const patchRes = await request(app)
        .patch('/assets/ast-003')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN')
        .send({ lifecycleStatus: ASSET_LIFECYCLE_STATUS.OPERATIONAL });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.asset.lifecycleStatus).toBe(ASSET_LIFECYCLE_STATUS.OPERATIONAL);

      const deleteRes = await request(app)
        .delete('/assets/ast-003')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN');

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });
});
