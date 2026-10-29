/**
 * Phase 55 & 56 Exit Checks: Critical Incident & Accident Model & Response Workflow Tests
 * Validates distinct incident entity creation, location/time/hazard/evidence capture,
 * sensitive data and PII protection, rapid emergency submission with UNVERIFIED state,
 * official Call 112 handoff, responder confirmation, incident closure, timeline, and notifications.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  incidentService,
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  VERIFICATION_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_HAZARDS,
  VEHICLE_TYPES,
  TIMELINE_EVENT_TYPES,
  INCIDENT_NOTIFICATION_TYPES,
  REDACTED_CONTACT_MASK,
  REDACTED_PII_VALUE,
  REDACTED_GRAPHIC_MEDIA,
} from './index.js';

describe('Phase 55 & 56: Critical Accident/Incident Model & Response Workflow', () => {
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
        ],
        reporter: {
          name: 'Sunil Shinde',
          contactNumber: '+91 9822199000',
        },
      };

      const incident = await incidentService.createIncident(payload);

      expect(incident.id).toBeDefined();
      expect(incident.incidentNumber).toMatch(/^INC-\d{4}-\d{4}$/);
      expect(incident.title).toBe(payload.title);
      expect(incident.incidentType).toBe(INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT);
      expect(incident.severity).toBe(INCIDENT_SEVERITY.HIGH);
      expect(incident.status).toBe(INCIDENT_STATUS.REPORTED);
      expect(incident.location.jurisdictionId).toBe('mh-pune-pmc');
      expect(incident.hazards).toContain(INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT);
      expect(incident.casualties.injuredCount).toBe(2);
      expect(incident.casualties.requiresAmbulance).toBe(true);
      expect(incident.vehiclesInvolved).toContain(VEHICLE_TYPES.CAR_OR_AUTO);
      expect(incident.evidence).toHaveLength(1);
    });

    it('rejects incident creation if title is shorter than 5 characters', async () => {
      await expect(
        incidentService.createIncident({
          title: 'Acc',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: new Date(Date.now() - 60000).toISOString(),
          location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune' },
        })
      ).rejects.toThrow('Incident title is required and must be at least 5 characters long.');
    });

    it('rejects incident creation if occurredAt is in the future', async () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString();
      await expect(
        incidentService.createIncident({
          title: 'Future incident reporting test',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: futureTime,
          location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune' },
        })
      ).rejects.toThrow('occurredAt cannot be in the future.');
    });

    it('rejects incident creation if location coordinates are invalid', async () => {
      await expect(
        incidentService.createIncident({
          title: 'Invalid coordinates incident test',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: new Date(Date.now() - 60000).toISOString(),
          location: { latitude: 95.0, longitude: 73.85, jurisdictionId: 'mh-pune' },
        })
      ).rejects.toThrow('Valid latitude between -90 and 90 is required.');
    });

    it('rejects incident creation if location.jurisdictionId is missing', async () => {
      await expect(
        incidentService.createIncident({
          title: 'Missing jurisdiction test',
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          occurredAt: new Date(Date.now() - 60000).toISOString(),
          location: { latitude: 18.52, longitude: 73.85 },
        })
      ).rejects.toThrow('location.jurisdictionId is required.');
    });

    it('infers CRITICAL severity automatically when fatalities or >=3 casualties reported', async () => {
      const incident = await incidentService.createIncident({
        title: 'Severe multiple collision with multiple casualties',
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        occurredAt: new Date(Date.now() - 60000).toISOString(),
        location: { latitude: 18.52, longitude: 73.85, jurisdictionId: 'mh-pune-pmc' },
        casualties: {
          hasCasualties: true,
          injuredCount: 4,
          fatalitiesCount: 0,
        },
      });

      expect(incident.severity).toBe(INCIDENT_SEVERITY.CRITICAL);
    });
  });

  describe('2. Sensitive Data & PII Protection (Privacy / Ethics)', () => {
    it('masks citizen reporter contact number and name for public requests', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'CITIZEN' },
      });

      expect(incident.isSensitiveDataRedacted).toBe(true);
      expect(incident.reporter.contactNumber).toBe(REDACTED_CONTACT_MASK);
      expect(incident.reporter.name).toBe('Citizen Reporter');
    });

    it('redacts sensitive medical notes from casualties for unauthorized viewers', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'CITIZEN' },
      });

      expect(incident.casualties.medicalNotes).toBe(REDACTED_PII_VALUE);
    });

    it('restricts graphic accident injury media evidence from public view', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'CITIZEN' },
      });

      const graphicEv = incident.evidence.find((e) => e.isGraphicOrSensitive);
      expect(graphicEv).toBeDefined();
      expect(graphicEv.mediaUrl).toBe(REDACTED_GRAPHIC_MEDIA);
      expect(graphicEv.isContentRestricted).toBe(true);

      const nonGraphicEv = incident.evidence.find((e) => !e.isGraphicOrSensitive);
      expect(nonGraphicEv.mediaUrl).not.toBe(REDACTED_GRAPHIC_MEDIA);
    });

    it('provides full unredacted details to authorized disaster coordinators and administrators', async () => {
      const incident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'DISASTER_COORDINATOR' },
      });

      expect(incident.isSensitiveDataRedacted).toBe(false);
      expect(incident.reporter.contactNumber).toBe('+91 9822019483');
      expect(incident.reporter.name).toBe('Ramesh Kulkarni');
      expect(incident.casualties.medicalNotes).toContain('limb trauma');
      const graphicEv = incident.evidence.find((e) => e.isGraphicOrSensitive);
      expect(graphicEv.mediaUrl).toBe('/protected-evidence/paud_flyover_injury_trauma_close.jpg');
    });
  });

  describe('3. Lifecycle Transitions & Filtering', () => {
    it('allows authorized officials to update status and records statusHistory audit', async () => {
      const updated = await incidentService.updateIncidentStatus(
        'inc-pune-001',
        INCIDENT_STATUS.CONTAINED,
        { notes: 'Fuel spill neutralized with sand, wreckage moved to shoulder' },
        { user: { role: 'DISTRICT_ULB_ADMIN', userId: 'adm-01' } }
      );

      expect(updated.status).toBe(INCIDENT_STATUS.CONTAINED);
      const lastHistory = updated.statusHistory[updated.statusHistory.length - 1];
      expect(lastHistory.status).toBe(INCIDENT_STATUS.CONTAINED);
      expect(lastHistory.notes).toContain('Fuel spill neutralized');
      expect(lastHistory.actorId).toBe('adm-01');
    });

    it('rejects status update when attempted by unauthorized citizen', async () => {
      await expect(
        incidentService.updateIncidentStatus(
          'inc-pune-001',
          INCIDENT_STATUS.CONTAINED,
          { notes: 'Illegal citizen attempt' },
          { user: { role: 'CITIZEN' } }
        )
      ).rejects.toThrow('Forbidden: Updating incident status requires first-responder or administrative authorization.');
    });

    it('filters incidents by jurisdictionId and severity correctly', async () => {
      const pcmcList = await incidentService.listIncidents({
        jurisdictionId: 'mh-pune-pcmc',
      });
      expect(pcmcList.incidents.length).toBeGreaterThanOrEqual(1);
      expect(pcmcList.incidents.every((inc) => inc.location.jurisdictionId === 'mh-pune-pcmc')).toBe(true);

      const criticalList = await incidentService.listIncidents({
        severity: INCIDENT_SEVERITY.CRITICAL,
      });
      expect(criticalList.incidents.length).toBeGreaterThanOrEqual(2);
      expect(criticalList.incidents.every((inc) => inc.severity === INCIDENT_SEVERITY.CRITICAL)).toBe(true);
    });
  });

  describe('4. Phase 56: Accident Response Workflow (Rapid Submission, UNVERIFIED, Call 112, Responder Confirmation & Closure)', () => {
    it('submitRapidIncident creates an incident in UNVERIFIED state with minimal required fields', async () => {
      const result = await incidentService.submitRapidIncident({
        incidentType: INCIDENT_TYPES.FIRE_AND_SMOKE,
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          address: 'Tilak Road transformer spark',
          jurisdictionId: 'mh-pune-pmc',
        },
      });

      expect(result.id).toBeDefined();
      expect(result.incidentNumber).toMatch(/^INC-\d{4}-\d{4}$/);
      expect(result.status).toBe(INCIDENT_STATUS.UNVERIFIED);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.UNVERIFIED);
      expect(result.title).toContain('Emergency: FIRE AND SMOKE');
    });

    it('submitRapidIncident auto-links Call 112 handoff when handoffTo112 is flagged', async () => {
      const result = await incidentService.submitRapidIncident({
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        location: {
          latitude: 18.53,
          longitude: 73.84,
          address: 'Shivaji Nagar Underpass',
          jurisdictionId: 'mh-pune-pmc',
        },
        handoffTo112: true,
      });

      expect(result.status).toBe(INCIDENT_STATUS.UNVERIFIED);
      expect(result.officialResponderHandoff.isHandedOffTo112).toBe(true);
      expect(result.officialResponderHandoff.handoffChannel).toBe('CALL_112');

      const timeline = await incidentService.getIncidentTimeline(result.id);
      const handoffEvent = timeline.find((e) => e.eventType === TIMELINE_EVENT_TYPES.CALL_112_HANDOFF_INITIATED);
      expect(handoffEvent).toBeDefined();
      expect(handoffEvent.title).toContain('Call 112 Handoff');
    });

    it('recordCall112Handoff logs official 112 handoff metadata and appends timeline event', async () => {
      const incident = await incidentService.createIncident({
        title: 'Overturned tractor near Saswad Phata',
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        occurredAt: new Date(Date.now() - 300000).toISOString(),
        location: {
          latitude: 18.49,
          longitude: 73.91,
          address: 'Saswad Phata, Hadapsar',
          jurisdictionId: 'mh-pune-pmc',
        },
      });

      const updated = await incidentService.recordCall112Handoff(incident.id, {
        notes: 'Citizen connected to 112 dispatch, Ambulance requested',
      });

      expect(updated.officialResponderHandoff.isHandedOffTo112).toBe(true);
      expect(updated.officialResponderHandoff.handoffChannel).toBe('CALL_112');

      const timeline = await incidentService.getIncidentTimeline(incident.id);
      const handoffEvent = timeline.find((e) => e.eventType === TIMELINE_EVENT_TYPES.CALL_112_HANDOFF_INITIATED);
      expect(handoffEvent).toBeDefined();
    });

    it('confirmIncident transitions incident from UNVERIFIED to RESPONDER_CONFIRMED for authorized responders', async () => {
      const rapidInc = await incidentService.submitRapidIncident({
        incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
        location: {
          latitude: 18.50,
          longitude: 73.82,
          address: 'Kothrud Depot Chowk',
          jurisdictionId: 'mh-pune-pmc',
        },
      });

      expect(rapidInc.status).toBe(INCIDENT_STATUS.UNVERIFIED);

      const confirmed = await incidentService.confirmIncident(
        rapidInc.id,
        {
          officerName: 'Inspector K. Patil',
          agency: 'TRAFFIC_POLICE',
          badgeNumber: 'PUNE-TP-42',
          confirmedSeverity: INCIDENT_SEVERITY.HIGH,
          notes: 'Two-wheeler and car collision confirmed. First aid administered.',
        },
        { user: { role: 'FIRST_RESPONDER', userId: 'resp-42' } }
      );

      expect(confirmed.status).toBe(INCIDENT_STATUS.RESPONDER_CONFIRMED);
      expect(confirmed.verificationStatus).toBe(VERIFICATION_STATUS.CONFIRMED);
      expect(confirmed.severity).toBe(INCIDENT_SEVERITY.HIGH);
      expect(confirmed.responderConfirmation.officerName).toBe('Inspector K. Patil');

      const timeline = await incidentService.getIncidentTimeline(rapidInc.id);
      const confirmEvent = timeline.find((e) => e.eventType === TIMELINE_EVENT_TYPES.RESPONDER_CONFIRMED);
      expect(confirmEvent).toBeDefined();
      expect(confirmEvent.title).toContain('Ground Confirmation');
    });

    it('confirmIncident fails with 403 for unauthorized citizen', async () => {
      await expect(
        incidentService.confirmIncident(
          'inc-pune-005',
          { notes: 'Citizen trying to confirm' },
          { user: { role: 'CITIZEN' } }
        )
      ).rejects.toThrow('Forbidden: Incident responder confirmation requires first-responder or administrative authorization.');
    });

    it('closeIncident closes the incident with notes and creates timeline & notification entries', async () => {
      const closed = await incidentService.closeIncident(
        'inc-pune-001',
        {
          notes: 'Vehicles towed to roadside, debris swept, normal traffic flow restored.',
          status: INCIDENT_STATUS.CLOSED,
        },
        { user: { role: 'DISASTER_COORDINATOR', userId: 'dc-01' } }
      );

      expect(closed.status).toBe(INCIDENT_STATUS.CLOSED);
      expect(closed.closureReason).toContain('Vehicles towed to roadside');
      expect(closed.closedBy).toBe('dc-01');

      const timeline = await incidentService.getIncidentTimeline('inc-pune-001');
      const closeEvent = timeline.find((e) => e.eventType === TIMELINE_EVENT_TYPES.INCIDENT_CLOSED);
      expect(closeEvent).toBeDefined();

      const notifs = await incidentService.getIncidentNotifications('inc-pune-001');
      const closeNotif = notifs.find((n) => n.type === INCIDENT_NOTIFICATION_TYPES.INCIDENT_CLOSURE_NOTICE);
      expect(closeNotif).toBeDefined();
    });

    it('closeIncident rejects closure notes with fewer than 5 characters', async () => {
      await expect(
        incidentService.closeIncident(
          'inc-pune-001',
          { notes: 'ok' },
          { user: { role: 'DISTRICT_ULB_ADMIN' } }
        )
      ).rejects.toThrow('Closure notes or reason is required and must be at least 5 characters long.');
    });

    it('getIncidentTimeline returns ordered chronological events', async () => {
      const timeline = await incidentService.getIncidentTimeline('inc-pune-001');
      expect(timeline.length).toBeGreaterThanOrEqual(4);
      expect(timeline[0].eventType).toBe(TIMELINE_EVENT_TYPES.INCIDENT_RECORDED);
      expect(timeline[1].eventType).toBe(TIMELINE_EVENT_TYPES.CALL_112_HANDOFF_INITIATED);
    });

    it('getIncidentNotifications returns notifications for incident', async () => {
      const notifs = await incidentService.getIncidentNotifications('inc-pune-005');
      expect(notifs.length).toBeGreaterThanOrEqual(2);
      expect(notifs.some((n) => n.type === INCIDENT_NOTIFICATION_TYPES.INCIDENT_RECORDED_UNVERIFIED)).toBe(true);
    });
  });

  describe('5. REST API Endpoints Integration', () => {
    it('POST /incidents/rapid submits rapid report with UNVERIFIED status', async () => {
      const res = await request(app)
        .post('/incidents/rapid')
        .send({
          incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            address: 'FC Road near Deccan',
            jurisdictionId: 'mh-pune-pmc',
          },
          handoffTo112: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.status).toBe(INCIDENT_STATUS.UNVERIFIED);
      expect(res.body.incident.officialResponderHandoff.isHandedOffTo112).toBe(true);
    });

    it('POST /incidents/:id/handoff-112 logs 112 handoff', async () => {
      const res = await request(app)
        .post('/incidents/inc-pune-005/handoff-112')
        .send({
          notes: 'User pressed Call 112 button from incident view',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.officialResponderHandoff.isHandedOffTo112).toBe(true);
    });

    it('POST /incidents/:id/confirm transitions status for authorized responder', async () => {
      const res = await request(app)
        .post('/incidents/inc-pune-005/confirm')
        .set('x-user-role', 'FIRST_RESPONDER')
        .send({
          officerName: 'Head Constable Jadhav',
          agency: 'TRAFFIC_POLICE',
          notes: 'Auto collision confirmed, ambulance on scene',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.status).toBe(INCIDENT_STATUS.RESPONDER_CONFIRMED);
      expect(res.body.incident.verificationStatus).toBe(VERIFICATION_STATUS.CONFIRMED);
    });

    it('POST /incidents/:id/confirm returns 403 for unauthorized citizen', async () => {
      const res = await request(app)
        .post('/incidents/inc-pune-005/confirm')
        .set('x-user-role', 'CITIZEN')
        .send({
          notes: 'Citizen attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('POST /incidents/:id/close closes incident for authorized official', async () => {
      const res = await request(app)
        .post('/incidents/inc-pune-005/close')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .send({
          notes: 'Clearance completed. All casualties evacuated and roadway cleared.',
          status: INCIDENT_STATUS.CLOSED,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incident.status).toBe(INCIDENT_STATUS.CLOSED);
    });

    it('GET /incidents/:id/timeline returns chronological events', async () => {
      const res = await request(app).get('/incidents/inc-pune-001/timeline');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.timeline)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(4);
    });

    it('GET /incidents/:id/notifications returns incident notifications', async () => {
      const res = await request(app).get('/incidents/inc-pune-001/notifications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(3);
    });

    it('GET /incidents returns redacted listings for public citizen requests', async () => {
      const res = await request(app).get('/incidents');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incidents.length).toBeGreaterThanOrEqual(4);

      for (const inc of res.body.incidents) {
        expect(inc.isSensitiveDataRedacted).toBe(true);
        expect(inc.reporter.contactNumber).toBe(REDACTED_CONTACT_MASK);
      }
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

    it('GET /incidents/stats/summary returns aggregate metrics including unverified and closed counts', async () => {
      const res = await request(app).get('/incidents/stats/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.total).toBeGreaterThanOrEqual(5);
      expect(res.body.stats.criticalCount).toBeGreaterThanOrEqual(2);
      expect(res.body.stats.unverifiedCount).toBeDefined();
      expect(res.body.stats.closedCount).toBeDefined();
    });
  });
});
