/**
 * Phase 55 Exit Checks: Critical Incident & Accident Model Tests
 * Validates distinct incident entity creation, location/time/hazard/evidence capture,
 * sensitive data and PII protection, lifecycle status management, and REST API endpoints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  incidentService,
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_HAZARDS,
  VEHICLE_TYPES,
  REDACTED_CONTACT_MASK,
  REDACTED_PII_VALUE,
  REDACTED_GRAPHIC_MEDIA,
} from './index.js';

describe('Phase 55: Critical Accident/Incident Reporting Model', () => {
  beforeEach(() => {
    incidentService.reset();
  });

  describe('1. Incident Entity Creation & Validation', () => {
    it('creates a critical incident with location, time, evidence, hazards, and casualties', async () => {
      const pastTime = new Date(Date.now() - 1800000).toISOString(); // 30 minutes ago
      const payload = {
        title: 'Collision between car and delivery van at Goodluck Chowk',
        description: 'Head-on impact at junction. Van coolant leak and moderate traffic obstruction.',
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        severity: INCIDENT_SEVERITY.HIGH,
        occurredAt: pastTime,
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          accuracyMeters: 4.2,
          address: 'Goodluck Chowk, FC Road, Shivaji Nagar, Pune',
          ward: 'Ward 12 - Shivaji Nagar',
          jurisdictionId: 'mh-pune-pmc',
          corridorOrRoadName: 'FC Road',
        },
        hazards: [INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT, INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE],
        casualties: {
          hasCasualties: true,
          injuredCount: 2,
          fatalitiesCount: 0,
          requiresAmbulance: true,
          medicalNotes: 'Driver suffered shoulder fracture; passenger treated for lacerations',
        },
        vehiclesInvolved: [VEHICLE_TYPES.CAR_OR_AUTO, VEHICLE_TYPES.BUS_OR_TRUCK],
        evidence: [
          {
            mediaUrl: '/evidence/goodluck_chowk_impact.jpg',
            mediaType: 'IMAGE',
            caption: 'Frontal bumper impact zone and fluid leak',
            isGraphicOrSensitive: false,
          },
          {
            mediaUrl: '/evidence/driver_injury_close.jpg',
            mediaType: 'IMAGE',
            caption: 'Medical first responder splint application',
            isGraphicOrSensitive: true,
          },
        ],
        reporter: {
          name: 'Pooja Deshmukh',
          contactNumber: '+91 9881123456',
        },
      };

      const incident = await incidentService.createIncident(payload, {
        user: { role: 'CITIZEN', userId: 'usr-cit-101' },
      });

      expect(incident.id).toBeDefined();
      expect(incident.incidentNumber).toMatch(/^INC-2026-\d{4}$/);
      expect(incident.title).toBe(payload.title);
      expect(incident.incidentType).toBe(INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT);
      expect(incident.status).toBe(INCIDENT_STATUS.REPORTED);
      expect(incident.severity).toBe(INCIDENT_SEVERITY.HIGH);
      expect(new Date(incident.occurredAt).getTime()).toBe(new Date(pastTime).getTime());
      expect(incident.location.latitude).toBe(18.5204);
      expect(incident.location.longitude).toBe(73.8567);
      expect(incident.location.jurisdictionId).toBe('mh-pune-pmc');
      expect(incident.hazards).toContain(INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT);
      expect(incident.casualties.injuredCount).toBe(2);
      expect(incident.casualties.requiresAmbulance).toBe(true);
      expect(incident.evidence.length).toBe(2);
      expect(incident.statusHistory.length).toBe(1);
    });

    it('rejects incident creation when required title or type is missing or invalid', async () => {
      const pastTime = new Date(Date.now() - 1800000).toISOString();
      await expect(
        incidentService.createIncident({
          title: 'Too',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: pastTime,
          location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        })
      ).rejects.toThrow(/at least 5 characters/);

      await expect(
        incidentService.createIncident({
          title: 'Valid Incident Title Here',
          incidentType: 'INVALID_TYPE_ENUM',
          occurredAt: pastTime,
          location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        })
      ).rejects.toThrow(/Invalid incidentType/);
    });

    it('rejects incident creation with future occurredAt or invalid GPS coordinates', async () => {
      const futureTime = new Date(Date.now() + 86400000).toISOString();
      const pastTime = new Date(Date.now() - 1800000).toISOString();

      await expect(
        incidentService.createIncident({
          title: 'Valid Title for Future Incident',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: futureTime,
          location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        })
      ).rejects.toThrow(/cannot be in the future/);

      await expect(
        incidentService.createIncident({
          title: 'Valid Title with Out of Bounds Lat',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: pastTime,
          location: { latitude: 95.0, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        })
      ).rejects.toThrow(/between -90 and 90/);

      await expect(
        incidentService.createIncident({
          title: 'Valid Title with Missing Jurisdiction',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: pastTime,
          location: { latitude: 18.52, longitude: 73.85 },
        })
      ).rejects.toThrow(/jurisdictionId is required/);
    });

    it('automatically infers CRITICAL severity when fatalities or severe hazards exist', async () => {
      const pastTime = new Date(Date.now() - 1800000).toISOString();
      const incident = await incidentService.createIncident({
        title: 'High-voltage line snapped over vehicle with passenger inside',
        incidentType: INCIDENT_TYPES.HAZARDOUS_UTILITY_EVENT,
        occurredAt: pastTime,
        location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        hazards: [INCIDENT_HAZARDS.LIVE_WIRES_OR_ELECTROCUTION],
      });

      expect(incident.severity).toBe(INCIDENT_SEVERITY.HIGH);

      const fatalIncident = await incidentService.createIncident({
        title: 'Overturned trailer collision with pedestrian fatality',
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        occurredAt: pastTime,
        location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        casualties: {
          fatalitiesCount: 1,
        },
      });

      expect(fatalIncident.severity).toBe(INCIDENT_SEVERITY.CRITICAL);
    });
  });

  describe('2. Sensitive Details & Privacy Protection', () => {
    it('reveals unredacted PII and graphic evidence to authorized roles (DISASTER_COORDINATOR, DISTRICT_ULB_ADMIN)', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'DISASTER_COORDINATOR' },
      });

      expect(incident.isSensitiveDataRedacted).toBe(false);
      expect(incident.reporter.contactNumber).toBe('+91 9822019483');
      expect(incident.reporter.name).toBe('Ramesh Kulkarni');
      expect(incident.casualties.medicalNotes).toContain('limb trauma');

      // Graphic evidence remains accessible to official responders
      const graphicEv = incident.evidence.find((e) => e.isGraphicOrSensitive);
      expect(graphicEv.mediaUrl).toBe('/protected-evidence/paud_flyover_injury_trauma_close.jpg');
      expect(graphicEv.isContentRestricted).toBeUndefined();
    });

    it('redacts reporter phone, anonymizes citizen name, masks medical notes, and protects graphic evidence for public/CITIZEN', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'CITIZEN' },
      });

      expect(incident.isSensitiveDataRedacted).toBe(true);

      // Contact number is masked
      expect(incident.reporter.contactNumber).toBe(REDACTED_CONTACT_MASK);
      expect(incident.reporter.name).toBe('Citizen Reporter');

      // Medical notes are redacted
      expect(incident.casualties.medicalNotes).toBe(REDACTED_PII_VALUE);

      // Non-sensitive injury counts remain visible for situational awareness
      expect(incident.casualties.injuredCount).toBe(3);
      expect(incident.casualties.hasCasualties).toBe(true);

      // Graphic evidence is restricted
      const graphicEv = incident.evidence.find((e) => e.isGraphicOrSensitive);
      expect(graphicEv.mediaUrl).toBe(REDACTED_GRAPHIC_MEDIA);
      expect(graphicEv.isContentRestricted).toBe(true);

      // Non-graphic overview evidence remains visible
      const overviewEv = incident.evidence.find((e) => !e.isGraphicOrSensitive);
      expect(overviewEv.mediaUrl).toBe('/protected-evidence/paud_flyover_scene_overview.jpg');
    });

    it('records privileged access audit log when sensitive incident data is viewed', async () => {
      await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'DISTRICT_ULB_ADMIN', userId: 'admin-01' },
      });

      const audit = incidentService.auditLogs.find(
        (log) => log.action === 'SENSITIVE_INCIDENT_VIEWED' && log.incidentId === 'inc-pune-001'
      );
      expect(audit).toBeDefined();
      expect(audit.actorId).toBe('admin-01');
    });
  });

  describe('3. Incident Lifecycle Status Transitions', () => {
    it('allows authorized responder (DISASTER_COORDINATOR) to transition status and records history', async () => {
      const updated = await incidentService.updateIncidentStatus(
        'inc-pune-001',
        INCIDENT_STATUS.CONTAINED,
        { notes: 'Vehicles cleared to shoulder, fuel washed down' },
        { user: { role: 'DISASTER_COORDINATOR', userId: 'dc-pune-01' } }
      );

      expect(updated.status).toBe(INCIDENT_STATUS.CONTAINED);
      const latestHistory = updated.statusHistory[updated.statusHistory.length - 1];
      expect(latestHistory.status).toBe(INCIDENT_STATUS.CONTAINED);
      expect(latestHistory.actorId).toBe('dc-pune-01');
      expect(latestHistory.notes).toBe('Vehicles cleared to shoulder, fuel washed down');
    });

    it('rejects unauthorized role (CITIZEN, FIELD_WORKER) attempting status transition', async () => {
      await expect(
        incidentService.updateIncidentStatus(
          'inc-pune-001',
          INCIDENT_STATUS.RESOLVED,
          {},
          { user: { role: 'CITIZEN' } }
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it('rejects invalid status transitions', async () => {
      await expect(
        incidentService.updateIncidentStatus(
          'inc-pune-001',
          'UNKNOWN_STATUS',
          {},
          { user: { role: 'DISASTER_COORDINATOR' } }
        )
      ).rejects.toThrow(/Invalid status/);
    });
  });

  describe('4. Incident Filtering & Summary Aggregations', () => {
    it('filters incidents by incidentType, jurisdiction, and casualties', async () => {
      const accidents = await incidentService.listIncidents({
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
      });
      expect(accidents.incidents.every((i) => i.incidentType === INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT)).toBe(true);

      const pcmcIncidents = await incidentService.listIncidents({
        jurisdictionId: 'mh-pune-pcmc',
      });
      expect(pcmcIncidents.incidents.every((i) => i.location.jurisdictionId === 'mh-pune-pcmc')).toBe(true);

      const casualtyIncidents = await incidentService.listIncidents({
        hasCasualties: true,
      });
      expect(casualtyIncidents.incidents.every((i) => i.casualties.hasCasualties)).toBe(true);
    });

    it('computes aggregated incident summary stats without PII', async () => {
      const stats = incidentService.getIncidentSummaryStats();

      expect(stats.total).toBeGreaterThanOrEqual(4);
      expect(stats.activeCount).toBeGreaterThanOrEqual(1);
      expect(stats.criticalCount).toBeGreaterThanOrEqual(1);
      expect(stats.byType[INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT]).toBeDefined();
      expect(stats.hazardsDistribution[INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT]).toBeDefined();
      expect(stats.jurisdictions['mh-pune-pmc']).toBeDefined();
    });
  });

  describe('5. REST API Integration Endpoints', () => {
    it('POST /incidents creates a new incident and returns 201', async () => {
      const pastTime = new Date(Date.now() - 1800000).toISOString();
      const res = await request(app)
        .post('/incidents')
        .set('x-user-role', 'CITIZEN')
        .send({
          title: 'Overturned chemical delivery tanker leaking fluid',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          severity: INCIDENT_SEVERITY.CRITICAL,
          occurredAt: pastTime,
          location: {
            latitude: 18.5205,
            longitude: 73.8568,
            address: 'FC Road, Shivaji Nagar, Pune',
            jurisdictionId: 'mh-pune-pmc',
          },
          hazards: [INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT, INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.incidentNumber).toMatch(/^INC-2026-\d{4}$/);
      expect(res.body.incident.status).toBe(INCIDENT_STATUS.REPORTED);
    });

    it('GET /incidents lists incidents with privacy redaction for public viewers', async () => {
      const res = await request(app)
        .get('/incidents')
        .set('x-user-role', 'CITIZEN');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incidents.length).toBeGreaterThanOrEqual(1);

      // Verify privacy redaction
      const inc = res.body.incidents.find((i) => i.id === 'inc-pune-001');
      expect(inc.isSensitiveDataRedacted).toBe(true);
      expect(inc.reporter.contactNumber).toBe(REDACTED_CONTACT_MASK);
    });

    it('GET /incidents/:id returns full unredacted details to authorized official', async () => {
      const res = await request(app)
        .get('/incidents/inc-pune-001')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.isSensitiveDataRedacted).toBe(false);
      expect(res.body.incident.reporter.contactNumber).toBe('+91 9822019483');
    });

    it('GET /incidents/stats/summary returns aggregate metrics without PII', async () => {
      const res = await request(app).get('/incidents/stats/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.total).toBeGreaterThanOrEqual(4);
      expect(res.body.stats.criticalCount).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /incidents/:id/status updates status for authorized responder', async () => {
      const res = await request(app)
        .patch('/incidents/inc-pune-001/status')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .send({
          status: INCIDENT_STATUS.RESOLVED,
          notes: 'Tow truck cleared wreckage, traffic normalized',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.status).toBe(INCIDENT_STATUS.RESOLVED);
    });

    it('PATCH /incidents/:id/status returns 403 for unauthorized citizen', async () => {
      const res = await request(app)
        .patch('/incidents/inc-pune-001/status')
        .set('x-user-role', 'CITIZEN')
        .send({
          status: INCIDENT_STATUS.RESOLVED,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });
  });
});
