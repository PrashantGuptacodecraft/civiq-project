/**
 * End-to-End Disaster Operations & Situation Room Simulation Test
 * Phase 66: Build disaster situation room and after-action review
 *
 * Exit checks:
 * - End-to-end disaster simulation test
 * - Event command dashboard: alerts, impact clusters, blocked routes, needs, resources, tasks
 * - Event timeline and dynamic post-event metrics
 * - AI-assisted After-Action Review (AAR) with strict source provenance labels
 * - Role-based authorization & jurisdiction validation
 * - REST API endpoints integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  disasterOpsService,
  DisasterOpsService,
  RESPONSE_TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  AAR_SOURCE_LABELS,
  AAR_STATUS,
  DISASTER_OPS_DISCLAIMER,
} from './index.js';
import { disasterService } from '../disasters/index.js';
import { resourceService } from '../resources/index.js';
import { resourceMatchingService } from '../resource-matching/index.js';
import { disasterImpactService } from '../disaster-impact/index.js';

describe('Phase 66: Disaster Situation Room & Operations Command', () => {
  let app;
  const DISASTER_ID = 'dis-pune-mutha-flood-2026';

  beforeEach(() => {
    disasterOpsService.reset();
    disasterService.reset();
    resourceService.reset();
    resourceMatchingService.reset();
    disasterImpactService.reset();
    app = createApp();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. END-TO-END DISASTER SIMULATION TEST
  // ─────────────────────────────────────────────────────────────
  describe('1. End-to-End Disaster Simulation Test', () => {
    it('executes full disaster lifecycle: alert -> impact -> task dispatch -> metrics -> AI after-action review', async () => {
      const coordinatorContext = {
        id: 'pmc-coord-01',
        role: 'DISASTER_COORDINATOR',
        jurisdictionId: 'mh-pune-pmc',
      };
      const fieldWorkerContext = {
        id: 'worker-pmc-42',
        role: 'FIELD_WORKER',
        jurisdictionId: 'mh-pune-pmc',
      };

      // STEP 1: Load Situation Room Command Matrix
      const room = await disasterOpsService.getSituationRoomData(DISASTER_ID, coordinatorContext);
      expect(room.disaster.id).toBe(DISASTER_ID);
      expect(room.disaster.severity).toBe('SEVERE_EMERGENCY');
      expect(room.disaster.lifecycleState).toBe('ACTIVE_RESPONSE');
      expect(room.statutoryNotice).toBe(DISASTER_OPS_DISCLAIMER);

      // Verify command sub-panels data
      expect(room.alerts.length).toBeGreaterThan(0);
      expect(room.impactClusters.length).toBeGreaterThan(0);
      expect(room.blockedRoutes.length).toBeGreaterThan(0);
      expect(room.blockedRoutes.some((r) => /baba bhide/i.test(r.title))).toBe(true);
      expect(room.resources.length).toBeGreaterThan(0);
      expect(room.responseTasks.length).toBeGreaterThanOrEqual(5);

      // STEP 2: Dispatch New Rapid Dewatering Task
      const initialTaskCount = room.responseTasks.length;
      const newTask = await disasterOpsService.createResponseTask(
        DISASTER_ID,
        {
          title: 'Deploy secondary trash pump to Pulgate causeway underpass',
          description: 'Rising water level blocking pedestrian subway. Position 1,500 LPM diesel pump.',
          taskType: RESPONSE_TASK_TYPES.DEWATERING_PUMPING,
          priority: TASK_PRIORITY.HIGH_P1,
          location: {
            latitude: 18.5080,
            longitude: 73.8750,
            address: 'Pulgate Culvert Underpass, Pune',
          },
          assignedUnit: {
            id: 'res-pune-equipment-katraj',
            name: 'Katraj Ghat Dewatering Flying Squad',
            leadOfficer: 'Sunil Bhosale',
            contactPhoneMasked: '+91-98XXXX7766',
          },
          notes: 'Immediate dewatering ordered by command coordinator.',
        },
        coordinatorContext
      );

      expect(newTask.id).toMatch(/^task-/);
      expect(newTask.taskNumber).toMatch(/^TASK-2026-/);
      expect(newTask.status).toBe(TASK_STATUS.DISPATCHED);
      expect(newTask.dispatchedAt).toBeTruthy();

      // STEP 3: Field Unit Progress: Arrive On-Scene
      const onSceneTask = await disasterOpsService.updateResponseTaskStatus(
        newTask.id,
        TASK_STATUS.ON_SCENE,
        'Pumps positioned at low end of culvert; suction line primed.',
        fieldWorkerContext
      );
      expect(onSceneTask.status).toBe(TASK_STATUS.ON_SCENE);
      expect(onSceneTask.arrivedAt).toBeTruthy();

      // STEP 4: Field Unit Progress: Task Completed
      const completedTask = await disasterOpsService.updateResponseTaskStatus(
        newTask.id,
        TASK_STATUS.COMPLETED,
        'Underpass fully dewatered; silt cleared; road opened for emergency transit.',
        fieldWorkerContext
      );
      expect(completedTask.status).toBe(TASK_STATUS.COMPLETED);
      expect(completedTask.completedAt).toBeTruthy();

      // STEP 5: Verify Event Timeline Milestones
      const timelineResult = await disasterOpsService.getTimeline(DISASTER_ID, coordinatorContext);
      expect(timelineResult.timeline.length).toBeGreaterThan(8);
      const latestMilestones = timelineResult.timeline.slice(-3);
      expect(latestMilestones.some((m) => m.stage === 'DISPATCH')).toBe(true);
      expect(latestMilestones.some((m) => m.stage === 'TASK_COMPLETED')).toBe(true);

      // STEP 6: Compute Post-Event Operational Metrics
      const metrics = await disasterOpsService.computeMetrics(DISASTER_ID, coordinatorContext);
      expect(metrics.disasterId).toBe(DISASTER_ID);
      expect(metrics.responseTasksTotal).toBe(initialTaskCount + 1);
      expect(metrics.responseTasksCompleted).toBeGreaterThanOrEqual(3);
      expect(metrics.totalPersonsSheltered).toBeGreaterThan(0);
      expect(metrics.averageDispatchLatencyMinutes).toBeGreaterThan(0);

      // STEP 7: Generate AI-Assisted After-Action Review (AAR) with Source Labels
      const generatedAar = await disasterOpsService.generateAfterActionReview(
        DISASTER_ID,
        {},
        coordinatorContext
      );
      expect(generatedAar.status).toBe(AAR_STATUS.DRAFT_AI_ASSISTED);
      expect(generatedAar.isAuthoritative).toBe(false);

      // Verify strict source provenance labels in AAR text per ADR 0002
      expect(generatedAar.executiveSummary).toContain(AAR_SOURCE_LABELS.AI_DRAFT);
      expect(generatedAar.executiveSummary).toContain(AAR_SOURCE_LABELS.SACHET_NDMA_ALERT);
      expect(generatedAar.executiveSummary).toContain(AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD);
      expect(generatedAar.executiveSummary).toContain(AAR_SOURCE_LABELS.FIELD_INSPECTION);
      expect(generatedAar.strengthsObserved.some((s) => s.includes(AAR_SOURCE_LABELS.SACHET_NDMA_ALERT))).toBe(true);
      expect(generatedAar.recommendations.some((r) => r.includes(AAR_SOURCE_LABELS.AI_DRAFT))).toBe(true);
      expect(generatedAar.sourceCitations.length).toBeGreaterThanOrEqual(4);

      // STEP 8: Authorized Coordinator Approves & Signs Off AAR
      const approvedAar = await disasterOpsService.saveAfterActionReview(
        DISASTER_ID,
        {
          status: AAR_STATUS.APPROVED_PUBLISHED,
          approvalNotes: 'Reviewed and formally signed off by Pune Disaster Management Cell for DDMA record.',
        },
        coordinatorContext
      );
      expect(approvedAar.status).toBe(AAR_STATUS.APPROVED_PUBLISHED);
      expect(approvedAar.reviewedBy.id).toBe('pmc-coord-01');
      expect(approvedAar.reviewedBy.role).toBe('DISASTER_COORDINATOR');
      expect(approvedAar.isAuthoritative).toBe(false); // Retains sovereign disclaimer
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHORIZATION & JURISDICTION VALIDATION
  // ─────────────────────────────────────────────────────────────
  describe('2. Authorization & Jurisdiction Validation', () => {
    it('denies task creation when caller lacks disasters:write permission', async () => {
      const unauthorizedCaller = {
        id: 'citizen-01',
        role: 'CITIZEN', // lacks disasters:write
        jurisdictionId: 'mh-pune-pmc',
      };

      await expect(
        disasterOpsService.createResponseTask(
          DISASTER_ID,
          {
            title: 'Unauthorized citizen rescue task',
            taskType: RESPONSE_TASK_TYPES.RESCUE_EVACUATION,
          },
          unauthorizedCaller
        )
      ).rejects.toThrow(/Access denied: role 'CITIZEN' lacks 'disasters:write'/);
    });

    it('denies AAR approval when caller lacks disasters:manage permission', async () => {
      const fieldWorker = {
        id: 'worker-01',
        role: 'FIELD_WORKER', // lacks disasters:manage
        jurisdictionId: 'mh-pune-pmc',
      };

      await expect(
        disasterOpsService.saveAfterActionReview(
          DISASTER_ID,
          { status: AAR_STATUS.APPROVED_PUBLISHED },
          fieldWorker
        )
      ).rejects.toThrow(/Access denied: role 'FIELD_WORKER' lacks 'disasters:manage'/);
    });

    it('denies cross-jurisdiction command access when user belongs to a different ULB', async () => {
      const pcmcAdmin = {
        id: 'pcmc-admin-01',
        role: 'DISTRICT_ULB_ADMIN',
        jurisdictionId: 'mh-pune-pcmc', // Scoped to PCMC, not PMC
      };

      await expect(
        disasterOpsService.getSituationRoomData(DISASTER_ID, pcmcAdmin)
      ).rejects.toThrow(/Cross-jurisdiction access denied/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REST API ROUTER INTEGRATION (/disaster-ops)
  // ─────────────────────────────────────────────────────────────
  describe('3. REST API Router Integration (/disaster-ops)', () => {
    it('GET /disaster-ops/situation-room/:id returns aggregated command matrix', async () => {
      const res = await request(app)
        .get(`/disaster-ops/situation-room/${DISASTER_ID}`)
        .set('x-user-id', 'admin-01')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.disaster.id).toBe(DISASTER_ID);
      expect(res.body.impactClusters.length).toBeGreaterThan(0);
      expect(res.body.blockedRoutes.length).toBeGreaterThan(0);
      expect(res.body.responseTasks.length).toBeGreaterThanOrEqual(5);
      expect(res.body.statutoryNotice).toBe(DISASTER_OPS_DISCLAIMER);
    });

    it('GET /disaster-ops/tasks returns tasks list with status filter', async () => {
      const res = await request(app)
        .get(`/disaster-ops/tasks?disasterId=${DISASTER_ID}&status=${TASK_STATUS.COMPLETED}`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(res.status).toBe(200);
      expect(res.body.tasks.every((t) => t.status === TASK_STATUS.COMPLETED)).toBe(true);
    });

    it('POST /disaster-ops/tasks creates new response task via REST API with 201', async () => {
      const res = await request(app)
        .post('/disaster-ops/tasks')
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          disasterId: DISASTER_ID,
          title: 'Establish drinking water point at Pulgate causeway',
          taskType: RESPONSE_TASK_TYPES.FOOD_WATER_RELIEF,
          priority: TASK_PRIORITY.HIGH_P1,
          location: { latitude: 18.5170, longitude: 73.8480, address: 'Pulgate Causeway' },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^task-/);
      expect(res.body.status).toBe(TASK_STATUS.DISPATCHED);
    });

    it('PATCH /disaster-ops/tasks/:id/status updates task status and records timestamp', async () => {
      const res = await request(app)
        .patch('/disaster-ops/tasks/task-pune-flood-003/status')
        .set('x-user-id', 'worker-pmc-42')
        .set('x-user-role', 'FIELD_WORKER')
        .send({
          status: TASK_STATUS.ON_SCENE,
          notes: 'Barricades erected on Deccan and Narayan Peth sides.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TASK_STATUS.ON_SCENE);
      expect(res.body.arrivedAt).toBeTruthy();
    });

    it('GET /disaster-ops/timeline/:id returns chronological event milestones', async () => {
      const res = await request(app)
        .get(`/disaster-ops/timeline/${DISASTER_ID}`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(res.status).toBe(200);
      expect(res.body.timeline.length).toBeGreaterThan(0);
      expect(res.body.timeline[0].source).toBeTruthy();
    });

    it('GET /disaster-ops/metrics/:id returns operational and post-event metrics', async () => {
      const res = await request(app)
        .get(`/disaster-ops/metrics/${DISASTER_ID}`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(res.status).toBe(200);
      expect(res.body.disasterId).toBe(DISASTER_ID);
      expect(res.body.totalPersonsSheltered).toBeGreaterThan(0);
      expect(res.body.responseTasksTotal).toBeGreaterThan(0);
    });

    it('POST /disaster-ops/aar/:id/generate and PUT /disaster-ops/aar/:id review lifecycle', async () => {
      // 1. Generate AAR Draft
      const genRes = await request(app)
        .post(`/disaster-ops/aar/${DISASTER_ID}/generate`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .send({});

      expect(genRes.status).toBe(201);
      expect(genRes.body.executiveSummary).toContain(AAR_SOURCE_LABELS.AI_DRAFT);
      expect(genRes.body.status).toBe(AAR_STATUS.DRAFT_AI_ASSISTED);

      // 2. Sign-off / Approve AAR
      const saveRes = await request(app)
        .put(`/disaster-ops/aar/${DISASTER_ID}`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .send({
          status: AAR_STATUS.APPROVED_PUBLISHED,
          approvalNotes: 'Approved for inter-agency disaster report archive.',
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.status).toBe(AAR_STATUS.APPROVED_PUBLISHED);
      expect(saveRes.body.reviewedBy.id).toBe('coord-01');

      // 3. Fetch AAR
      const getRes = await request(app)
        .get(`/disaster-ops/aar/${DISASTER_ID}`)
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(getRes.status).toBe(200);
      expect(getRes.body.status).toBe(AAR_STATUS.APPROVED_PUBLISHED);
    });
  });
});
