/**
 * Phase 60 Exit Checks: Public Safety Communication Templates & Safety Tests
 * Validates:
 * 1. Approved templates for verified issue alerts, incident updates, and official-source notices
 * 2. Mandatory inclusion of emergency disclaimers and Call 112 helpline handoffs
 * 3. Strict Human-In-The-Loop gate preventing unreviewed AI text from becoming official public warnings
 * 4. Human official approval and editing workflows for AI drafts
 * 5. Template variable sanitization and rejection of missing parameters
 * 6. REST API endpoints for templates, rendering, AI-draft review, and publishing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  communicationService,
  COMMUNICATION_TYPES,
  COMMUNICATION_CHANNELS,
  REVIEW_STATUS,
  PUBLISH_STATUS,
  SEVERITY_LEVEL,
  EMERGENCY_HANDOFF_CONTACTS,
  EMERGENCY_DISCLAIMER_TEXT,
  UnreviewedAIWarningError,
} from './index.js';

describe('Phase 60: Public Safety Communication Templates & Safety Governance', () => {
  beforeEach(() => {
    communicationService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Approved Templates Catalog & Safe Rendering
  // ─────────────────────────────────────────────────────────────
  describe('1. Approved Templates Catalog & Safe Rendering', () => {
    it('provides approved templates covering verified hazards, corridor detours, clearance, and official notices', async () => {
      const templates = await communicationService.listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);

      const hazardTpl = templates.find((t) => t.id === 'tpl-verified-hazard-alert');
      expect(hazardTpl).toBeDefined();
      expect(hazardTpl.communicationType).toBe(COMMUNICATION_TYPES.VERIFIED_ISSUE_ALERT);
      expect(hazardTpl.preApproved).toBe(true);

      const detourTpl = templates.find((t) => t.id === 'tpl-traffic-corridor-detour');
      expect(detourTpl).toBeDefined();
      expect(detourTpl.communicationType).toBe(COMMUNICATION_TYPES.INCIDENT_UPDATE);

      const clearedTpl = templates.find((t) => t.id === 'tpl-incident-cleared-notice');
      expect(clearedTpl).toBeDefined();
      expect(clearedTpl.communicationType).toBe(COMMUNICATION_TYPES.INCIDENT_UPDATE);

      const officialNoticeTpl = templates.find((t) => t.id === 'tpl-official-weather-hazard');
      expect(officialNoticeTpl).toBeDefined();
      expect(officialNoticeTpl.communicationType).toBe(COMMUNICATION_TYPES.OFFICIAL_SOURCE_NOTICE);
    });

    it('safely renders template with variable interpolation and mandatory emergency disclaimer', async () => {
      const rendered = await communicationService.renderTemplate(
        'tpl-verified-hazard-alert',
        {
          hazardName: 'Fallen 11kV Overhead Power Cable',
          locationName: 'Near Goodluck Chowk, FC Road',
          wardName: 'Ward 12 - Shivaji Nagar',
          precautionAction: 'Maintain 50-meter perimeter; avoid wet ground contact',
          verifiedByAgency: 'MSEDCL & PMC Disaster Cell',
        },
        { language: 'en' }
      );

      expect(rendered.id).toBeDefined();
      expect(rendered.title).toContain('Fallen 11kV Overhead Power Cable');
      expect(rendered.title).toContain('Near Goodluck Chowk');
      expect(rendered.body).toContain('MSEDCL & PMC Disaster Cell');
      expect(rendered.body).toContain('Maintain 50-meter perimeter');

      // MANDATORY EMERGENCY DISCLAIMER & CONTACTS GUARANTEE (ADR 0002)
      expect(rendered.emergencyDisclaimer).toBe(EMERGENCY_DISCLAIMER_TEXT.en);
      expect(rendered.emergencyDisclaimer).toContain('call 112 immediately');
      expect(rendered.emergencyContacts.NATIONAL_EMERGENCY).toBe('112');
      expect(rendered.emergencyContacts.AMBULANCE_EMS).toBe('108');
      expect(rendered.doNotRelyOnCivIQForImmediateRescue).toBe(true);

      // Pre-approved template initial status
      expect(rendered.reviewStatus).toBe(REVIEW_STATUS.PRE_APPROVED_TEMPLATE);
      expect(rendered.publishStatus).toBe(PUBLISH_STATUS.DRAFT);
    });

    it('renders localized Marathi copy with Marathi emergency disclaimer', async () => {
      const rendered = await communicationService.renderTemplate(
        'tpl-traffic-corridor-detour',
        {
          corridorName: 'Paud Road Flyover',
          incidentType: 'Road Collision',
          blockageLevel: 'Severe',
          alternateRoute: 'Karve Road via Canal Diversion',
          trafficPoliceDivision: 'Kothrud Traffic Division',
        },
        { language: 'mr' }
      );

      expect(rendered.language).toBe('mr');
      expect(rendered.title).toContain('वाहतूक कोंडी सूचना');
      expect(rendered.body).toContain('पर्यायी मार्ग');
      expect(rendered.body).toContain('Karve Road via Canal Diversion');
      expect(rendered.emergencyDisclaimer).toBe(EMERGENCY_DISCLAIMER_TEXT.mr);
      expect(rendered.emergencyDisclaimer).toContain('112 वर संपर्क साधा');
    });

    it('rejects rendering when required template variables are missing', async () => {
      await expect(
        communicationService.renderTemplate('tpl-verified-hazard-alert', {
          hazardName: 'Pothole',
          // missing locationName, wardName, precautionAction, verifiedByAgency
        })
      ).rejects.toThrow(/Missing required template variable/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Strict AI Governance & Human-in-the-Loop Safety Gate
  // ─────────────────────────────────────────────────────────────
  describe('2. AI Text Review Governance & Publication Safety Gate', () => {
    it('sets AI-drafted notices to AI_DRAFT_PENDING_REVIEW', async () => {
      const aiDraft = await communicationService.createAiDraft({
        title: 'AI Drafted Hazard Alert: Flooding at Pulgate Culvert',
        summary: 'Culvert overflowing, traffic diverted',
        body: 'Water level has crossed red marking. Vehicles advised to avoid Pulgate junction.',
        modelIdentifier: 'gemini-1.5-flash-civic-synthesis',
      });

      expect(aiDraft.id).toBeDefined();
      expect(aiDraft.isAiDraft).toBe(true);
      expect(aiDraft.reviewStatus).toBe(REVIEW_STATUS.AI_DRAFT_PENDING_REVIEW);
      expect(aiDraft.publishStatus).toBe(PUBLISH_STATUS.DRAFT);
      expect(aiDraft.aiModelProvenance.modelIdentifier).toBe('gemini-1.5-flash-civic-synthesis');
      expect(aiDraft.emergencyDisclaimer).toContain('call 112 immediately');
    });

    it('PREVENTS unreviewed AI text from becoming an official warning (throws UnreviewedAIWarningError)', async () => {
      const aiDraft = await communicationService.createAiDraft({
        title: 'Unreviewed AI Synthesis: High Voltage Cable Arcing',
        body: 'Automated camera detected sparks at Shivajinagar substation.',
      });

      // Attempt to publish without official human review MUST be blocked
      await expect(
        communicationService.publishAlert(aiDraft.id, { role: 'OPERATOR' })
      ).rejects.toThrow(UnreviewedAIWarningError);

      // Verify alert was NOT published
      const unchanged = await communicationService.getAlertById(aiDraft.id);
      expect(unchanged.publishStatus).toBe(PUBLISH_STATUS.DRAFT);
      expect(unchanged.reviewStatus).toBe(REVIEW_STATUS.AI_DRAFT_PENDING_REVIEW);
    });

    it('denies approval rights to unauthorized roles (citizens, field workers)', async () => {
      const aiDraft = await communicationService.createAiDraft({
        title: 'AI Hazard Draft',
        body: 'Preliminary hazard advisory proposed by synthesis pipeline.',
      });

      const citizenUser = { id: 'user-citizen-1', role: 'CITIZEN' };
      await expect(
        communicationService.approveAiDraft(aiDraft.id, citizenUser)
      ).rejects.toThrow(/Forbidden: Role 'CITIZEN' is not authorized/);

      const fieldWorker = { id: 'worker-1', role: 'FIELD_WORKER' };
      await expect(
        communicationService.approveAiDraft(aiDraft.id, fieldWorker)
      ).rejects.toThrow(/is not authorized/);
    });

    it('allows authorized human official to review, edit, approve, and then publish an AI draft', async () => {
      const aiDraft = await communicationService.createAiDraft({
        title: 'Preliminary AI Draft: Sinhagad Road Waterlogging',
        body: 'Automated water sensor shows 40cm water depth at Dandekar Bridge.',
      });

      const officialApprover = {
        id: 'officer-pmc-01',
        name: 'Disaster Cell Duty Officer',
        role: 'DISASTER_COORDINATOR',
      };

      // 1. Official human approval with human-in-the-loop copy refinement
      const approvedAlert = await communicationService.approveAiDraft(aiDraft.id, officialApprover, {
        editedTitle: 'Verified Warning: Sinhagad Road Inundation at Dandekar Bridge',
        editedBody: 'Water depth 40cm at Dandekar Bridge confirmed by field crew. Low-clearance vehicles must avoid corridor.',
        approvalNotes: 'Verified via CCTV stream and traffic police on duty.',
      });

      expect(approvedAlert.reviewStatus).toBe(REVIEW_STATUS.APPROVED_BY_OFFICIAL);
      expect(approvedAlert.title).toBe('Verified Warning: Sinhagad Road Inundation at Dandekar Bridge');
      expect(approvedAlert.officialReview).toBeDefined();
      expect(approvedAlert.officialReview.approverRole).toBe('DISASTER_COORDINATOR');

      // 2. Publication now succeeds because human official has reviewed and approved
      const published = await communicationService.publishAlert(approvedAlert.id, officialApprover);
      expect(published.publishStatus).toBe(PUBLISH_STATUS.PUBLISHED);
      expect(published.publishedAt).toBeDefined();
    });

    it('blocks publication of an AI draft that was rejected by an official', async () => {
      const aiDraft = await communicationService.createAiDraft({
        title: 'Erroneous AI Hallucination Warning',
        body: 'AI model falsely detected chemical leak based on misclassified drone photo.',
      });

      const officialRejector = { id: 'admin-01', role: 'DISTRICT_ULB_ADMIN' };
      const rejected = await communicationService.rejectAiDraft(
        aiDraft.id,
        officialRejector,
        'False alarm - steam exhaust from legal bakery misidentified as chemical plume.'
      );

      expect(rejected.reviewStatus).toBe(REVIEW_STATUS.REJECTED_BY_OFFICIAL);
      expect(rejected.publishStatus).toBe(PUBLISH_STATUS.REVOKED);

      await expect(
        communicationService.publishAlert(aiDraft.id, officialRejector)
      ).rejects.toThrow(/explicitly rejected by official review/);
    });

    it('allows immediate publication of pre-approved templates without waiting for AI review', async () => {
      const preApprovedAlert = await communicationService.renderTemplate('tpl-incident-cleared-notice', {
        corridorName: 'JM Road',
        clearedAt: '12:30 PM IST',
      });

      expect(preApprovedAlert.reviewStatus).toBe(REVIEW_STATUS.PRE_APPROVED_TEMPLATE);

      // Pre-approved template can be published directly by an authorized dispatcher
      const published = await communicationService.publishAlert(preApprovedAlert.id, {
        id: 'disp-01',
        role: 'EMERGENCY_DISPATCHER',
      });

      expect(published.publishStatus).toBe(PUBLISH_STATUS.PUBLISHED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REST API Endpoints (/communications)
  // ─────────────────────────────────────────────────────────────
  describe('3. REST Endpoints (/communications)', () => {
    it('GET /communications/templates returns catalog and emergency handoff contacts', async () => {
      const res = await request(app).get('/communications/templates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(4);
      expect(res.body.emergencyContacts.NATIONAL_EMERGENCY).toBe('112');
    });

    it('GET /communications/templates/:id returns specific template or 404', async () => {
      const res = await request(app).get('/communications/templates/tpl-verified-hazard-alert');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.template.name).toBe('Verified Public Safety Hazard Alert');

      const resNotFound = await request(app).get('/communications/templates/non-existent-template');
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.success).toBe(false);
    });

    it('POST /communications/render renders template and includes emergency notice', async () => {
      const res = await request(app)
        .post('/communications/render')
        .send({
          templateId: 'tpl-verified-hazard-alert',
          variables: {
            hazardName: 'Watermain Burst',
            locationName: 'Dhole Patil Road',
            wardName: 'Ward 8 - Koregaon Park',
            precautionAction: 'Avoid carriageway; water pressure shutdown in progress',
            verifiedByAgency: 'PMC Water Supply Department',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.alert.title).toContain('Watermain Burst');
      expect(res.body.alert.emergencyDisclaimer).toContain('call 112 immediately');
      expect(res.body.alert.doNotRelyOnCivIQForImmediateRescue).toBe(true);
    });

    it('POST /communications/render fails with 400 when variables are missing', async () => {
      const res = await request(app)
        .post('/communications/render')
        .send({
          templateId: 'tpl-verified-hazard-alert',
          variables: { hazardName: 'Incomplete' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required template variable');
    });

    it('POST /communications/ai-draft and safety publish gate via REST API', async () => {
      // 1. Submit AI draft
      const resDraft = await request(app)
        .post('/communications/ai-draft')
        .send({
          title: 'AI Draft: Smoke Detected Near University Road',
          body: 'Video feed analysis suggests smoke emission near university south gate.',
        });

      expect(resDraft.status).toBe(201);
      expect(resDraft.body.aiDraft.reviewStatus).toBe('AI_DRAFT_PENDING_REVIEW');
      const alertId = resDraft.body.aiDraft.id;

      // 2. Attempt publish unreviewed AI draft -> FAILS with 403 Forbidden
      const resBlockedPublish = await request(app)
        .post(`/communications/alerts/${alertId}/publish`)
        .send({});

      expect(resBlockedPublish.status).toBe(403);
      expect(resBlockedPublish.body.success).toBe(false);
      expect(resBlockedPublish.body.error).toContain('unreviewed AI-generated text');

      // 3. Official approves AI draft
      const resApprove = await request(app)
        .post(`/communications/alerts/${alertId}/approve`)
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .set('x-user-id', 'officer-42')
        .send({
          editedTitle: 'Controlled Municipal Leaf Clearing: University Road',
          approvalNotes: 'Confirmed with university security as controlled compost clearing, no hazard.',
        });

      expect(resApprove.status).toBe(200);
      expect(resApprove.body.alert.reviewStatus).toBe('APPROVED_BY_OFFICIAL');

      // 4. Publish now succeeds
      const resAllowedPublish = await request(app)
        .post(`/communications/alerts/${alertId}/publish`)
        .send({});

      expect(resAllowedPublish.status).toBe(200);
      expect(resAllowedPublish.body.alert.publishStatus).toBe('PUBLISHED');
    });

    it('GET /communications/alerts lists alerts with status filters', async () => {
      const res = await request(app).get('/communications/alerts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });
  });
});
