/**
 * Phase 64 Exit Checks: Disaster Resource & Shelter Registry Tests
 *
 * Validates:
 * 1. Verified resource modeling (shelters, medical camps, relief centers, vehicles, volunteers)
 * 2. Capacity tracking with source attribution, timestamping, and history checkpoints
 * 3. Automatic status transition (ACTIVE_OPERATIONAL -> NEARING_CAPACITY -> AT_FULL_CAPACITY)
 * 4. Authorization enforcement (resources:write, resources:manage) and rejection of unauthorized callers
 * 5. Jurisdiction scoping enforcement (PMC vs PCMC boundaries and cross-jurisdiction denial)
 * 6. Geospatial proximity lookup for nearest available shelters with free capacity
 * 7. Situational resource summary metrics
 * 8. REST API endpoints (/resources, /resources/nearby, /resources/:id/capacity, /resources/summary)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  resourceService,
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  VERIFICATION_STATUS,
  CAPACITY_UPDATE_SOURCE,
  DISASTER_RESOURCE_DISCLAIMER,
} from './index.js';

describe('Phase 64: Disaster Resource & Shelter Registry', () => {
  beforeEach(() => {
    resourceService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Resource Modeling & Baseline Initialization
  // ─────────────────────────────────────────────────────────────
  describe('1. Resource Modeling & Baseline Initialization', () => {
    it('initializes with seeded verified shelters, relief centers, medical camps, and fleets', async () => {
      const resources = await resourceService.listResources();
      expect(resources.length).toBeGreaterThanOrEqual(6);

      const shelter = resources.find((r) => r.id === 'res-pune-shelter-vitthalwadi');
      expect(shelter).toBeDefined();
      expect(shelter.resourceType).toBe(RESOURCE_TYPES.EMERGENCY_SHELTER);
      expect(shelter.verificationStatus).toBe(VERIFICATION_STATUS.VERIFIED_OFFICIAL);
      expect(shelter.capacity.totalCapacity).toBe(350);
      expect(shelter.capacity.currentOccupancy).toBe(280);
      expect(shelter.capacity.availableCapacity).toBe(70);
      expect(shelter.status).toBe(RESOURCE_STATUS.NEARING_CAPACITY); // 280/350 = 80%
      expect(shelter.jurisdictionId).toBe('mh-pune-pmc');
      expect(shelter.ward).toBe('Ward 9 - Sinhagad Road');
      expect(shelter.facilities).toContain('DRINKING_WATER_TANKERS');
    });

    it('creates a new verified shelter with initialized capacity tracking and source', async () => {
      const coordinatorContext = {
        id: 'usr-coord-01',
        role: 'DISASTER_COORDINATOR',
        jurisdictionId: 'mh-pune-pmc',
      };

      const newShelter = await resourceService.createResource(
        {
          title: 'Narayan Peth Community Hall Evacuation Shelter',
          description: 'Emergency shelter for displaced residents along Mutha causeway.',
          resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
          jurisdictionId: 'mh-pune-pmc',
          ward: 'Ward 12 - Shivaji Nagar',
          location: {
            latitude: 18.5180,
            longitude: 73.8500,
            address: 'Narayan Peth Municipal Hall, Pune',
          },
          capacity: {
            totalCapacity: 200,
            currentOccupancy: 30,
            unit: 'PERSONS',
            updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
          },
          facilities: ['DRINKING_WATER', 'BLANKETS', 'GENERATOR_POWER'],
        },
        coordinatorContext
      );

      expect(newShelter.id).toBeDefined();
      expect(newShelter.resourceNumber).toMatch(/^RES-\d{4}-\d{4}$/);
      expect(newShelter.capacity.totalCapacity).toBe(200);
      expect(newShelter.capacity.currentOccupancy).toBe(30);
      expect(newShelter.capacity.availableCapacity).toBe(170);
      expect(newShelter.capacity.occupancyPercentage).toBe(15.0);
      expect(newShelter.status).toBe(RESOURCE_STATUS.ACTIVE_OPERATIONAL);
      expect(newShelter.capacityHistory).toHaveLength(1);
      expect(newShelter.capacityHistory[0].updateSource).toBe(CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION);
      expect(newShelter.statutoryNotice).toBe(DISASTER_RESOURCE_DISCLAIMER);
    });

    it('rejects resource creation with title too short or missing coordinates', async () => {
      const coordinatorContext = { id: 'usr-coord', role: 'DISASTER_COORDINATOR' };

      await expect(
        resourceService.createResource({ title: 'Hall', resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER }, coordinatorContext)
      ).rejects.toThrow(/at least 5 characters/);

      await expect(
        resourceService.createResource(
          {
            title: 'Valid Emergency Shelter Title',
            resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
            location: { latitude: 'invalid', longitude: 73.8 },
          },
          coordinatorContext
        )
      ).rejects.toThrow(/latitude and longitude numbers/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Capacity Tracking with Source Attribution & Timestamps
  // ─────────────────────────────────────────────────────────────
  describe('2. Capacity Tracking with Source & Timestamps', () => {
    it('updates occupancy, recalculates available capacity, and tracks source audit trail', async () => {
      const shelterId = 'res-pune-shelter-vitthalwadi';
      const initial = await resourceService.getResourceById(shelterId);
      const initialHistoryLength = initial.capacityHistory.length;

      const userContext = {
        id: 'usr-shelter-mgr-01',
        role: 'FIELD_WORKER',
        jurisdictionId: 'mh-pune-pmc',
      };

      // 1. Evacuee surge arrives: occupancy goes to 320 / 350 (91.4% -> NEARING_CAPACITY)
      const updated = await resourceService.updateResourceCapacity(
        shelterId,
        {
          currentOccupancy: 320,
          updateSource: CAPACITY_UPDATE_SOURCE.SHELTER_MANAGER_UPDATE,
          notes: 'Evacuation wave 3 admitted from Pu La Deshpande riverbank.',
        },
        userContext
      );

      expect(updated.capacity.currentOccupancy).toBe(320);
      expect(updated.capacity.availableCapacity).toBe(30);
      expect(updated.capacity.occupancyPercentage).toBe(91.4);
      expect(updated.status).toBe(RESOURCE_STATUS.NEARING_CAPACITY);
      expect(updated.capacityHistory.length).toBe(initialHistoryLength + 1);

      const latestLog = updated.capacityHistory[updated.capacityHistory.length - 1];
      expect(latestLog.previousOccupancy).toBe(280);
      expect(latestLog.newOccupancy).toBe(320);
      expect(latestLog.updateSource).toBe(CAPACITY_UPDATE_SOURCE.SHELTER_MANAGER_UPDATE);
      expect(latestLog.updatedBy.id).toBe('usr-shelter-mgr-01');
      expect(latestLog.timestamp).toBeDefined();

      // 2. Shelter fills completely: occupancy reaches 350 / 350 (100% -> AT_FULL_CAPACITY)
      const full = await resourceService.updateResourceCapacity(
        shelterId,
        {
          currentOccupancy: 350,
          updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
          notes: 'All 350 beds fully occupied. Directing further evacuees to Parvati post.',
        },
        userContext
      );

      expect(full.capacity.availableCapacity).toBe(0);
      expect(full.capacity.occupancyPercentage).toBe(100.0);
      expect(full.status).toBe(RESOURCE_STATUS.AT_FULL_CAPACITY);
    });

    it('rejects capacity update with invalid source or negative occupancy', async () => {
      const userContext = { id: 'usr-coord', role: 'DISASTER_COORDINATOR' };

      await expect(
        resourceService.updateResourceCapacity(
          'res-pune-shelter-vitthalwadi',
          { currentOccupancy: -5, updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION },
          userContext
        )
      ).rejects.toThrow(/cannot be negative/);

      await expect(
        resourceService.updateResourceCapacity(
          'res-pune-shelter-vitthalwadi',
          { currentOccupancy: 100, updateSource: 'UNVERIFIED_WHATSAPP_RUMOR' },
          userContext
        )
      ).rejects.toThrow(/Invalid updateSource/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Authorization & Role Enforcement
  // ─────────────────────────────────────────────────────────────
  describe('3. Authorization Enforcement (RBAC)', () => {
    it('denies resource creation and capacity updates to unauthorized roles (e.g. CITIZEN)', async () => {
      const citizenContext = { id: 'usr-citizen-42', role: 'CITIZEN' };

      await expect(
        resourceService.createResource(
          {
            title: 'Citizen Unauthorized Shelter',
            resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
            location: { latitude: 18.5, longitude: 73.8 },
          },
          citizenContext
        )
      ).rejects.toThrow(/Access denied: role 'CITIZEN' lacks 'resources:write'/);

      await expect(
        resourceService.updateResourceCapacity(
          'res-pune-shelter-vitthalwadi',
          { currentOccupancy: 200, updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION },
          citizenContext
        )
      ).rejects.toThrow(/Access denied: role 'CITIZEN' lacks 'resources:write'/);
    });

    it('allows DISTRICT_ULB_ADMIN and DISASTER_COORDINATOR to update resources', async () => {
      const adminContext = {
        id: 'usr-admin-pune',
        role: 'DISTRICT_ULB_ADMIN',
        jurisdictionId: 'mh-pune-pmc',
      };

      const updated = await resourceService.updateResourceCapacity(
        'res-pune-shelter-vitthalwadi',
        { currentOccupancy: 250, updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION },
        adminContext
      );

      expect(updated.capacity.currentOccupancy).toBe(250);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Jurisdiction Scoping
  // ─────────────────────────────────────────────────────────────
  describe('4. Jurisdiction Scoping', () => {
    it('denies cross-jurisdiction updates when user is scoped to a different ULB', async () => {
      // PMC Administrator attempting to modify PCMC shelter in Bhosari
      const pmcAdminContext = {
        id: 'usr-pmc-admin',
        role: 'DISTRICT_ULB_ADMIN',
        jurisdictionId: 'mh-pune-pmc',
      };

      await expect(
        resourceService.updateResourceCapacity(
          'res-pcmc-shelter-bhosari', // Belonging to 'mh-pune-pcmc'
          { currentOccupancy: 90, updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION },
          pmcAdminContext
        )
      ).rejects.toThrow(/Cross-jurisdiction access denied/);
    });

    it('allows DISASTER_COORDINATOR and PLATFORM_SUPER_ADMIN across multiple jurisdictions', async () => {
      const multiDistrictCoordinator = {
        id: 'usr-regional-coord',
        role: 'DISASTER_COORDINATOR',
        jurisdictionId: 'mh-pune-pmc',
      };

      // Coordinator can manage PCMC resource during regional emergency
      const updated = await resourceService.updateResourceCapacity(
        'res-pcmc-shelter-bhosari',
        { currentOccupancy: 50, updateSource: CAPACITY_UPDATE_SOURCE.DDMA_FEED },
        multiDistrictCoordinator
      );

      expect(updated.capacity.currentOccupancy).toBe(50);
    });

    it('filters resource listing to user jurisdiction when restricted role requests it', async () => {
      const pcmcOfficer = {
        id: 'usr-pcmc-worker',
        role: 'FIELD_WORKER',
        jurisdictionId: 'mh-pune-pcmc',
      };

      const list = await resourceService.listResources({}, pcmcOfficer);
      expect(list.length).toBeGreaterThanOrEqual(1);
      list.forEach((r) => {
        expect(r.jurisdictionId).toBe('mh-pune-pcmc');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Geospatial Nearby Shelters Lookup
  // ─────────────────────────────────────────────────────────────
  describe('5. Geospatial Nearby Shelters Lookup', () => {
    it('finds nearest shelters to citizen GPS coordinate sorted by distance', async () => {
      // Point on Sinhagad Road near Vitthalwadi: [18.4900, 73.8320]
      const nearby = await resourceService.findNearbyResources(18.4900, 73.8320, {
        resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
        hasAvailableCapacity: true,
      });

      expect(nearby.length).toBeGreaterThanOrEqual(2);
      expect(nearby[0].id).toBe('res-pune-shelter-vitthalwadi');
      expect(nearby[0].distanceKm).toBeLessThan(1.0); // Less than 1km away!
      expect(nearby[0].capacity.availableCapacity).toBeGreaterThan(0);
      expect(nearby[0].distanceKm).toBeLessThanOrEqual(nearby[1].distanceKm);
    });

    it('excludes shelters at full capacity when hasAvailableCapacity is true', async () => {
      // Fill Vitthalwadi shelter to 100% capacity
      await resourceService.updateResourceCapacity(
        'res-pune-shelter-vitthalwadi',
        { currentOccupancy: 350, updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION },
        { id: 'usr-admin', role: 'DISASTER_COORDINATOR' }
      );

      const availableOnly = await resourceService.findNearbyResources(18.4900, 73.8320, {
        resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
        hasAvailableCapacity: true,
      });

      const vitthalwadi = availableOnly.find((r) => r.id === 'res-pune-shelter-vitthalwadi');
      expect(vitthalwadi).toBeUndefined(); // Excluded because availableCapacity === 0!
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Situational Resource Summary
  // ─────────────────────────────────────────────────────────────
  describe('6. Situational Resource Summary', () => {
    it('computes aggregated shelter and equipment metrics for a jurisdiction', async () => {
      const summary = await resourceService.getResourceSummary('mh-pune-pmc');

      expect(summary.jurisdictionId).toBe('mh-pune-pmc');
      expect(summary.shelterMetrics.totalSheltersCount).toBeGreaterThanOrEqual(1);
      expect(summary.shelterMetrics.totalCapacityBeds).toBeGreaterThanOrEqual(350);
      expect(summary.shelterMetrics.availableBeds).toBeGreaterThanOrEqual(70);
      expect(summary.countsByType.medicalCamps).toBeGreaterThanOrEqual(1);
      expect(summary.countsByType.emergencyVehicles).toBeGreaterThanOrEqual(1);
      expect(summary.statutoryNotice).toBe(DISASTER_RESOURCE_DISCLAIMER);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. REST API Endpoints (/resources)
  // ─────────────────────────────────────────────────────────────
  describe('7. REST API Endpoints (/resources)', () => {
    it('GET /resources returns all resources and statutory disclaimer', async () => {
      const res = await request(app).get('/resources');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(6);
      expect(res.body.disclaimer).toContain('CivIQ Disaster Resource & Shelter Notice');
    });

    it('GET /resources/nearby returns nearest shelters to coordinates', async () => {
      const res = await request(app)
        .get('/resources/nearby')
        .query({ lat: 18.4900, lng: 73.8320, resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resources.length).toBeGreaterThanOrEqual(1);
      expect(res.body.resources[0].distanceKm).toBeDefined();
    });

    it('GET /resources/summary returns situational metrics', async () => {
      const res = await request(app).get('/resources/summary').query({ jurisdictionId: 'mh-pune-pmc' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.shelterMetrics).toBeDefined();
    });

    it('GET /resources/:id returns resource with complete capacity history', async () => {
      const res = await request(app).get('/resources/res-pune-shelter-vitthalwadi');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resource.capacityHistory.length).toBeGreaterThanOrEqual(2);

      const res404 = await request(app).get('/resources/non-existent-res-id');
      expect(res404.status).toBe(404);
    });

    it('POST /resources creates resource when caller has resources:write permission', async () => {
      const res = await request(app)
        .post('/resources')
        .set('x-user-id', 'coord-test-01')
        .set('x-user-role', 'DISASTER_COORDINATOR')
        .set('x-jurisdiction-id', 'mh-pune-pmc')
        .send({
          title: 'Yerawada Municipal High School Relief Shelter',
          resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
          jurisdictionId: 'mh-pune-pmc',
          ward: 'Ward 2 - Yerawada',
          location: { latitude: 18.5500, longitude: 73.8900 },
          capacity: { totalCapacity: 250, currentOccupancy: 0 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.resource.capacity.availableCapacity).toBe(250);
    });

    it('POST /resources returns 403 when caller lacks resources:write permission', async () => {
      const res = await request(app)
        .post('/resources')
        .set('x-user-id', 'citizen-test')
        .set('x-user-role', 'CITIZEN')
        .send({
          title: 'Unauthorized Shelter Creation',
          resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
          location: { latitude: 18.55, longitude: 73.89 },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access denied');
    });

    it('PATCH /resources/:id/capacity updates capacity with source and timestamp', async () => {
      const res = await request(app)
        .patch('/resources/res-pune-shelter-vitthalwadi/capacity')
        .set('x-user-id', 'mgr-01')
        .set('x-user-role', 'FIELD_SUPERVISOR')
        .set('x-jurisdiction-id', 'mh-pune-pmc')
        .send({
          currentOccupancy: 295,
          updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
          notes: 'Midday headcount verified 295 evacuees present.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resource.capacity.currentOccupancy).toBe(295);
      expect(res.body.resource.capacity.updateSource).toBe(CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION);
    });
  });
});
