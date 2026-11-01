/**
 * Need-to-Resource Matching Test Suite
 * Phase 65: Build need-to-resource matching
 *
 * Exit checks:
 * - Deterministic matching tests across distance, capacity, type, and status
 * - Strict coordinator acceptance gate
 * - Fulfilment and confirmation audit tracking
 * - Jurisdiction scoping and role-based access control
 * - REST API endpoints integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  resourceMatchingService,
  ResourceMatchingService,
  NEED_TYPES,
  NEED_STATUS,
  ASSIGNMENT_STATUS,
  CAPACITY_FIT,
  DISASTER_RESOURCE_MATCHING_DISCLAIMER,
} from './index.js';
import { resourceService } from '../resources/index.js';

describe('Phase 65: Need-to-Resource Matching', () => {
  let app;

  beforeEach(() => {
    resourceMatchingService.reset();
    resourceService.reset();
    app = createApp();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. DETERMINISTIC MATCHING ALGORITHM
  // ─────────────────────────────────────────────────────────────
  describe('1. Deterministic Matching Algorithm', () => {
    it('ranks compatible nearby resources highest using deterministic score weights', async () => {
      const need = {
        id: 'need-test-shelter-01',
        needType: NEED_TYPES.SHELTER_ACCOMMODATION,
        quantity: 10,
        unit: 'PERSONS',
        location: {
          latitude: 18.4880,
          longitude: 73.8310,
          jurisdictionId: 'mh-pune-pmc',
        },
      };

      const candidates = [
        {
          id: 'res-vitthalwadi',
          title: 'Vitthalwadi Shelter',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'ACTIVE_OPERATIONAL',
          verificationStatus: 'VERIFIED_OFFICIAL',
          location: { latitude: 18.4870, longitude: 73.8340 }, // ~0.3 km
          capacity: { availableCapacity: 70, totalCapacity: 350 },
        },
        {
          id: 'res-dapodi',
          title: 'Dapodi Shelter',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'ACTIVE_OPERATIONAL',
          verificationStatus: 'VERIFIED_OFFICIAL',
          location: { latitude: 18.5780, longitude: 73.8290 }, // ~10 km
          capacity: { availableCapacity: 40, totalCapacity: 200 },
        },
        {
          id: 'res-deccan-depot',
          title: 'Deccan Relief Depot',
          resourceType: 'RELIEF_DISTRIBUTION_CENTER',
          status: 'ACTIVE_OPERATIONAL',
          verificationStatus: 'VERIFIED_OFFICIAL',
          location: { latitude: 18.5160, longitude: 73.8420 }, // ~3.3 km
          capacity: { availableCapacity: 1800, totalCapacity: 5000 },
        },
      ];

      const matches1 = resourceMatchingService.computeMatches(need, candidates);
      const matches2 = resourceMatchingService.computeMatches(need, candidates);

      // Determinism check: identical results on consecutive evaluations
      expect(matches1).toEqual(matches2);

      // Top match must be Vitthalwadi shelter (close, emergency shelter, ample capacity)
      expect(matches1[0].resourceId).toBe('res-vitthalwadi');
      expect(matches1[0].rank).toBe(1);
      expect(matches1[0].matchScore).toBeGreaterThan(85.0);
      expect(matches1[0].capacityFit).toBe(CAPACITY_FIT.EXCEEDS_REQUIREMENT);
      expect(matches1[0].isEligible).toBe(true);

      // Factor breakdown verification
      expect(matches1[0].factorBreakdown).toHaveLength(5);
      const typeFactor = matches1[0].factorBreakdown.find((f) => f.factor === 'type_compatibility');
      expect(typeFactor.score).toBe(1.0);
    });

    it('identifies rescue boat fleet as top match for BOAT_EVACUATION need', async () => {
      const need = {
        id: 'need-test-boat-01',
        needType: NEED_TYPES.BOAT_EVACUATION,
        quantity: 2,
        unit: 'BOATS',
        location: {
          latitude: 18.4880,
          longitude: 73.8310,
        },
      };

      const candidates = [
        {
          id: 'res-boats',
          title: 'Inflatable Rescue Boats Unit',
          resourceType: 'EMERGENCY_VEHICLE',
          status: 'ACTIVE_OPERATIONAL',
          verificationStatus: 'VERIFIED_OFFICIAL',
          location: { latitude: 18.5020, longitude: 73.8560 },
          capacity: { availableCapacity: 6, totalCapacity: 8 },
        },
        {
          id: 'res-shelter',
          title: 'Vitthalwadi Shelter',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'ACTIVE_OPERATIONAL',
          verificationStatus: 'VERIFIED_OFFICIAL',
          location: { latitude: 18.4870, longitude: 73.8340 },
          capacity: { availableCapacity: 70, totalCapacity: 350 },
        },
      ];

      const matches = resourceMatchingService.computeMatches(need, candidates);
      expect(matches[0].resourceId).toBe('res-boats');
      expect(matches[0].resourceType).toBe('EMERGENCY_VEHICLE');
      expect(matches[0].isEligible).toBe(true);

      // Incompatible shelter must be penalized for BOAT_EVACUATION
      const shelterMatch = matches.find((m) => m.resourceId === 'res-shelter');
      expect(shelterMatch.isEligible).toBe(false);
      expect(shelterMatch.ineligibilityReasons[0]).toMatch(/incompatible/i);
    });

    it('marks decommissioned or full-capacity resources as ineligible', async () => {
      const need = {
        id: 'need-test-ineligible',
        needType: NEED_TYPES.SHELTER_ACCOMMODATION,
        quantity: 10,
        unit: 'PERSONS',
        location: { latitude: 18.4880, longitude: 73.8310 },
      };

      const candidates = [
        {
          id: 'res-decom',
          title: 'Decommissioned Hall',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'DECOMMISSIONED',
          location: { latitude: 18.4880, longitude: 73.8310 },
          capacity: { availableCapacity: 50, totalCapacity: 50 },
        },
        {
          id: 'res-full',
          title: 'Full Capacity Shelter',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'AT_FULL_CAPACITY',
          location: { latitude: 18.4880, longitude: 73.8310 },
          capacity: { availableCapacity: 0, totalCapacity: 100 },
        },
      ];

      const matches = resourceMatchingService.computeMatches(need, candidates);
      const decom = matches.find((m) => m.resourceId === 'res-decom');
      const full = matches.find((m) => m.resourceId === 'res-full');

      expect(decom.isEligible).toBe(false);
      expect(decom.ineligibilityReasons[0]).toMatch(/decommissioned/i);

      expect(full.isEligible).toBe(false);
      expect(full.capacityFit).toBe(CAPACITY_FIT.ZERO_CAPACITY);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. NEED REQUEST LIFECYCLE & STATE TRANSITIONS
  // ─────────────────────────────────────────────────────────────
  describe('2. Need Request Lifecycle & State Transitions', () => {
    it('initializes with seeded verified need requests and assignments', async () => {
      const userContext = { id: 'admin-01', role: 'PLATFORM_SUPER_ADMIN' };
      const result = await resourceMatchingService.listNeedRequests({}, userContext);

      expect(result.needs.length).toBeGreaterThanOrEqual(4);
      expect(result.statutoryNotice).toBe(DISASTER_RESOURCE_MATCHING_DISCLAIMER);

      const openNeed = result.needs.find((n) => n.id === 'need-pune-vitthalwadi-boat-01');
      expect(openNeed.status).toBe(NEED_STATUS.OPEN_PENDING);
      expect(openNeed.needType).toBe(NEED_TYPES.BOAT_EVACUATION);

      const acceptedNeed = result.needs.find((n) => n.id === 'need-pune-vitthalwadi-shelter-01');
      expect(acceptedNeed.status).toBe(NEED_STATUS.ASSIGNMENT_ACCEPTED);
      expect(acceptedNeed.activeAssignmentId).toBe('asgn-pune-shelter-001');
    });

    it('creates a new need request and validates required fields', async () => {
      const userContext = {
        id: 'citizen-101',
        role: 'CITIZEN',
        jurisdictionId: 'mh-pune-pmc',
      };

      const created = await resourceMatchingService.createNeedRequest(
        {
          title: 'Urgent dry rations needed for 6 flood evacuees',
          description: 'Families sheltering on terrace without drinking water or dry food.',
          needType: NEED_TYPES.FOOD_RATIONS,
          quantity: 6,
          unit: 'MEALS',
          location: {
            latitude: 18.4910,
            longitude: 73.8360,
            address: 'Anand Nagar, Sinhagad Road',
            ward: 'Ward 9 - Sinhagad Road',
            jurisdictionId: 'mh-pune-pmc',
          },
        },
        userContext
      );

      expect(created.id).toMatch(/^need-/);
      expect(created.needNumber).toMatch(/^NEED-2026-/);
      expect(created.status).toBe(NEED_STATUS.OPEN_PENDING);
      expect(created.quantity).toBe(6);
      expect(created.requestedBy.id).toBe('citizen-101');
    });

    it('transitions need status to MATCH_RECOMMENDED upon match calculation', async () => {
      const userContext = { id: 'coord-01', role: 'DISASTER_COORDINATOR' };
      const needId = 'need-pune-vitthalwadi-boat-01';

      const before = await resourceMatchingService.getNeedRequestById(needId, userContext);
      expect(before.need.status).toBe(NEED_STATUS.OPEN_PENDING);

      const matchResult = await resourceMatchingService.getRecommendedMatches(needId, {}, userContext);
      expect(matchResult.matches.length).toBeGreaterThan(0);
      expect(matchResult.isAuthoritative).toBe(false);

      const after = await resourceMatchingService.getNeedRequestById(needId, userContext);
      expect(after.need.status).toBe(NEED_STATUS.MATCH_RECOMMENDED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. AUTHORIZED COORDINATOR ACCEPTANCE GATE
  // ─────────────────────────────────────────────────────────────
  describe('3. Authorized Coordinator Acceptance Gate', () => {
    it('denies assignment acceptance when caller lacks matching:manage permission', async () => {
      const unauthorizedCaller = {
        id: 'worker-01',
        role: 'FIELD_WORKER', // has matching:write but NOT matching:manage
        jurisdictionId: 'mh-pune-pmc',
      };

      await expect(
        resourceMatchingService.acceptAssignment(
          'need-pune-vitthalwadi-boat-01',
          { resourceId: 'res-pune-rescue-boat-fleet' },
          unauthorizedCaller
        )
      ).rejects.toThrow(/Access denied: role 'FIELD_WORKER' lacks 'matching:manage'/);
    });

    it('allows authorized disaster coordinator to accept assignment and creates audit trail', async () => {
      const coordinator = {
        id: 'pmc-coord-01',
        role: 'DISASTER_COORDINATOR',
        jurisdictionId: 'mh-pune-pmc',
      };

      const needId = 'need-pune-vitthalwadi-boat-01';
      const resourceId = 'res-pune-rescue-boat-fleet';

      const result = await resourceMatchingService.acceptAssignment(
        needId,
        {
          resourceId,
          assignedQuantity: 2,
          notes: 'Dispatched PMC rescue boats team alpha to Swapna Nagari Society.',
        },
        coordinator
      );

      expect(result.need.status).toBe(NEED_STATUS.ASSIGNMENT_ACCEPTED);
      expect(result.assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
      expect(result.assignment.assignedBy.id).toBe('pmc-coord-01');
      expect(result.assignment.assignedBy.role).toBe('DISASTER_COORDINATOR');
      expect(result.assignment.history).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. FULFILMENT AND CONFIRMATION TRACKING
  // ─────────────────────────────────────────────────────────────
  describe('4. Fulfilment and Confirmation Tracking', () => {
    it('tracks fulfillment and recipient confirmation lifecycle through to completion', async () => {
      const coordinator = {
        id: 'pmc-coord-01',
        role: 'DISASTER_COORDINATOR',
        jurisdictionId: 'mh-pune-pmc',
      };
      const fieldWorker = {
        id: 'field-worker-01',
        role: 'FIELD_WORKER',
        jurisdictionId: 'mh-pune-pmc',
      };
      const verifier = {
        id: 'verif-officer-01',
        role: 'VERIFICATION_OFFICER',
        jurisdictionId: 'mh-pune-pmc',
      };

      // 1. Create Need
      const need = await resourceMatchingService.createNeedRequest(
        {
          title: 'Drinking water crates for 50 evacuees',
          needType: NEED_TYPES.DRINKING_WATER,
          quantity: 50,
          unit: 'LITERS',
          location: {
            latitude: 18.5160,
            longitude: 73.8420,
            jurisdictionId: 'mh-pune-pmc',
          },
        },
        fieldWorker
      );

      // 2. Coordinator Accepts Assignment
      const accepted = await resourceMatchingService.acceptAssignment(
        need.id,
        {
          resourceId: 'res-pune-relief-deccan',
          assignedQuantity: 50,
          notes: 'Approved 50L dispatch from Deccan Gymkhana Depot.',
        },
        coordinator
      );
      const asgnId = accepted.assignment.id;
      expect(accepted.need.status).toBe(NEED_STATUS.ASSIGNMENT_ACCEPTED);

      // 3. Field Worker Fulfills Assignment
      const fulfilled = await resourceMatchingService.fulfillAssignment(
        asgnId,
        { notes: 'Delivered 50L water bottles to on-site evacuee group.' },
        fieldWorker
      );
      expect(fulfilled.assignment.status).toBe(ASSIGNMENT_STATUS.FULFILLED);
      expect(fulfilled.need.status).toBe(NEED_STATUS.FULFILLED);
      expect(fulfilled.assignment.fulfilledBy.id).toBe('field-worker-01');

      // 4. Recipient / Verification Officer Confirms Fulfillment
      const confirmed = await resourceMatchingService.confirmAssignment(
        asgnId,
        {
          notes: 'Residents confirmed safe receipt of clean water supplies.',
          feedbackRating: 5,
        },
        verifier
      );
      expect(confirmed.assignment.status).toBe(ASSIGNMENT_STATUS.CONFIRMED);
      expect(confirmed.need.status).toBe(NEED_STATUS.CONFIRMED);
      expect(confirmed.assignment.confirmedBy.id).toBe('verif-officer-01');
      expect(confirmed.assignment.feedbackRating).toBe(5);
      expect(confirmed.assignment.history).toHaveLength(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. JURISDICTION SCOPING & ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────
  describe('5. Jurisdiction Scoping & Access Control', () => {
    it('denies cross-jurisdiction assignment acceptance when admin is scoped to another ULB', async () => {
      const pcmcAdmin = {
        id: 'pcmc-admin-01',
        role: 'DISTRICT_ULB_ADMIN',
        jurisdictionId: 'mh-pune-pcmc', // PCMC
      };

      // Attempt to manage a Pune PMC need
      await expect(
        resourceMatchingService.acceptAssignment(
          'need-pune-vitthalwadi-boat-01', // mh-pune-pmc
          { resourceId: 'res-pune-rescue-boat-fleet' },
          pcmcAdmin
        )
      ).rejects.toThrow(/Cross-jurisdiction access denied/);
    });

    it('allows DISASTER_COORDINATOR and PLATFORM_SUPER_ADMIN across multiple jurisdictions', async () => {
      const superAdmin = {
        id: 'super-01',
        role: 'PLATFORM_SUPER_ADMIN',
        jurisdictionId: 'mh-pune-pcmc',
      };

      const result = await resourceMatchingService.getNeedRequestById(
        'need-pune-vitthalwadi-shelter-01',
        superAdmin
      );
      expect(result.need.id).toBe('need-pune-vitthalwadi-shelter-01');
    });

    it('filters need request listings to user jurisdiction for restricted roles', async () => {
      const pcmcWorker = {
        id: 'worker-pcmc-01',
        role: 'FIELD_WORKER',
        jurisdictionId: 'mh-pune-pcmc',
      };

      const result = await resourceMatchingService.listNeedRequests({}, pcmcWorker);
      expect(result.needs.every((n) => n.location.jurisdictionId === 'mh-pune-pcmc')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. REST API ROUTER INTEGRATION (/resource-matching)
  // ─────────────────────────────────────────────────────────────
  describe('6. REST API Router Integration (/resource-matching)', () => {
    it('GET /resource-matching/needs returns needs list and statutory notice', async () => {
      const res = await request(app)
        .get('/resource-matching/needs')
        .set('x-user-id', 'admin-01')
        .set('x-user-role', 'PLATFORM_SUPER_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.needs.length).toBeGreaterThanOrEqual(4);
      expect(res.body.statutoryNotice).toBe(DISASTER_RESOURCE_MATCHING_DISCLAIMER);
    });

    it('POST /resource-matching/needs creates a new need request with 201', async () => {
      const res = await request(app)
        .post('/resource-matching/needs')
        .set('x-user-id', 'citizen-02')
        .set('x-user-role', 'CITIZEN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          title: 'Tarpaulins needed for roof leak in community hall',
          needType: NEED_TYPES.SHELTER_ACCOMMODATION,
          quantity: 20,
          unit: 'TARPAULINS',
          location: {
            latitude: 18.4900,
            longitude: 73.8340,
            jurisdictionId: 'mh-pune-pmc',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^need-/);
      expect(res.body.status).toBe(NEED_STATUS.OPEN_PENDING);
    });

    it('GET /resource-matching/needs/:id/matches returns deterministic ranked matches', async () => {
      const res = await request(app)
        .get('/resource-matching/needs/need-pune-vitthalwadi-shelter-01/matches')
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR');

      expect(res.status).toBe(200);
      expect(res.body.needId).toBe('need-pune-vitthalwadi-shelter-01');
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0].resourceId).toBe('res-pune-shelter-vitthalwadi');
      expect(res.body.matches[0].matchScore).toBeGreaterThan(80.0);
    });

    it('POST /resource-matching/needs/:id/assign returns 403 when caller lacks matching:manage', async () => {
      const res = await request(app)
        .post('/resource-matching/needs/need-pune-vitthalwadi-boat-01/assign')
        .set('x-user-id', 'worker-01')
        .set('x-user-role', 'FIELD_WORKER') // lacks matching:manage
        .send({ resourceId: 'res-pune-rescue-boat-fleet' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/lacks 'matching:manage'/);
    });

    it('POST /resource-matching/needs/:id/assign succeeds for authorized coordinator', async () => {
      const res = await request(app)
        .post('/resource-matching/needs/need-pune-vitthalwadi-boat-01/assign')
        .set('x-user-id', 'coord-01')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          resourceId: 'res-pune-rescue-boat-fleet',
          assignedQuantity: 2,
          notes: 'Dispatched rescue boat crew via REST API.',
        });

      expect(res.status).toBe(200);
      expect(res.body.need.status).toBe(NEED_STATUS.ASSIGNMENT_ACCEPTED);
      expect(res.body.assignment.status).toBe(ASSIGNMENT_STATUS.ACCEPTED);
    });

    it('POST /resource-matching/assignments/:id/fulfill and confirm via REST endpoints', async () => {
      // Use existing accepted assignment from fixtures: asgn-pune-shelter-001
      const fulfillRes = await request(app)
        .post('/resource-matching/assignments/asgn-pune-shelter-001/fulfill')
        .set('x-user-id', 'worker-pmc-42')
        .set('x-user-role', 'FIELD_WORKER')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({ notes: 'Evacuees settled into Vitthalwadi shelter hall B.' });

      expect(fulfillRes.status).toBe(200);
      expect(fulfillRes.body.assignment.status).toBe(ASSIGNMENT_STATUS.FULFILLED);

      const confirmRes = await request(app)
        .post('/resource-matching/assignments/asgn-pune-shelter-001/confirm')
        .set('x-user-id', 'citizen-992')
        .set('x-user-role', 'CITIZEN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          notes: 'Family safely housed and served dinner. Very grateful.',
          feedbackRating: 5,
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.assignment.status).toBe(ASSIGNMENT_STATUS.CONFIRMED);
      expect(confirmRes.body.assignment.feedbackRating).toBe(5);
    });
  });
});
