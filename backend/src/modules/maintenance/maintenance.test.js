/**
 * Phase 51 Exit Checks: Timeline & Access Tests
 * Validates maintenance action recording, parts/labor/contractor cost tracking,
 * financial field redaction & audit logging, asset timeline generation,
 * and role-based jurisdiction access controls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { maintenanceRouter } from './maintenance.router.js';
import { maintenanceService } from './maintenance.service.js';
import { assetService } from '../assets/asset.service.js';
import { assetLinkService } from '../assets-links/asset-link.service.js';
import {
  MAINTENANCE_ACTION_TYPES,
  MAINTENANCE_STATUS,
  MAINTENANCE_OUTCOMES,
  REDACTED_FINANCIAL_VALUE,
} from './maintenance.types.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Phase 51: Maintenance History, Timeline & Access Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/maintenance', maintenanceRouter);

  beforeEach(() => {
    assetService.reset();
    assetLinkService.reset();
    maintenanceService.reset();
  });

  describe('1. Maintenance Action Recording & Cost Tracking', () => {
    it('records a new maintenance action with parts, labor, contractor costs and downtime', async () => {
      const payload = {
        assetId: 'ast-001',
        actionType: MAINTENANCE_ACTION_TYPES.EMERGENCY_REPAIR,
        status: MAINTENANCE_STATUS.COMPLETED,
        outcome: MAINTENANCE_OUTCOMES.RESOLVED,
        description: 'Repaired edge subsidence and seal coat on FC Road north lane.',
        performedBy: 'PMC Rapid Response Asphalt Unit',
        downtimeHours: 5.0,
        conditionScoreBefore: 55,
        conditionScoreAfter: 85,
        partsCost: 24000,
        laborCost: 11000,
        contractorCost: 15000,
        workOrderNumber: 'WO-PMC-2026-901',
        financialYear: 'FY2026-27',
        notes: 'Bitumen emulsion tack coat applied.',
      };

      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.action.id).toBeDefined();
      expect(res.body.action.assetId).toBe('ast-001');
      expect(res.body.action.totalCost).toBe(50000); // 24000 + 11000 + 15000
      expect(res.body.action.downtimeHours).toBe(5.0);
      expect(res.body.action.conditionScoreAfter).toBe(85);

      // Verify asset condition score was automatically updated in assetService
      const asset = await assetService.getAssetById('ast-001');
      expect(asset.conditionScore).toBe(85);
      expect(asset.lifecycleStatus).toBe('OPERATIONAL');
    });

    it('rejects recording when required assetId is missing', async () => {
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          actionType: MAINTENANCE_ACTION_TYPES.INSPECTION,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('assetId');
    });

    it('rejects recording with invalid actionType or outcome', async () => {
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          assetId: 'ast-001',
          actionType: 'FLYING_CARPET_REPAIR',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid actionType');
    });
  });

  describe('2. Controlled & Auditable Financial Fields (Access Tests)', () => {
    it('redacts financial cost breakdown when CITIZEN queries maintenance actions', async () => {
      const res = await request(app)
        .get('/maintenance/actions/mnt-001')
        .set('x-user-role', 'CITIZEN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.action.description).toBeDefined();
      expect(res.body.action.downtimeHours).toBe(6.5);

      // Financial fields MUST be redacted for citizens
      expect(res.body.action.partsCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(res.body.action.laborCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(res.body.action.totalCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(res.body.action.workOrderNumber).toBe(REDACTED_FINANCIAL_VALUE);
      expect(res.body.action.isFinancialDataRedacted).toBe(true);
    });

    it('exposes full financial cost details to authorized DEPARTMENT_OFFICER and AUDITOR', async () => {
      const res = await request(app)
        .get('/maintenance/actions/mnt-001')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc');

      expect(res.status).toBe(200);
      expect(res.body.action.totalCost).toBe(70000);
      expect(res.body.action.partsCost).toBe(35000);
      expect(res.body.action.laborCost).toBe(15000);
      expect(res.body.action.contractorCost).toBe(20000);
      expect(res.body.action.workOrderNumber).toBe('WO-PMC-2026-0812');
      expect(res.body.action.isFinancialDataRedacted).toBeUndefined();
    });

    it('creates an immutable audit record when financial fields are updated', async () => {
      const res = await request(app)
        .patch('/maintenance/actions/mnt-001')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-id', 'officer-audit-01')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          contractorCost: 28000, // increased from 20000 to 28000
          auditReason: 'Contractor overtime approved for monsoon emergency works',
        });

      expect(res.status).toBe(200);
      expect(res.body.action.contractorCost).toBe(28000);
      expect(res.body.action.totalCost).toBe(78000); // 35000 + 15000 + 28000

      // Inspect financial audit logs as AUDITOR
      const auditRes = await request(app)
        .get('/maintenance/financial-audits?maintenanceId=mnt-001')
        .set('x-user-role', 'AUDITOR');

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.total).toBeGreaterThanOrEqual(1);

      const latestAudit = auditRes.body.audits[0];
      expect(latestAudit.maintenanceId).toBe('mnt-001');
      expect(latestAudit.field).toBe('contractorCost');
      expect(latestAudit.previousValue).toBe(20000);
      expect(latestAudit.newValue).toBe(28000);
      expect(latestAudit.actorId).toBe('officer-audit-01');
      expect(latestAudit.reason).toContain('Contractor overtime');
    });

    it('rejects non-auditor roles from querying financial audit logs', async () => {
      const res = await request(app)
        .get('/maintenance/financial-audits')
        .set('x-user-role', 'CITIZEN');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('3. Asset Timeline Generation (Timeline Tests)', () => {
    it('GET /maintenance/timeline/:assetId generates chronological timeline of installation and maintenance events', async () => {
      // Link an issue to ast-001 to verify issue event inclusion
      await assetLinkService.linkIssueToAssets({
        issueId: 'iss-hs-001',
        assetId: 'ast-001',
        notes: 'Crater pothole linked to road carriageway',
      });

      const res = await request(app)
        .get('/maintenance/timeline/ast-001')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assetId).toBe('ast-001');
      expect(res.body.assetTag).toBe('AST-RD-104');
      expect(res.body.metrics.totalMaintenanceActions).toBeGreaterThanOrEqual(2);
      expect(res.body.metrics.totalDowntimeHours).toBeGreaterThanOrEqual(6.5);
      expect(res.body.metrics.totalExpenditure).toBeGreaterThan(0);

      // Verify timeline events
      const timeline = res.body.timeline;
      expect(timeline.length).toBeGreaterThanOrEqual(3);

      // Events should be sorted newest first
      const timestamps = timeline.map((t) => new Date(t.timestamp).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }

      // Check for installation baseline event
      const installEvent = timeline.find((e) => e.eventType === 'ASSET_INSTALLATION');
      expect(installEvent).toBeDefined();

      // Check for maintenance event
      const maintEvent = timeline.find((e) => e.eventType === 'MAINTENANCE_ACTION');
      expect(maintEvent).toBeDefined();
      expect(maintEvent.downtimeHours).toBeDefined();

      // Check for linked civic issue event
      const issueEvent = timeline.find((e) => e.eventType === 'CIVIC_ISSUE_LINKED');
      expect(issueEvent).toBeDefined();
    });

    it('redacts financial expenditure on timeline when accessed by CITIZEN', async () => {
      const res = await request(app)
        .get('/maintenance/timeline/ast-001')
        .set('x-user-role', 'CITIZEN');

      expect(res.status).toBe(200);
      expect(res.body.metrics.isFinancialDataRedacted).toBe(true);
      expect(res.body.metrics.totalExpenditure).toBe(REDACTED_FINANCIAL_VALUE);

      const maintEvent = res.body.timeline.find((e) => e.eventType === 'MAINTENANCE_ACTION');
      expect(maintEvent.financialCost).toBe(REDACTED_FINANCIAL_VALUE);
      expect(maintEvent.workOrderNumber).toBe(REDACTED_FINANCIAL_VALUE);
    });

    it('returns 404 when querying timeline for non-existent asset', async () => {
      const res = await request(app).get('/maintenance/timeline/ast-unknown-404');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('4. Authorization & Jurisdiction Scoping (Access Tests)', () => {
    it('returns 401 when creating maintenance action without authentication', async () => {
      const res = await request(app).post('/maintenance/actions').send({
        assetId: 'ast-001',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('returns 403 when CITIZEN attempts to record maintenance action', async () => {
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'CITIZEN')
        .send({
          assetId: 'ast-001',
          actionType: MAINTENANCE_ACTION_TYPES.INSPECTION,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 when FIELD_WORKER attempts to record maintenance action', async () => {
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'FIELD_WORKER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          assetId: 'ast-001',
          actionType: MAINTENANCE_ACTION_TYPES.INSPECTION,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 when DEPARTMENT_OFFICER attempts cross-jurisdiction maintenance recording', async () => {
      // ast-003 belongs to PCMC (mh-pune-pcmc)
      // Officer belongs to Pune PMC (mh-pune-pmc)
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          assetId: 'ast-003', // PCMC transformer
          actionType: MAINTENANCE_ACTION_TYPES.INSPECTION,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('jurisdiction mismatch');
    });

    it('allows PLATFORM_SUPER_ADMIN global maintenance recording across any jurisdiction', async () => {
      const res = await request(app)
        .post('/maintenance/actions')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN')
        .send({
          assetId: 'ast-003', // PCMC transformer
          actionType: MAINTENANCE_ACTION_TYPES.PREVENTIVE_MAINTENANCE,
          status: MAINTENANCE_STATUS.COMPLETED,
          outcome: MAINTENANCE_OUTCOMES.RESOLVED,
          partsCost: 5000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.action.assetId).toBe('ast-003');
    });
  });
});
