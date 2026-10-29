/**
 * Phase 59 Exit Checks: Emergency Responder/Agency Role Model & Scoped Access Tests
 * Validates:
 * 1. Authorized responder organizations and scoped capabilities
 * 2. Responder personnel registration, badge verification, and operational status
 * 3. Scoped RBAC/ABAC access to incidents (jurisdiction and role matching)
 * 4. Audit logging of sensitive incident PII and graphic evidence access
 * 5. Algorithmic dispatch recommendations with non-CAD statutory boundary notice
 * 6. REST API endpoints for agencies, responders, access evaluation, and dispatch
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  responderService,
  dispatchRecommendationEngine,
  RESPONDER_AGENCY_TYPES,
  RESPONDER_ROLES,
  RESPONDER_CAPABILITIES,
  RESPONDER_STATUS,
  DISPATCH_RECOMMENDATION_STATUS,
  DISPATCH_URGENCY_LEVEL,
  SENSITIVE_ACCESS_ACTIONS,
  DISPATCH_ADVISORY_DISCLAIMER,
} from './index.js';
import { incidentService, INCIDENT_SEVERITY } from '../incidents/index.js';

describe('Phase 59: Emergency Responder/Agency Role Model & Scoped Access', () => {
  beforeEach(() => {
    responderService.reset();
    incidentService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Authorized Responder Organizations
  // ─────────────────────────────────────────────────────────────
  describe('1. Authorized Responder Organizations', () => {
    it('initializes with seeded authorized agencies in Pune (PMC) and PCMC', async () => {
      const agencies = await responderService.listAgencies();
      expect(agencies.length).toBeGreaterThanOrEqual(4);

      const trafficPolice = agencies.find((a) => a.agencyType === RESPONDER_AGENCY_TYPES.TRAFFIC_POLICE);
      expect(trafficPolice).toBeDefined();
      expect(trafficPolice.jurisdictionId).toBe('mh-pune-pmc');
      expect(trafficPolice.capabilities).toContain(RESPONDER_CAPABILITIES.TRAFFIC_CONTROL);

      const ems = agencies.find((a) => a.agencyType === RESPONDER_AGENCY_TYPES.MEDICAL_EMERGENCY);
      expect(ems).toBeDefined();
      expect(ems.capabilities).toContain(RESPONDER_CAPABILITIES.ADVANCED_LIFE_SUPPORT);
    });

    it('registers a new authorized responder agency with validation', async () => {
      const newAgency = await responderService.registerAgency({
        name: 'Hadapsar Rapid Medical Station',
        agencyType: RESPONDER_AGENCY_TYPES.MEDICAL_EMERGENCY,
        jurisdictionId: 'mh-pune-pmc',
        controlRoomHotline: '+91-20-2687-1080',
        capabilities: [RESPONDER_CAPABILITIES.BASIC_LIFE_SUPPORT],
      });

      expect(newAgency.id).toBeDefined();
      expect(newAgency.name).toBe('Hadapsar Rapid Medical Station');
      expect(newAgency.isActive).toBe(true);

      const fetched = await responderService.getAgency(newAgency.id);
      expect(fetched).not.toBeNull();
      expect(fetched.name).toBe('Hadapsar Rapid Medical Station');
    });

    it('rejects invalid agency registration missing jurisdiction or name', async () => {
      await expect(
        responderService.registerAgency({ agencyType: RESPONDER_AGENCY_TYPES.POLICE })
      ).rejects.toThrow(/Agency name is required/);

      await expect(
        responderService.registerAgency({ name: 'Valid Name', agencyType: 'INVALID_TYPE' })
      ).rejects.toThrow(/Invalid agencyType/);

      await expect(
        responderService.registerAgency({ name: 'Valid Name', agencyType: RESPONDER_AGENCY_TYPES.POLICE })
      ).rejects.toThrow(/jurisdictionId is required/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Responder Personnel Management
  // ─────────────────────────────────────────────────────────────
  describe('2. Responder Personnel Management', () => {
    it('registers an authorized responder with badge number and accountability', async () => {
      const responder = await responderService.registerResponder({
        name: 'Head Constable Sunil Gaikwad',
        badgeNumber: 'HC-MH-TP-9921',
        role: RESPONDER_ROLES.FIRST_RESPONDER,
        agencyId: 'org-pune-traffic-kothrud',
        contactNumber: '+91 98229 12345',
      });

      expect(responder.id).toBeDefined();
      expect(responder.badgeNumber).toBe('HC-MH-TP-9921');
      expect(responder.jurisdictionId).toBe('mh-pune-pmc');
      expect(responder.status).toBe(RESPONDER_STATUS.AVAILABLE_ON_DUTY);
    });

    it('rejects responder registration without badge number or valid agency', async () => {
      await expect(
        responderService.registerResponder({ name: 'Officer Without Badge', agencyId: 'org-pune-traffic-kothrud' })
      ).rejects.toThrow(/badgeNumber is required/);

      await expect(
        responderService.registerResponder({ name: 'Officer', badgeNumber: 'B-101', agencyId: 'non-existent-agency' })
      ).rejects.toThrow(/Valid agencyId is required/);
    });

    it('updates responder operational status and scene location', async () => {
      const updated = await responderService.updateResponderStatus(
        'resp-tp-kothrud-4421',
        RESPONDER_STATUS.DISPATCHED_TO_SCENE,
        { latitude: 18.5074, longitude: 73.8077 }
      );

      expect(updated.status).toBe(RESPONDER_STATUS.DISPATCHED_TO_SCENE);
      expect(updated.currentLocation).toBeDefined();
      expect(updated.currentLocation.latitude).toBeCloseTo(18.5074);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Scoped Access Control & Sensitive Incident Auditing
  // ─────────────────────────────────────────────────────────────
  describe('3. Scoped Access Control & Sensitive Incident Auditing', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'PLATFORM_SUPER_ADMIN' },
      });
    });

    it('grants unredacted sensitive access to authorized responder in matching jurisdiction and creates audit log', async () => {
      const authorizedResponder = {
        id: 'resp-tp-kothrud-4421',
        userId: 'user-tp-4421',
        name: 'Sub-Inspector Sachin Deshmukh',
        role: RESPONDER_ROLES.FIRST_RESPONDER,
        badgeNumber: 'IO-MH-TP-4421',
        agencyId: 'org-pune-traffic-kothrud',
        jurisdictionId: 'mh-pune-pmc',
      };

      const accessResult = await responderService.authorizeIncidentAccess(
        authorizedResponder,
        testIncident,
        'SENSITIVE_PII',
        {
          justification: 'On-scene FIR collision recording and trauma triage',
          ipAddress: '10.0.1.42',
        }
      );

      expect(accessResult.allowed).toBe(true);
      expect(accessResult.redactionsApplied).toBe(false);
      expect(accessResult.auditLogged).toBe(true);
      expect(accessResult.auditEntryId).toBeDefined();

      // Check that sensitive fields are present and unredacted
      expect(accessResult.incident.reporter.contactNumber).not.toBe('***-***-****');

      // Verify audit log record
      const auditTrail = await responderService.getSensitiveAccessAuditTrail(testIncident.id);
      expect(auditTrail.length).toBeGreaterThan(0);
      const log = auditTrail[0];
      expect(log.incidentId).toBe(testIncident.id);
      expect(log.actor.badgeNumber).toBe('IO-MH-TP-4421');
      expect(log.actor.role).toBe(RESPONDER_ROLES.FIRST_RESPONDER);
      expect(log.action).toBe(SENSITIVE_ACCESS_ACTIONS.VIEW_SENSITIVE_PII);
      expect(log.justification).toContain('On-scene FIR');
      expect(log.granted).toBe(true);
    });

    it('denies sensitive access to unauthorized citizen and logs unauthorized attempt', async () => {
      const citizenUser = {
        id: 'user-citizen-99',
        role: 'CITIZEN',
      };

      await expect(
        responderService.authorizeIncidentAccess(citizenUser, testIncident, 'SENSITIVE_PII', {
          justification: 'Casual curiosity',
        })
      ).rejects.toThrow(/Access Denied/);

      // Verify unauthorized audit log entry was created
      const auditTrail = await responderService.getSensitiveAccessAuditTrail(testIncident.id);
      expect(auditTrail.length).toBe(1);
      expect(auditTrail[0].granted).toBe(false);
      expect(auditTrail[0].actor.role).toBe('CITIZEN');
    });

    it('denies sensitive access to responder from another jurisdiction without escalation', async () => {
      const foreignResponder = {
        id: 'resp-pcmc-01',
        name: 'PCMC Officer',
        role: RESPONDER_ROLES.FIRST_RESPONDER,
        jurisdictionId: 'mh-pune-pcmc', // Incident is in mh-pune-pmc
        agencyId: 'org-pcmc-disaster-cell',
      };

      await expect(
        responderService.authorizeIncidentAccess(foreignResponder, testIncident, 'SENSITIVE_PII')
      ).rejects.toThrow(/Access Denied/);
    });

    it('provides sanitized redacted view for standard or summary requests', async () => {
      const standardUser = {
        id: 'user-public-01',
        role: 'CITIZEN',
      };

      const accessResult = await responderService.authorizeIncidentAccess(
        standardUser,
        testIncident,
        'SUMMARY'
      );

      expect(accessResult.allowed).toBe(true);
      expect(accessResult.redactionsApplied).toBe(true);
      expect(accessResult.incident.reporter.contactNumber).toBe('***-***-****');
      expect(accessResult.incident.reporter.name).toBe('Citizen Reporter');
      expect(accessResult.incident.casualties.medicalNotes).toBe('[REDACTED FOR PRIVACY]');
      expect(accessResult.incident.isSensitiveDataRedacted).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Advisory Dispatch Recommendations (ADR 0002 Compliance)
  // ─────────────────────────────────────────────────────────────
  describe('4. Dispatch Recommendation Engine & Statutory Safeguards', () => {
    it('computes advisory dispatch recommendations matching incident hazards and casualties', async () => {
      const agencies = await responderService.listAgencies();

      // Incident with casualties, hazardous fuel leak, and heavy bus involvement
      const highImpactIncident = {
        id: 'INC-HIGH-IMPACT-01',
        severity: 'CRITICAL',
        hazards: ['FIRE_OR_EXPLOSION_RISK', 'HAZARDOUS_MATERIAL_SPILL'],
        casualties: {
          hasCasualties: true,
          fatalitiesCount: 1,
          injuredCount: 3,
          grievousInjuriesCount: 2,
        },
        vehiclesInvolved: ['CITY_BUS', 'MOTORCYCLE'],
        location: {
          jurisdictionId: 'mh-pune-pmc',
          address: 'Paud Road Flyover Ramp',
        },
      };

      const recommendation = dispatchRecommendationEngine.evaluate(highImpactIncident, agencies);

      expect(recommendation.incidentId).toBe('INC-HIGH-IMPACT-01');
      expect(recommendation.overallUrgency).toBe(DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY);
      expect(recommendation.recommendations.length).toBeGreaterThanOrEqual(3);

      // Verify medical recommendation (EMS ALS)
      const emsRec = recommendation.recommendations.find(
        (r) => r.agencyType === RESPONDER_AGENCY_TYPES.MEDICAL_EMERGENCY
      );
      expect(emsRec).toBeDefined();
      expect(emsRec.capabilityRequested).toBe(RESPONDER_CAPABILITIES.ADVANCED_LIFE_SUPPORT);

      // Verify fire & rescue recommendation (Hazmat / Extrication)
      const fireRec = recommendation.recommendations.find(
        (r) => r.agencyType === RESPONDER_AGENCY_TYPES.FIRE_AND_RESCUE
      );
      expect(fireRec).toBeDefined();

      // Verify traffic control recommendation
      const trafficRec = recommendation.recommendations.find(
        (r) => r.agencyType === RESPONDER_AGENCY_TYPES.TRAFFIC_POLICE
      );
      expect(trafficRec).toBeDefined();

      // STRICT STATUTORY GUARANTEES (ADR 0002)
      expect(recommendation.isOfficialCadDispatch).toBe(false);
      expect(recommendation.requiresOfficial112Handoff).toBe(true);
      expect(recommendation.statutoryNotice).toBe(DISPATCH_ADVISORY_DISCLAIMER);
      expect(recommendation.statutoryNotice).toContain('ADVISORY NOTICE: CivIQ dispatch recommendations');
    });

    it('updates recommendation status when acknowledged by official agency dispatcher', async () => {
      const testIncident = await incidentService.getIncidentById('inc-pune-001', {
        user: { role: 'PLATFORM_SUPER_ADMIN' },
      });

      const recommendation = await responderService.createDispatchRecommendation(testIncident);
      expect(recommendation.status).toBe(DISPATCH_RECOMMENDATION_STATUS.RECOMMENDED);

      const updated = await responderService.updateDispatchRecommendationStatus(
        recommendation.recommendationId,
        DISPATCH_RECOMMENDATION_STATUS.TRANSMITTED_TO_OFFICIAL_CAD,
        {
          actor: {
            id: 'resp-disp-pmc-01',
            role: RESPONDER_ROLES.EMERGENCY_DISPATCHER,
            name: 'Dispatch Officer Vikram Gokhale',
            badgeNumber: 'CAD-PMC-DISP-01',
          },
          notes: 'Relayed to Pune Police 112 Control Room Desk #4',
        }
      );

      expect(updated.status).toBe(DISPATCH_RECOMMENDATION_STATUS.TRANSMITTED_TO_OFFICIAL_CAD);
      expect(updated.updatedBy.badgeNumber).toBe('CAD-PMC-DISP-01');
      expect(updated.updateNotes).toContain('Pune Police 112');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. REST API Endpoints (/responders)
  // ─────────────────────────────────────────────────────────────
  describe('5. REST Endpoints (/responders)', () => {
    it('GET /responders/agencies returns authorized agencies', async () => {
      const res = await request(app).get('/responders/agencies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(res.body.agencies)).toBe(true);
    });

    it('GET /responders/agencies/:id returns agency details or 404', async () => {
      const res = await request(app).get('/responders/agencies/org-pune-traffic-kothrud');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.agency.name).toContain('Kothrud Division');

      const resNotFound = await request(app).get('/responders/agencies/non-existent-agency');
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.success).toBe(false);
    });

    it('POST /responders registers responder personnel', async () => {
      const res = await request(app)
        .post('/responders')
        .send({
          name: 'Paramedic Neha Joshi',
          badgeNumber: 'EMS-MH-BLS-8812',
          role: RESPONDER_ROLES.FIRST_RESPONDER,
          agencyId: 'org-pune-ems-108',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.responder.badgeNumber).toBe('EMS-MH-BLS-8812');
    });

    it('PATCH /responders/:id/status updates operational status', async () => {
      const res = await request(app)
        .patch('/responders/resp-tp-kothrud-4421/status')
        .send({ status: RESPONDER_STATUS.ON_SCENE_ACTIVE });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.responder.status).toBe(RESPONDER_STATUS.ON_SCENE_ACTIVE);
    });

    it('POST /responders/incidents/:id/authorize-access enforces scoped access and returns audit trail', async () => {
      // 1. Authorized responder in jurisdiction
      const resAuth = await request(app)
        .post('/responders/incidents/inc-pune-001/authorize-access')
        .send({
          actor: {
            id: 'resp-tp-kothrud-4421',
            role: RESPONDER_ROLES.FIRST_RESPONDER,
            jurisdictionId: 'mh-pune-pmc',
            badgeNumber: 'IO-MH-TP-4421',
          },
          requestedLevel: 'SENSITIVE_PII',
          justification: 'Police scene investigation',
        });

      expect(resAuth.status).toBe(200);
      expect(resAuth.body.success).toBe(true);
      expect(resAuth.body.allowed).toBe(true);
      expect(resAuth.body.auditLogged).toBe(true);
      expect(resAuth.body.redactionsApplied).toBe(false);

      // 2. Fetch audit trail
      const resTrail = await request(app).get('/responders/incidents/inc-pune-001/audit-trail');
      expect(resTrail.status).toBe(200);
      expect(resTrail.body.count).toBeGreaterThanOrEqual(1);
      expect(resTrail.body.auditLogs[0].actor.badgeNumber).toBe('IO-MH-TP-4421');

      // 3. Unauthorized citizen denied
      const resDenied = await request(app)
        .post('/responders/incidents/inc-pune-001/authorize-access')
        .send({
          actor: {
            id: 'citizen-101',
            role: 'CITIZEN',
          },
          requestedLevel: 'SENSITIVE_PII',
        });

      expect(resDenied.status).toBe(403);
      expect(resDenied.body.success).toBe(false);
      expect(resDenied.body.error).toContain('Access Denied');
    });

    it('POST /responders/incidents/:id/dispatch-recommendation returns advisory recommendations with CAD disclaimer', async () => {
      const res = await request(app)
        .post('/responders/incidents/inc-pune-001/dispatch-recommendation');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.recommendation).toBeDefined();
      expect(res.body.recommendation.isOfficialCadDispatch).toBe(false);
      expect(res.body.disclaimer).toContain('ADVISORY NOTICE');

      // Update status
      const recId = res.body.recommendation.recommendationId;
      const resPatch = await request(app)
        .patch(`/responders/dispatch-recommendations/${recId}/status`)
        .send({
          status: DISPATCH_RECOMMENDATION_STATUS.ACKNOWLEDGED_BY_RESPONDER,
          notes: 'Ambulance Unit 108 en route',
        });

      expect(resPatch.status).toBe(200);
      expect(resPatch.body.recommendation.status).toBe(
        DISPATCH_RECOMMENDATION_STATUS.ACKNOWLEDGED_BY_RESPONDER
      );
    });
  });
});
