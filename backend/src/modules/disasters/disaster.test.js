/**
 * Phase 61 Exit Checks: Disaster Event Model Tests
 *
 * Validates:
 * 1. Disaster event model (types, severity, affected polygons, lifecycle state, provenance)
 * 2. Official alert references (SACHET, CWC, IMD, DDMA) and cryptographic provenance
 * 3. Official-vs-user signal distinction, metrics, and corroboration scoring
 * 4. Concurrent disaster operations (multiple simultaneous disasters across jurisdictions)
 * 5. Geospatial point-in-polygon spatial detection for citizen GPS coordinates
 * 6. Dynamic polygon updates and lifecycle state transition audit history
 * 7. REST API endpoints for disaster management, spatial queries, and signal ingestion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  disasterService,
  DISASTER_TYPES,
  DISASTER_SEVERITY,
  DISASTER_LIFECYCLE_STATE,
  SIGNAL_SOURCE_TYPE,
  OFFICIAL_ALERT_AUTHORITIES,
  DISASTER_STATUTORY_DISCLAIMER,
} from './index.js';

describe('Phase 61: Disaster Event Model', () => {
  beforeEach(() => {
    disasterService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Disaster Entity Modeling & Spatial Validation
  // ─────────────────────────────────────────────────────────────
  describe('1. Disaster Entity Modeling & Spatial Validation', () => {
    it('initializes with seeded baseline concurrent disasters in Pune and PCMC', async () => {
      const disasters = await disasterService.listDisasters();
      expect(disasters.length).toBeGreaterThanOrEqual(3);

      const flood = disasters.find((d) => d.id === 'dis-pune-mutha-flood-2026');
      expect(flood).toBeDefined();
      expect(flood.disasterType).toBe(DISASTER_TYPES.URBAN_FLOODING_WATERLOGGING);
      expect(flood.severity).toBe(DISASTER_SEVERITY.SEVERE_EMERGENCY);
      expect(flood.lifecycleState).toBe(DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE);
      expect(flood.boundingBox).toBeDefined();
      expect(flood.centroid).toBeDefined();
      expect(flood.centroid.latitude).toBeCloseTo(18.50, 1);
      expect(flood.centroid.longitude).toBeCloseTo(73.83, 1);
    });

    it('creates a new disaster event with valid polygon and computes provenance', async () => {
      const disaster = await disasterService.createDisaster({
        title: 'Mula River Severe Spate at Bund Garden',
        description: 'Rising water levels threatening low-lying Yerawada riverbank.',
        disasterType: DISASTER_TYPES.RIVER_FLOOD,
        severity: DISASTER_SEVERITY.WARNING,
        jurisdictionIds: ['mh-pune-pmc'],
        affectedWards: ['Ward 2 - Yerawada', 'Ward 7 - Pune Station'],
        affectedPolygon: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8800, 18.5300],
              [73.9100, 18.5300],
              [73.9100, 18.5550],
              [73.8800, 18.5550],
              [73.8800, 18.5300],
            ],
          ],
        },
      });

      expect(disaster.id).toBeDefined();
      expect(disaster.disasterNumber).toMatch(/^DIS-\d{4}-\d{4}$/);
      expect(disaster.disasterType).toBe(DISASTER_TYPES.RIVER_FLOOD);
      expect(disaster.lifecycleState).toBe(DISASTER_LIFECYCLE_STATE.DETECTED);
      expect(disaster.boundingBox.minLongitude).toBe(73.88);
      expect(disaster.boundingBox.maxLongitude).toBe(73.91);
      expect(disaster.centroid.longitude).toBeCloseTo(73.895, 2);
      expect(disaster.provenance.provenanceHash).toBeDefined();
      expect(disaster.provenance.statutoryNotice).toBe(DISASTER_STATUTORY_DISCLAIMER);
    });

    it('rejects disaster creation with invalid or unclosed polygon geometry', async () => {
      await expect(
        disasterService.createDisaster({
          title: 'Invalid Polygon Disaster',
          disasterType: DISASTER_TYPES.FLASH_FLOOD,
          severity: DISASTER_SEVERITY.WARNING,
          affectedPolygon: {
            type: 'Polygon',
            // Unclosed polygon: first != last
            coordinates: [
              [
                [73.8800, 18.5300],
                [73.9100, 18.5300],
                [73.9100, 18.5550],
                [73.8800, 18.5500],
              ],
            ],
          },
        })
      ).rejects.toThrow(/must be closed/);
    });

    it('rejects disaster creation with invalid disasterType or missing title', async () => {
      await expect(
        disasterService.createDisaster({
          title: 'Abc', // too short
          disasterType: DISASTER_TYPES.RIVER_FLOOD,
          severity: DISASTER_SEVERITY.WARNING,
        })
      ).rejects.toThrow(/at least 5 characters/);

      await expect(
        disasterService.createDisaster({
          title: 'Valid Disaster Title',
          disasterType: 'ALIEN_INVASION',
          severity: DISASTER_SEVERITY.WARNING,
        })
      ).rejects.toThrow(/Invalid disasterType/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Official Alert References & Provenance
  // ─────────────────────────────────────────────────────────────
  describe('2. Official Alert References & Provenance', () => {
    it('attaches statutory official alert reference and records official signal', async () => {
      const disaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');
      const initialAlertsCount = disaster.officialAlertReferences.length;

      const newAlertRef = await disasterService.attachOfficialAlertReference(disaster.id, {
        authority: OFFICIAL_ALERT_AUTHORITIES.IMD,
        externalAlertId: 'IMD-PUN-NOWCAST-2026-1030',
        alertHeadline: 'Extremely Heavy Rainfall (Red Alert) for Pune Ghats',
        issuedAt: '2026-10-30T06:00:00Z',
        sourceUrl: 'https://mausam.imd.gov.in/pune/bulletins/red-alert-1030',
      });

      expect(newAlertRef.referenceId).toBeDefined();
      expect(newAlertRef.sourceSignatureHash).toBeDefined();
      expect(disaster.officialAlertReferences.length).toBe(initialAlertsCount + 1);

      // Verify that an official government signal was automatically recorded
      const signals = await disasterService.getDisasterSignals(disaster.id, {
        isOfficialOnly: true,
      });
      const imdSignal = signals.find((s) => s.title.includes('Extremely Heavy Rainfall'));
      expect(imdSignal).toBeDefined();
      expect(imdSignal.isOfficialGovernmentSignal).toBe(true);
      expect(imdSignal.isUserReportedSignal).toBe(false);
      expect(imdSignal.confidenceWeight).toBe(1.0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Official vs User Signal Distinction
  // ─────────────────────────────────────────────────────────────
  describe('3. Official vs User Signal Distinction & Corroboration', () => {
    it('records citizen distress signals distinctly from official government alerts', async () => {
      const disaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');

      // 1. Citizen signal
      const citizenSignal = await disasterService.recordSignal(disaster.id, {
        sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
        title: 'Water Entering Ground Floor Apartments',
        description: 'River water has reached 3 feet in society parking near Pu La Deshpande park.',
        location: { latitude: 18.4950, longitude: 73.8320, address: 'Sinhagad Road' },
        sourceMetadata: { citizenUserId: 'user-citizen-992' },
      });

      expect(citizenSignal.signalId).toBeDefined();
      expect(citizenSignal.isOfficialGovernmentSignal).toBe(false);
      expect(citizenSignal.isUserReportedSignal).toBe(true);
      expect(citizenSignal.confidenceWeight).toBe(0.65);
      expect(citizenSignal.signalProvenanceHash).toBeDefined();

      // 2. IoT Sensor Signal
      const sensorSignal = await disasterService.recordSignal(disaster.id, {
        sourceType: SIGNAL_SOURCE_TYPE.IOT_SENSOR_SIGNAL,
        title: 'Baba Bhide Bridge River Stage Gauge Exceeded',
        description: 'Ultrasonic sensor telemetry: water level 542.4m AMSL (Danger mark: 541.0m)',
        location: { latitude: 18.5170, longitude: 73.8480 },
        sourceMetadata: { sensorId: 'SENSOR-MUTHA-GAUGE-04', metric: 'WATER_LEVEL_METERS' },
      });

      expect(sensorSignal.isOfficialGovernmentSignal).toBe(false);
      expect(sensorSignal.isUserReportedSignal).toBe(false);
      expect(sensorSignal.confidenceWeight).toBe(0.85);

      // 3. Check Signal Distinction in Summary
      expect(disaster.signalsSummary.officialSignalsCount).toBeGreaterThanOrEqual(1);
      expect(disaster.signalsSummary.userSignalsCount).toBeGreaterThanOrEqual(1);
      expect(disaster.signalsSummary.sensorSignalsCount).toBeGreaterThanOrEqual(1);
      expect(disaster.signalsSummary.corroborationScore).toBeGreaterThan(0.80);
    });

    it('filters signals by source type (official vs user vs sensor)', async () => {
      const disasterId = 'dis-pune-mutha-flood-2026';

      const allSignals = await disasterService.getDisasterSignals(disasterId);
      expect(allSignals.length).toBeGreaterThan(0);

      const officialSignals = await disasterService.getDisasterSignals(disasterId, {
        isOfficialOnly: true,
      });
      officialSignals.forEach((s) => {
        expect(s.isOfficialGovernmentSignal).toBe(true);
        expect(s.isUserReportedSignal).toBe(false);
      });

      const userSignals = await disasterService.getDisasterSignals(disasterId, {
        isUserOnly: true,
      });
      userSignals.forEach((s) => {
        expect(s.isUserReportedSignal).toBe(true);
        expect(s.isOfficialGovernmentSignal).toBe(false);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Concurrent Disasters Support
  // ─────────────────────────────────────────────────────────────
  describe('4. Concurrent Disasters Support', () => {
    it('finds all concurrently active disasters across jurisdictions', async () => {
      const concurrentReport = await disasterService.findConcurrentDisasters();

      expect(concurrentReport.isMultiDisasterActive).toBe(true);
      expect(concurrentReport.concurrentCount).toBeGreaterThanOrEqual(3);

      const types = concurrentReport.activeDisasters.map((d) => d.disasterType);
      expect(types).toContain(DISASTER_TYPES.URBAN_FLOODING_WATERLOGGING);
      expect(types).toContain(DISASTER_TYPES.LANDSLIDE_DEBRIS_FLOW);
      expect(types).toContain(DISASTER_TYPES.INDUSTRIAL_CHEMICAL_HAZMAT);

      expect(Array.isArray(concurrentReport.overlapMatrix)).toBe(true);
    });

    it('correctly reports when a closed disaster does not count as active concurrent', async () => {
      // Transition Katraj landslide to CLOSED_RESOLVED
      await disasterService.updateLifecycleState(
        'dis-pune-katraj-landslide-2026',
        DISASTER_LIFECYCLE_STATE.CLOSED_RESOLVED
      );

      const activeList = await disasterService.listDisasters({ isActive: true });
      const activeIds = activeList.map((d) => d.id);
      expect(activeIds).not.toContain('dis-pune-katraj-landslide-2026');
      expect(activeIds).toContain('dis-pune-mutha-flood-2026');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Point-in-Polygon Spatial Detection
  // ─────────────────────────────────────────────────────────────
  describe('5. Point-in-Polygon Spatial Detection', () => {
    it('detects when citizen GPS coordinate is inside Mutha River flood polygon', async () => {
      // Coordinate near Deccan riverside: [73.8450, 18.5150] is inside the polygon
      const result = await disasterService.findDisastersAtPoint(18.5150, 73.8450);

      expect(result.isInDisasterZone).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(1);
      const flood = result.disasters.find((d) => d.id === 'dis-pune-mutha-flood-2026');
      expect(flood).toBeDefined();
    });

    it('returns false when citizen is outside all disaster polygons', async () => {
      // Coordinate far north: [73.8500, 18.7500] (outside all seeded polygons)
      const result = await disasterService.findDisastersAtPoint(18.7500, 73.8500);

      expect(result.isInDisasterZone).toBe(false);
      expect(result.count).toBe(0);
      expect(result.disasters).toHaveLength(0);
    });

    it('detects multiple concurrent disasters if polygons overlap a point', async () => {
      // Create a second overlapping hazard polygon (e.g. Extreme Thunderstorm / Lightning)
      await disasterService.createDisaster({
        title: 'Severe Thunderstorm & High Velocity Gale Warning',
        disasterType: DISASTER_TYPES.SEVERE_THUNDERSTORM_LIGHTNING,
        severity: DISASTER_SEVERITY.WARNING,
        lifecycleState: DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE,
        affectedPolygon: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8000, 18.4700],
              [73.9000, 18.4700],
              [73.9000, 18.5600],
              [73.8000, 18.5600],
              [73.8000, 18.4700],
            ],
          ],
        },
      });

      // Point in Deccan: falls into BOTH Mutha Flood AND Thunderstorm!
      const result = await disasterService.findDisastersAtPoint(18.5150, 73.8450);

      expect(result.isInDisasterZone).toBe(true);
      expect(result.hasMultipleConcurrentDisastersAtLocation).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Lifecycle State & Polygon Dynamic Updates
  // ─────────────────────────────────────────────────────────────
  describe('6. Lifecycle State & Polygon Dynamic Updates', () => {
    it('transitions disaster lifecycle state and preserves audit history', async () => {
      const disaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');
      const initialHistoryLength = disaster.lifecycleHistory.length;

      const updated = await disasterService.updateLifecycleState(
        disaster.id,
        DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF,
        {
          actor: { id: 'coord-pune-01', role: 'DISASTER_COORDINATOR' },
          notes: 'Water levels dropping. Relief camps activated in Sinhagad Road schools.',
        }
      );

      expect(updated.lifecycleState).toBe(DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF);
      expect(updated.lifecycleHistory.length).toBe(initialHistoryLength + 1);

      const latestLog = updated.lifecycleHistory[updated.lifecycleHistory.length - 1];
      expect(latestLog.toState).toBe(DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF);
      expect(latestLog.actor.role).toBe('DISASTER_COORDINATOR');
      expect(latestLog.notes).toContain('Relief camps activated');
    });

    it('dynamically updates affected polygon boundary and recalculates bounding box', async () => {
      const disaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');

      const expandedPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [73.8100, 18.4700],
            [73.8700, 18.4700],
            [73.8700, 18.5500],
            [73.8100, 18.5500],
            [73.8100, 18.4700],
          ],
        ],
      };

      const updated = await disasterService.updateAffectedPolygon(
        disaster.id,
        expandedPolygon,
        'Downstream river swell expanding into Sangam bridge'
      );

      expect(updated.affectedPolygon).toEqual(expandedPolygon);
      expect(updated.boundingBox.minLongitude).toBe(73.81);
      expect(updated.polygonHistory.length).toBeGreaterThan(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. REST API Endpoints (/disasters)
  // ─────────────────────────────────────────────────────────────
  describe('7. REST API Endpoints (/disasters)', () => {
    it('GET /disasters returns list of disasters and statutory disclaimer', async () => {
      const res = await request(app).get('/disasters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(res.body.disasters)).toBe(true);
      expect(res.body.disclaimer).toContain('CivIQ Disaster Event Tracking');
    });

    it('GET /disasters/concurrent returns concurrent active disasters with overlap matrix', async () => {
      const res = await request(app).get('/disasters/concurrent');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isMultiDisasterActive).toBe(true);
      expect(res.body.concurrentCount).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(res.body.overlapMatrix)).toBe(true);
    });

    it('GET /disasters/at-point detects location inside flood zone', async () => {
      const res = await request(app)
        .get('/disasters/at-point')
        .query({ lat: 18.5150, lng: 73.8450 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isInDisasterZone).toBe(true);
      expect(res.body.disasters.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /disasters/:id returns disaster details or 404', async () => {
      const res = await request(app).get('/disasters/dis-pune-mutha-flood-2026');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.disaster.title).toContain('Khadakwasla Dam');

      const res404 = await request(app).get('/disasters/non-existent-disaster-id');
      expect(res404.status).toBe(404);
      expect(res404.body.success).toBe(false);
    });

    it('GET /disasters/:id/situation-report provides situational breakdown', async () => {
      const res = await request(app).get('/disasters/dis-pune-mutha-flood-2026/situation-report');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sitrep.disasterNumber).toBe('DIS-2026-0001');
      expect(res.body.sitrep.signalsBreakdown).toBeDefined();
      expect(res.body.sitrep.statutoryNotice).toBeDefined();
    });

    it('POST /disasters creates new disaster entity', async () => {
      const res = await request(app)
        .post('/disasters')
        .send({
          title: 'Hadapsar Substation Transformer Fire Plume',
          disasterType: DISASTER_TYPES.WILDFIRE_URBAN_CONFLAGRATION,
          severity: DISASTER_SEVERITY.WARNING,
          affectedPolygon: {
            type: 'Polygon',
            coordinates: [
              [
                [73.9200, 18.5000],
                [73.9400, 18.5000],
                [73.9400, 18.5200],
                [73.9200, 18.5200],
                [73.9200, 18.5000],
              ],
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.disaster.title).toBe('Hadapsar Substation Transformer Fire Plume');
      expect(res.body.disaster.disasterNumber).toBeDefined();
    });

    it('PATCH /disasters/:id/state updates lifecycle state', async () => {
      const res = await request(app)
        .patch('/disasters/dis-pune-katraj-landslide-2026/state')
        .send({
          state: DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF,
          notes: 'Debris cleared from main road carriage.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.disaster.lifecycleState).toBe(DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF);
    });

    it('POST /disasters/:id/signals records signals and updates summary', async () => {
      const res = await request(app)
        .post('/disasters/dis-pune-mutha-flood-2026/signals')
        .send({
          sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
          title: 'Citizen Flash Flooding Report',
          description: 'Basement flooded on Sinhagad Road.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.signal.isUserReportedSignal).toBe(true);
      expect(res.body.signal.signalProvenanceHash).toBeDefined();
    });
  });
});
