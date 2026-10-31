/**
 * Phase 63 Exit Checks: Disaster Impact Reporting Tests
 *
 * Validates:
 * 1. Citizen & field worker impact report intake for all 6 disaster categories:
 *    - Flooding & waterlogging
 *    - Blocked roads & debris flow
 *    - Utility outages (power, water, gas)
 *    - Stranded persons & rescue needed
 *    - Structural infrastructure damage
 *    - Urgent relief supply needs
 * 2. Event binding & spatial point-in-polygon resolution
 * 3. Emergency fast-path initial UNVERIFIED status (ADR 0002)
 * 4. Life-safety critical handoff notice & 112 escalation
 * 5. Automatic corroborating user signal emission in DisasterService
 * 6. Aggregated situational impact summary metrics
 * 7. Field triage status lifecycle (UNVERIFIED -> FIELD_TRIAGED -> RESOLVED)
 * 8. REST API endpoints (/disaster-impact/reports, /disaster-impact/summary)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  disasterImpactService,
  IMPACT_TYPES,
  IMPACT_SEVERITY,
  IMPACT_STATUS,
  REPORTER_TYPE,
  DISASTER_IMPACT_DISCLAIMER,
} from './index.js';
import { disasterService } from '../disasters/index.js';

describe('Phase 63: Disaster Impact Reporting', () => {
  beforeEach(() => {
    disasterImpactService.reset();
    disasterService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Report Intake & Emergency Fast-Path
  // ─────────────────────────────────────────────────────────────
  describe('1. Report Intake & Emergency Fast-Path', () => {
    it('submits a citizen flooding report with mandatory initial UNVERIFIED status', async () => {
      const outcome = await disasterImpactService.submitImpactReport(
        {
          disasterId: 'dis-pune-mutha-flood-2026',
          impactType: IMPACT_TYPES.FLOODING_WATERLOGGING,
          title: 'Water Level Reached 1.2m on Sinhagad Road',
          description: 'Basement parking completely submerged. Water entering ground-floor lobby.',
          location: {
            latitude: 18.4900,
            longitude: 73.8320,
            address: 'Anand Nagar, Sinhagad Road',
            ward: 'Ward 9 - Sinhagad Road',
            jurisdictionId: 'mh-pune-pmc',
          },
          waterDepthMeters: 1.2,
          peopleAffectedEstimated: 40,
        },
        { id: 'usr-citizen-44', role: 'CITIZEN', phone: '+91-9822012345' }
      );

      expect(outcome.success).toBe(true);
      const report = outcome.report;

      expect(report.reportId).toMatch(/^DIR-\d{4}-\d{4}$/);
      expect(report.status).toBe(IMPACT_STATUS.UNVERIFIED); // Emergency fast-path requirement!
      expect(report.impactType).toBe(IMPACT_TYPES.FLOODING_WATERLOGGING);
      expect(report.disasterId).toBe('dis-pune-mutha-flood-2026');
      expect(report.location.ward).toBe('Ward 9 - Sinhagad Road');
      expect(report.reporter.role).toBe('CITIZEN');
      expect(report.reporter.phoneMasked).toBe('+91XXXX2345'); // Masked for privacy
      expect(report.impactDetails.waterDepthMeters).toBe(1.2);
      expect(report.triageHistory[0].toStatus).toBe(IMPACT_STATUS.UNVERIFIED);
    });

    it('automatically binds report to active disaster at GPS coordinates when disasterId is omitted', async () => {
      // Coordinate near Deccan Gymkhana (inside Mutha flood polygon)
      const outcome = await disasterImpactService.submitImpactReport({
        impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS,
        title: 'River Causeway Overflowing at Baba Bhide',
        location: {
          latitude: 18.5150,
          longitude: 73.8450,
        },
      });

      expect(outcome.success).toBe(true);
      expect(outcome.report.disasterId).toBe('dis-pune-mutha-flood-2026');
      expect(outcome.report.disasterTitle).toContain('Khadakwasla Dam');
    });

    it('rejects impact report submission with invalid impactType or missing coordinates', async () => {
      await expect(
        disasterImpactService.submitImpactReport({
          impactType: 'UNSUPPORTED_HAZARD',
          location: { latitude: 18.5, longitude: 73.8 },
        })
      ).rejects.toThrow(/Invalid impactType/);

      await expect(
        disasterImpactService.submitImpactReport({
          impactType: IMPACT_TYPES.FLOODING_WATERLOGGING,
          location: { latitude: 'invalid', longitude: 73.8 },
        })
      ).rejects.toThrow(/latitude and longitude numbers/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Life-Safety & Stranded Persons Emergency Handoff
  // ─────────────────────────────────────────────────────────────
  describe('2. Life-Safety & Emergency Handoff', () => {
    it('detects life-safety hazard and recommends immediate 112 emergency handoff', async () => {
      const outcome = await disasterImpactService.submitImpactReport({
        disasterId: 'dis-pune-mutha-flood-2026',
        impactType: IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED,
        title: 'Elderly Family Stranded in Rising Floodwaters',
        description: 'Water has breached 4 feet inside living room. 3 people trapped.',
        isLifeThreatening: true,
        strandedPersonsCount: 3,
        location: {
          latitude: 18.4890,
          longitude: 73.8300,
          address: 'Sinhagad Road Riverbank Colony',
        },
        reliefNeeds: ['BOAT_EVACUATION'],
      });

      expect(outcome.success).toBe(true);
      expect(outcome.report.severity).toBe(IMPACT_SEVERITY.CRITICAL_LIFE_SAFETY);
      expect(outcome.report.emergencyHandoff.handoffRecommended).toBe(true);
      expect(outcome.emergencyHandoffNotice).toContain('112');
      expect(outcome.report.impactDetails.strandedPersonsCount).toBe(3);
    });

    it('emits corroborating user signal into DisasterService when bound to disaster', async () => {
      const disaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');
      const initialUserSignals = disaster.signalsSummary.userSignalsCount;

      const outcome = await disasterImpactService.submitImpactReport({
        disasterId: disaster.id,
        impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS,
        title: 'Sinhagad Road Tree Fall and Causeway Blockage',
        location: { latitude: 18.4920, longitude: 73.8340 },
      });

      expect(outcome.report.corroboration.signalCreated).toBe(true);
      expect(outcome.report.corroboration.corroboratingSignalId).toMatch(/^SIG-/);

      // Verify DisasterService signals summary updated
      const updatedDisaster = await disasterService.getDisasterById(disaster.id);
      expect(updatedDisaster.signalsSummary.userSignalsCount).toBe(initialUserSignals + 1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Situational Summary & Rollup Metrics
  // ─────────────────────────────────────────────────────────────
  describe('3. Situational Summary & Rollup Metrics', () => {
    it('aggregates impact metrics for an active disaster incident', async () => {
      const summary = await disasterImpactService.getImpactSummary('dis-pune-mutha-flood-2026');

      expect(summary.disasterId).toBe('dis-pune-mutha-flood-2026');
      expect(summary.totalReports).toBeGreaterThanOrEqual(3);
      expect(summary.totalStrandedPersonsEstimated).toBeGreaterThanOrEqual(4);
      expect(summary.breakdownByType[IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED]).toBeGreaterThanOrEqual(1);
      expect(summary.breakdownByType[IMPACT_TYPES.BLOCKED_ROAD_DEBRIS]).toBeGreaterThanOrEqual(1);
      expect(summary.breakdownByType[IMPACT_TYPES.UTILITY_OUTAGE]).toBeGreaterThanOrEqual(1);
      expect(summary.breakdownByWard['Ward 9 - Sinhagad Road']).toBeGreaterThanOrEqual(1);
      expect(summary.statutoryNotice).toBe(DISASTER_IMPACT_DISCLAIMER);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Field Responder Triage Lifecycle
  // ─────────────────────────────────────────────────────────────
  describe('4. Field Responder Triage Lifecycle', () => {
    it('transitions impact report status from UNVERIFIED to FIELD_TRIAGED to RESOLVED', async () => {
      const report = await disasterImpactService.getReportById('DIR-2026-0001');
      expect(report.status).toBe(IMPACT_STATUS.UNVERIFIED);

      // 1. Triage by Field Responder
      const triaged = await disasterImpactService.triageReport(
        report.reportId,
        IMPACT_STATUS.FIELD_TRIAGED,
        {
          actor: { id: 'responder-ndrf-05', role: 'NDRF_TEAM_LEADER' },
          notes: 'Boat rescue team dispatched with life vests.',
        }
      );

      expect(triaged.status).toBe(IMPACT_STATUS.FIELD_TRIAGED);
      expect(triaged.triageHistory.length).toBeGreaterThan(1);
      const latestHistory = triaged.triageHistory[triaged.triageHistory.length - 1];
      expect(latestHistory.toStatus).toBe(IMPACT_STATUS.FIELD_TRIAGED);
      expect(latestHistory.notes).toContain('Boat rescue team dispatched');

      // 2. Mark Resolved
      const resolved = await disasterImpactService.triageReport(
        report.reportId,
        IMPACT_STATUS.RESOLVED,
        {
          actor: { id: 'responder-ndrf-05', role: 'NDRF_TEAM_LEADER' },
          notes: 'All 4 stranded residents evacuated safely to Sinhagad road relief center.',
        }
      );

      expect(resolved.status).toBe(IMPACT_STATUS.RESOLVED);
    });

    it('rejects triage with invalid status', async () => {
      await expect(
        disasterImpactService.triageReport('DIR-2026-0001', 'NOT_A_REAL_STATUS')
      ).rejects.toThrow(/Invalid status/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. REST API Endpoints (/disaster-impact)
  // ─────────────────────────────────────────────────────────────
  describe('5. REST API Endpoints (/disaster-impact)', () => {
    it('POST /disaster-impact/reports creates new impact report with 201 status', async () => {
      const res = await request(app)
        .post('/disaster-impact/reports')
        .send({
          disasterId: 'dis-pune-mutha-flood-2026',
          impactType: IMPACT_TYPES.STRUCTURAL_INFRASTRUCTURE_DAMAGE,
          title: 'Riverbank Retaining Wall Cracked Near Pulgate',
          location: {
            latitude: 18.5140,
            longitude: 73.8470,
            address: 'Pulgate Causeway East Embankment',
          },
          peopleAffectedEstimated: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report.status).toBe(IMPACT_STATUS.UNVERIFIED);
      expect(res.body.report.reportId).toBeDefined();
    });

    it('GET /disaster-impact/reports lists reports and supports query filtering', async () => {
      const resAll = await request(app).get('/disaster-impact/reports');
      expect(resAll.status).toBe(200);
      expect(resAll.body.success).toBe(true);
      expect(resAll.body.count).toBeGreaterThanOrEqual(4);

      const resFiltered = await request(app)
        .get('/disaster-impact/reports')
        .query({ impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS });

      expect(resFiltered.status).toBe(200);
      resFiltered.body.reports.forEach((r) => {
        expect(r.impactType).toBe(IMPACT_TYPES.BLOCKED_ROAD_DEBRIS);
      });
    });

    it('GET /disaster-impact/summary/:disasterId returns aggregated metrics', async () => {
      const res = await request(app).get('/disaster-impact/summary/dis-pune-mutha-flood-2026');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalReports).toBeGreaterThanOrEqual(3);
      expect(res.body.summary.breakdownByType).toBeDefined();
    });

    it('GET /disaster-impact/reports/:id retrieves single report or returns 404', async () => {
      const res = await request(app).get('/disaster-impact/reports/DIR-2026-0001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.reportId).toBe('DIR-2026-0001');

      const res404 = await request(app).get('/disaster-impact/reports/non-existent-report-id');
      expect(res404.status).toBe(404);
      expect(res404.body.success).toBe(false);
    });

    it('PATCH /disaster-impact/reports/:id/triage updates status', async () => {
      const res = await request(app)
        .patch('/disaster-impact/reports/DIR-2026-0003/triage')
        .send({
          status: IMPACT_STATUS.FIELD_TRIAGED,
          notes: 'NHAI JCB dispatched to clear boulder slide.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.status).toBe(IMPACT_STATUS.FIELD_TRIAGED);
    });
  });
});
