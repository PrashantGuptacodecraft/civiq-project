/**
 * Disaster Resource & Shelter Service
 * Phase 64: Build resource and shelter registry
 *
 * Implements:
 * - Verified resource records for emergency shelters, medical camps, relief centers, vehicles, volunteers
 * - Rigorous capacity tracking with source attribution and timestamped audit history
 * - Jurisdiction-scoped authorization and access controls (PMC, PCMC, etc.)
 * - Geospatial proximity lookup for nearest available shelters with open capacity
 */

import {
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  VERIFICATION_STATUS,
  CAPACITY_UPDATE_SOURCE,
  DISASTER_RESOURCE_DISCLAIMER,
} from './resource.types.js';
import { SEEDED_DISASTER_RESOURCES } from './resource.fixtures.js';
import { getPermissionsForRole } from '../../../../shared/auth/rbac.js';

export class ResourceService {
  constructor() {
    this.resources = new Map();
    this.sequenceCounter = 100;
    this.init();
  }

  /**
   * Initializes store with seeded realistic disaster resource records.
   */
  init() {
    this.resources.clear();
    this.sequenceCounter = 100;

    for (const fixture of SEEDED_DISASTER_RESOURCES) {
      const copy = JSON.parse(JSON.stringify(fixture));
      this.resources.set(copy.id, copy);
    }
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.init();
  }

  /**
   * Creates a new verified disaster resource or shelter record.
   *
   * @param {Object} data - Resource data
   * @param {Object} userContext - Caller identity and authorization context
   * @returns {Promise<Object>} Created resource record
   */
  async createResource(data = {}, userContext = {}) {
    // 1. Authorization & Role Verification
    this._enforceAuthorization(userContext, 'resources:write');

    // 2. Validate Title
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (title.length < 5) {
      const err = new Error('Resource title is required and must be at least 5 characters.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Validate Resource Type
    if (!data.resourceType || !Object.values(RESOURCE_TYPES).includes(data.resourceType)) {
      const err = new Error(
        `Invalid resourceType '${data.resourceType}'. Valid types: ${Object.values(RESOURCE_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Validate Location and Jurisdiction
    if (!data.location || typeof data.location.latitude !== 'number' || typeof data.location.longitude !== 'number') {
      const err = new Error('location with latitude and longitude numbers is required.');
      err.statusCode = 400;
      throw err;
    }

    const jurisdictionId = data.jurisdictionId || data.location?.jurisdictionId || 'mh-pune-pmc';

    // 5. Enforce Jurisdiction Scoping
    this._enforceJurisdictionAccess(userContext, jurisdictionId);

    // 6. Validate and Initialize Capacity Tracking
    const totalCapacity = Number(data.capacity?.totalCapacity ?? data.totalCapacity ?? 100);
    const currentOccupancy = Number(data.capacity?.currentOccupancy ?? data.currentOccupancy ?? 0);

    if (totalCapacity < 0 || currentOccupancy < 0) {
      const err = new Error('Capacity numbers cannot be negative.');
      err.statusCode = 400;
      throw err;
    }

    const availableCapacity = Math.max(0, totalCapacity - currentOccupancy);
    const occupancyPercentage =
      totalCapacity > 0 ? Number(((currentOccupancy / totalCapacity) * 100).toFixed(1)) : 0.0;

    // Determine initial operational status based on capacity
    let status = data.status || RESOURCE_STATUS.ACTIVE_OPERATIONAL;
    if (availableCapacity === 0 && totalCapacity > 0) {
      status = RESOURCE_STATUS.AT_FULL_CAPACITY;
    } else if (occupancyPercentage >= 80.0) {
      status = RESOURCE_STATUS.NEARING_CAPACITY;
    }

    const now = new Date().toISOString();
    const updateSource = data.capacity?.updateSource || CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION;

    this.sequenceCounter += 1;
    const year = new Date().getFullYear();
    const id = data.id || `res-${data.resourceType.toLowerCase().replace(/_/g, '-')}-${Date.now()}`;
    const resourceNumber = `RES-${year}-${String(this.sequenceCounter).padStart(4, '0')}`;

    const resource = {
      id,
      resourceNumber,
      title,
      description: data.description || '',
      resourceType: data.resourceType,
      status,
      verificationStatus: data.verificationStatus || VERIFICATION_STATUS.VERIFIED_OFFICIAL,
      verifiedBy: {
        agency: data.verifiedBy?.agency || userContext.organizationName || 'District Disaster Management Authority (DDMA)',
        officerId: userContext.id || 'system-admin',
        verifiedAt: now,
      },
      jurisdictionId,
      ward: data.ward || data.location?.ward || 'General Ward',
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address || 'Designated Shelter Location',
        landmark: data.location.landmark || null,
      },
      capacity: {
        totalCapacity,
        currentOccupancy,
        availableCapacity,
        occupancyPercentage,
        unit: data.capacity?.unit || 'PERSONS',
        lastUpdatedAt: now,
        updatedBy: { id: userContext.id || 'system', role: userContext.role || 'COORDINATOR' },
        updateSource,
      },
      capacityHistory: [
        {
          timestamp: now,
          previousOccupancy: 0,
          newOccupancy: currentOccupancy,
          updatedBy: { id: userContext.id || 'system', role: userContext.role || 'COORDINATOR' },
          updateSource,
          notes: data.initialNotes || 'Initial resource registration and capacity baseline established.',
        },
      ],
      facilities: Array.isArray(data.facilities) ? data.facilities : [],
      contact: {
        coordinatorName: data.contact?.coordinatorName || 'Shelter Duty Officer',
        contactPhoneMasked: this._maskPhoneNumber(data.contact?.phone || data.contact?.contactPhoneMasked),
      },
      statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
      createdAt: now,
      lastUpdatedAt: now,
    };

    this.resources.set(id, resource);
    return resource;
  }

  /**
   * Retrieves a resource by ID.
   */
  async getResourceById(id) {
    return this.resources.get(id) || null;
  }

  /**
   * Lists resources with filtering and jurisdiction scoping.
   *
   * @param {Object} filter - Filter criteria
   * @param {Object} userContext - Caller context
   * @returns {Promise<Array<Object>>} List of resources
   */
  async listResources(filter = {}, userContext = null) {
    let list = Array.from(this.resources.values());

    // Jurisdiction Scoping: If user is scoped to a jurisdiction and not an admin across jurisdictions
    if (userContext?.jurisdictionId && this._isRestrictedToOwnJurisdiction(userContext.role)) {
      list = list.filter((r) => r.jurisdictionId === userContext.jurisdictionId);
    } else if (filter.jurisdictionId) {
      list = list.filter((r) => r.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.resourceType) {
      list = list.filter((r) => r.resourceType === filter.resourceType);
    }

    if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    if (filter.ward) {
      list = list.filter((r) => r.ward === filter.ward);
    }

    if (filter.hasAvailableCapacity !== undefined) {
      const boolVal = filter.hasAvailableCapacity === true || filter.hasAvailableCapacity === 'true';
      list = list.filter((r) => (boolVal ? r.capacity.availableCapacity > 0 : r.capacity.availableCapacity === 0));
    }

    return list;
  }

  /**
   * Updates capacity for a resource with mandatory source attribution and timestamping.
   *
   * @param {string} id - Resource ID
   * @param {Object} updateData - Capacity update fields
   * @param {Object} userContext - Caller context
   * @returns {Promise<Object>} Updated resource record
   */
  async updateResourceCapacity(id, updateData = {}, userContext = {}) {
    // 1. Authorization Check
    this._enforceAuthorization(userContext, 'resources:write');

    const resource = this.resources.get(id);
    if (!resource) {
      const err = new Error(`Resource with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Jurisdiction Scoping Check
    this._enforceJurisdictionAccess(userContext, resource.jurisdictionId);

    // 3. Validate Occupancy & Capacity Inputs
    const previousOccupancy = resource.capacity.currentOccupancy;
    const newOccupancy =
      updateData.currentOccupancy !== undefined
        ? Number(updateData.currentOccupancy)
        : previousOccupancy;

    const newTotalCapacity =
      updateData.totalCapacity !== undefined
        ? Number(updateData.totalCapacity)
        : resource.capacity.totalCapacity;

    if (newOccupancy < 0 || newTotalCapacity < 0) {
      const err = new Error('Capacity and occupancy cannot be negative.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Validate Source Attribution (Phase 64 requirement)
    const updateSource = updateData.updateSource || CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION;
    if (!Object.values(CAPACITY_UPDATE_SOURCE).includes(updateSource)) {
      const err = new Error(
        `Invalid updateSource '${updateSource}'. Valid sources: ${Object.values(CAPACITY_UPDATE_SOURCE).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const availableCapacity = Math.max(0, newTotalCapacity - newOccupancy);
    const occupancyPercentage =
      newTotalCapacity > 0 ? Number(((newOccupancy / newTotalCapacity) * 100).toFixed(1)) : 0.0;

    // Automatic status recalculation
    let status = resource.status;
    if (status !== RESOURCE_STATUS.DECOMMISSIONED && status !== RESOURCE_STATUS.STANDBY) {
      if (availableCapacity === 0 && newTotalCapacity > 0) {
        status = RESOURCE_STATUS.AT_FULL_CAPACITY;
      } else if (occupancyPercentage >= 80.0) {
        status = RESOURCE_STATUS.NEARING_CAPACITY;
      } else {
        status = RESOURCE_STATUS.ACTIVE_OPERATIONAL;
      }
    }

    const now = new Date().toISOString();

    // 5. Update State
    resource.capacity.totalCapacity = newTotalCapacity;
    resource.capacity.currentOccupancy = newOccupancy;
    resource.capacity.availableCapacity = availableCapacity;
    resource.capacity.occupancyPercentage = occupancyPercentage;
    resource.capacity.lastUpdatedAt = now;
    resource.capacity.updatedBy = { id: userContext.id || 'unknown', role: userContext.role || 'WORKER' };
    resource.capacity.updateSource = updateSource;
    resource.status = status;
    resource.lastUpdatedAt = now;

    // 6. Record Timestamped History Checkpoint
    resource.capacityHistory.push({
      timestamp: now,
      previousOccupancy,
      newOccupancy,
      updatedBy: { id: userContext.id || 'unknown', role: userContext.role || 'WORKER' },
      updateSource,
      notes: updateData.notes || `Capacity updated from ${previousOccupancy} to ${newOccupancy} via ${updateSource}.`,
    });

    return resource;
  }

  /**
   * Finds nearest resources (e.g. shelters) from a given GPS coordinate.
   *
   * @param {number} latitude - Target latitude
   * @param {number} longitude - Target longitude
   * @param {Object} options - Search options { resourceType, hasAvailableCapacity, maxDistanceKm }
   * @returns {Promise<Array<Object>>} Sorted list of nearby resources with distanceKm
   */
  async findNearbyResources(latitude, longitude, options = {}) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const err = new Error('latitude and longitude numbers are required.');
      err.statusCode = 400;
      throw err;
    }

    let candidates = Array.from(this.resources.values());

    if (options.resourceType) {
      candidates = candidates.filter((r) => r.resourceType === options.resourceType);
    }

    if (options.hasAvailableCapacity === true || options.hasAvailableCapacity === 'true') {
      candidates = candidates.filter((r) => r.capacity.availableCapacity > 0);
    }

    const maxDistance = options.maxDistanceKm ? Number(options.maxDistanceKm) : 50;

    const withDistance = candidates
      .map((r) => {
        const distanceKm = this._computeHaversineDistanceKm(
          latitude,
          longitude,
          r.location.latitude,
          r.location.longitude
        );
        return {
          ...r,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      })
      .filter((r) => r.distanceKm <= maxDistance)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
  }

  /**
   * Aggregates situational resource availability metrics for a jurisdiction or overall.
   */
  async getResourceSummary(jurisdictionId = null) {
    let list = Array.from(this.resources.values());

    if (jurisdictionId) {
      list = list.filter((r) => r.jurisdictionId === jurisdictionId);
    }

    const shelters = list.filter((r) => r.resourceType === RESOURCE_TYPES.EMERGENCY_SHELTER);
    const medicalCamps = list.filter((r) => r.resourceType === RESOURCE_TYPES.MEDICAL_CAMP);
    const vehicles = list.filter((r) => r.resourceType === RESOURCE_TYPES.EMERGENCY_VEHICLE);
    const reliefCenters = list.filter((r) => r.resourceType === RESOURCE_TYPES.RELIEF_DISTRIBUTION_CENTER);
    const volunteerTeams = list.filter((r) => r.resourceType === RESOURCE_TYPES.VOLUNTEER_TEAM);

    let totalShelterCapacity = 0;
    let totalShelterOccupancy = 0;
    let sheltersAtCapacityCount = 0;

    for (const s of shelters) {
      totalShelterCapacity += s.capacity.totalCapacity;
      totalShelterOccupancy += s.capacity.currentOccupancy;
      if (s.status === RESOURCE_STATUS.AT_FULL_CAPACITY) {
        sheltersAtCapacityCount++;
      }
    }

    const availableShelterBeds = Math.max(0, totalShelterCapacity - totalShelterOccupancy);
    const overallOccupancyRate =
      totalShelterCapacity > 0 ? Number(((totalShelterOccupancy / totalShelterCapacity) * 100).toFixed(1)) : 0.0;

    return {
      jurisdictionId: jurisdictionId || 'ALL_JURISDICTIONS',
      totalResourcesTracked: list.length,
      shelterMetrics: {
        totalSheltersCount: shelters.length,
        totalCapacityBeds: totalShelterCapacity,
        currentOccupancyBeds: totalShelterOccupancy,
        availableBeds: availableShelterBeds,
        occupancyPercentage: overallOccupancyRate,
        sheltersAtCapacityCount,
      },
      countsByType: {
        shelters: shelters.length,
        medicalCamps: medicalCamps.length,
        emergencyVehicles: vehicles.length,
        reliefDistributionCenters: reliefCenters.length,
        volunteerTeams: volunteerTeams.length,
      },
      statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Authorization & Jurisdiction Scoping Helpers
  // ─────────────────────────────────────────────────────────────

  _enforceAuthorization(userContext, requiredPermission) {
    if (!userContext || !userContext.role) {
      const err = new Error('Authentication required: user role missing.');
      err.statusCode = 401;
      throw err;
    }

    const permissions = getPermissionsForRole(userContext.role);
    if (!permissions.includes(requiredPermission)) {
      const err = new Error(
        `Access denied: role '${userContext.role}' lacks '${requiredPermission}' permission.`
      );
      err.statusCode = 403;
      throw err;
    }
  }

  _enforceJurisdictionAccess(userContext, targetJurisdictionId) {
    if (!userContext || !userContext.jurisdictionId) return;

    // Super admins, national, state admins, and disaster coordinators have cross-jurisdiction authority
    const crossJurisdictionRoles = [
      'PLATFORM_SUPER_ADMIN',
      'NATIONAL_ADMIN',
      'STATE_ADMIN',
      'DISASTER_COORDINATOR',
    ];

    if (crossJurisdictionRoles.includes(userContext.role)) {
      return;
    }

    if (userContext.jurisdictionId !== targetJurisdictionId) {
      const err = new Error(
        `Cross-jurisdiction access denied: user is scoped to '${userContext.jurisdictionId}', but resource belongs to '${targetJurisdictionId}'.`
      );
      err.statusCode = 403;
      throw err;
    }
  }

  _isRestrictedToOwnJurisdiction(role) {
    const unrestricted = [
      'PLATFORM_SUPER_ADMIN',
      'NATIONAL_ADMIN',
      'STATE_ADMIN',
      'DISASTER_COORDINATOR',
      'CITIZEN',
      'AUDITOR',
    ];
    return !unrestricted.includes(role);
  }

  _computeHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _maskPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '+91-98XXXX0000';
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.length < 7) return '***';
    return `${cleaned.slice(0, 3)}XXXX${cleaned.slice(-4)}`;
  }
}

export const resourceService = new ResourceService();
