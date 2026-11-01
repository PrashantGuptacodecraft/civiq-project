/**
 * Disaster Need-to-Resource Matching Service
 * Phase 65: Build need-to-resource matching
 *
 * Implements:
 * - Deterministic, explainable matching across distance, capacity, type, and operational status
 * - Complete request lifecycle: OPEN_PENDING -> MATCH_RECOMMENDED -> ASSIGNMENT_ACCEPTED -> FULFILLED -> CONFIRMED
 * - Strict coordinator acceptance gate (only authorized disaster coordinators/ULB admins can accept assignments)
 * - Fulfilment and confirmation audit tracking
 * - Jurisdiction scoping and role-based access control
 */

import { getPermissionsForRole } from '../../../../shared/auth/rbac.js';
import { resourceService } from '../resources/index.js';
import {
  NEED_TYPES,
  NEED_STATUS,
  ASSIGNMENT_STATUS,
  CAPACITY_FIT,
  DISASTER_RESOURCE_MATCHING_DISCLAIMER,
} from './resource-matching.types.js';
import {
  SEEDED_NEED_REQUESTS,
  SEEDED_ASSIGNMENTS,
} from './resource-matching.fixtures.js';

const EARTH_RADIUS_KM = 6371.0;

// Need-to-Resource Type Compatibility Matrix
const TYPE_COMPATIBILITY_MATRIX = {
  BOAT_EVACUATION: {
    EMERGENCY_VEHICLE: 1.0,
    VOLUNTEER_TEAM: 0.8,
    RELIEF_SUPPLY_INVENTORY: 0.3,
  },
  SHELTER_ACCOMMODATION: {
    EMERGENCY_SHELTER: 1.0,
    RELIEF_DISTRIBUTION_CENTER: 0.3,
  },
  DRINKING_WATER: {
    RELIEF_DISTRIBUTION_CENTER: 1.0,
    RELIEF_SUPPLY_INVENTORY: 0.95,
    EMERGENCY_SHELTER: 0.7,
  },
  FOOD_RATIONS: {
    RELIEF_DISTRIBUTION_CENTER: 1.0,
    RELIEF_SUPPLY_INVENTORY: 0.95,
    EMERGENCY_SHELTER: 0.7,
  },
  MEDICAL_AID: {
    MEDICAL_CAMP: 1.0,
    EMERGENCY_SHELTER: 0.6,
  },
  EQUIPMENT_REPAIR: {
    VOLUNTEER_TEAM: 1.0,
    RELIEF_SUPPLY_INVENTORY: 0.8,
  },
  VOLUNTEER_SUPPORT: {
    VOLUNTEER_TEAM: 1.0,
    EMERGENCY_SHELTER: 0.5,
  },
};

const STATUS_SCORES = {
  ACTIVE_OPERATIONAL: 1.0,
  NEARING_CAPACITY: 0.8,
  MOBILIZING: 0.6,
  STANDBY: 0.5,
  AT_FULL_CAPACITY: 0.1,
  DECOMMISSIONED: 0.0,
};

const VERIFICATION_SCORES = {
  VERIFIED_OFFICIAL: 1.0,
  PROVISIONALLY_REGISTERED: 0.75,
  EXPIRED_UNVERIFIED: 0.2,
};

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180.0;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1.0 - a)));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

export class ResourceMatchingService {
  constructor() {
    this._needs = new Map();
    this._assignments = new Map();
    this._weights = {
      type: 0.35,
      distance: 0.30,
      capacity: 0.25,
      status: 0.07,
      verification: 0.03,
    };
    this._initializeFromFixtures();
  }

  _initializeFromFixtures() {
    this._needs.clear();
    this._assignments.clear();

    for (const need of SEEDED_NEED_REQUESTS) {
      this._needs.set(need.id, JSON.parse(JSON.stringify(need)));
    }
    for (const asgn of SEEDED_ASSIGNMENTS) {
      this._assignments.set(asgn.id, JSON.parse(JSON.stringify(asgn)));
    }
  }

  reset() {
    this._initializeFromFixtures();
  }

  // ─── 1. DETERMINISTIC MATCHING ALGORITHM ───

  computeMatches(need, candidateResources, options = {}) {
    const maxDistanceKm = options.maxDistanceKm || 50.0;
    const results = [];

    for (const candidate of candidateResources) {
      const resId = candidate.id;
      const title = candidate.title || candidate.name || 'Unnamed Resource';
      const resType = candidate.resourceType || 'OTHER';
      const status = candidate.status || 'ACTIVE_OPERATIONAL';
      const verifStatus = candidate.verificationStatus || 'PROVISIONALLY_REGISTERED';

      const cLat = candidate.location?.latitude ?? candidate.latitude ?? 0;
      const cLon = candidate.location?.longitude ?? candidate.longitude ?? 0;
      const availCap = candidate.capacity?.availableCapacity ?? candidate.availableCapacity ?? 0;

      // 1. Type compatibility
      const compatMap = TYPE_COMPATIBILITY_MATRIX[need.needType] || {};
      let typeScore = compatMap[resType] || 0.0;
      if (need.needType === resType) typeScore = 1.0;

      // 2. Distance calculation
      const distKm = haversineDistanceKm(
        need.location.latitude,
        need.location.longitude,
        cLat,
        cLon
      );

      let distScore = 1.0;
      if (distKm <= 1.0) {
        distScore = 1.0;
      } else if (distKm >= maxDistanceKm) {
        distScore = 0.0;
      } else {
        distScore = Math.max(0.0, 1.0 - (distKm - 1.0) / Math.max(1.0, maxDistanceKm - 1.0));
      }
      distScore = Math.round(distScore * 10000) / 10000;

      // 3. Capacity fit
      const reqQty = Math.max(0.1, Number(need.quantity) || 1.0);
      let capScore = 0.0;
      let capFit = CAPACITY_FIT.ZERO_CAPACITY;

      if (availCap >= reqQty) {
        capScore = 1.0;
        capFit = Math.abs(availCap - reqQty) < 0.001
          ? CAPACITY_FIT.EXACT_FIT
          : CAPACITY_FIT.EXCEEDS_REQUIREMENT;
      } else if (availCap > 0) {
        capScore = Math.round((availCap / reqQty) * 0.75 * 10000) / 10000;
        capFit = CAPACITY_FIT.PARTIAL_FIT;
      } else {
        capScore = 0.0;
        capFit = CAPACITY_FIT.ZERO_CAPACITY;
      }

      // 4. Status score
      const statusScore = STATUS_SCORES[status] ?? 0.5;

      // 5. Verification score
      const verifScore = VERIFICATION_SCORES[verifStatus] ?? 0.5;

      // Ineligibility assessment
      const ineligibility = [];
      if (status === 'DECOMMISSIONED') {
        ineligibility.push('Resource is decommissioned and cannot accept assignments.');
      }
      if (distKm > maxDistanceKm) {
        ineligibility.push(
          `Distance (${distKm} km) exceeds maximum search radius (${maxDistanceKm} km).`
        );
      }
      if (typeScore <= 0.0) {
        ineligibility.push(
          `Resource category '${resType}' is incompatible with requested need '${need.needType}'.`
        );
      }
      if (capFit === CAPACITY_FIT.ZERO_CAPACITY && status === 'AT_FULL_CAPACITY') {
        ineligibility.push('Resource has zero available capacity and is at full capacity.');
      }

      const isEligible = ineligibility.length === 0;

      // Weighted overall score (0 - 100)
      const rawScore =
        this._weights.type * typeScore +
        this._weights.distance * distScore +
        this._weights.capacity * capScore +
        this._weights.status * statusScore +
        this._weights.verification * verifScore;

      let matchScore = Math.round(Math.max(0.0, Math.min(100.0, rawScore * 100.0)) * 10) / 10;
      if (!isEligible) {
        matchScore = Math.round(matchScore * 0.2 * 10) / 10;
      }

      const factors = [
        {
          factor: 'type_compatibility',
          score: typeScore,
          weight: this._weights.type,
          weightedScore: Math.round(this._weights.type * typeScore * 1000) / 10,
          detail: `Compatibility between ${need.needType} and ${resType}: ${typeScore.toFixed(2)}`,
        },
        {
          factor: 'distance',
          score: distScore,
          weight: this._weights.distance,
          weightedScore: Math.round(this._weights.distance * distScore * 1000) / 10,
          detail: `${distKm} km from need location (score: ${distScore.toFixed(2)})`,
        },
        {
          factor: 'capacity_fit',
          score: capScore,
          weight: this._weights.capacity,
          weightedScore: Math.round(this._weights.capacity * capScore * 1000) / 10,
          detail: `${capFit}: ${availCap} available vs ${reqQty} ${need.unit} requested`,
        },
        {
          factor: 'operational_status',
          score: statusScore,
          weight: this._weights.status,
          weightedScore: Math.round(this._weights.status * statusScore * 1000) / 10,
          detail: `Operational readiness: ${status} (score: ${statusScore.toFixed(2)})`,
        },
        {
          factor: 'verification',
          score: verifScore,
          weight: this._weights.verification,
          weightedScore: Math.round(this._weights.verification * verifScore * 1000) / 10,
          detail: `Registry status: ${verifStatus} (score: ${verifScore.toFixed(2)})`,
        },
      ];

      let summary = `${title} (${resType}) is ${distKm} km away with ${availCap} ${need.unit} available capacity. Match score: ${matchScore}/100 (${capFit}).`;
      if (!isEligible) {
        summary += ` Ineligible: ${ineligibility.join('; ')}`;
      }

      results.push({
        resourceId: resId,
        title,
        resourceType: resType,
        matchScore,
        rank: 1,
        distanceKm: distKm,
        capacityFit: capFit,
        isEligible,
        ineligibilityReasons: ineligibility,
        factorBreakdown: factors,
        recommendationSummary: summary,
      });
    }

    // Sort: eligible first, then matchScore desc, then distanceKm asc
    results.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.distanceKm - b.distanceKm;
    });

    // Assign 1-based ranks
    results.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return results;
  }

  // ─── 2. NEED REQUESTS LIFECYCLE ───

  async createNeedRequest(payload, userContext = null) {
    this._enforceAuthorization(userContext, 'matching:write');

    if (!payload.title || payload.title.trim().length < 5) {
      const err = new Error('Need title must be at least 5 characters long.');
      err.status = 400;
      throw err;
    }
    if (!payload.needType || !Object.values(NEED_TYPES).includes(payload.needType)) {
      const err = new Error(`Invalid needType. Must be one of: ${Object.values(NEED_TYPES).join(', ')}`);
      err.status = 400;
      throw err;
    }
    if (!payload.location || typeof payload.location.latitude !== 'number' || typeof payload.location.longitude !== 'number') {
      const err = new Error('Location with valid latitude and longitude numbers is required.');
      err.status = 400;
      throw err;
    }

    const jurisdictionId = payload.location.jurisdictionId || userContext?.jurisdictionId || 'mh-pune-pmc';
    this._enforceJurisdiction(userContext, jurisdictionId);

    const needId = `need-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const needNumber = `NEED-2026-${String(this._needs.size + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newNeed = {
      id: needId,
      needNumber,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      needType: payload.needType,
      severity: payload.severity || 'HIGH_URGENT',
      status: NEED_STATUS.OPEN_PENDING,
      quantity: Number(payload.quantity) || 1,
      unit: payload.unit || 'UNITS',
      location: {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        address: payload.location.address || '',
        ward: payload.location.ward || '',
        jurisdictionId,
      },
      contact: {
        contactName: payload.contact?.contactName || '',
        contactPhoneMasked: payload.contact?.contactPhoneMasked || '+91-XXXXXXXXXX',
      },
      sourceReportId: payload.sourceReportId || null,
      disasterId: payload.disasterId || null,
      requestedBy: {
        id: userContext?.id || 'anonymous',
        role: userContext?.role || 'CITIZEN',
        requestedAt: now,
      },
      activeAssignmentId: null,
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
      createdAt: now,
      lastUpdatedAt: now,
    };

    this._needs.set(needId, newNeed);
    return JSON.parse(JSON.stringify(newNeed));
  }

  async listNeedRequests(filters = {}, userContext = null) {
    this._enforceAuthorization(userContext, 'matching:read');

    let list = Array.from(this._needs.values());

    // Jurisdiction filtering
    if (this._isRestrictedRole(userContext?.role) && userContext?.jurisdictionId) {
      list = list.filter((n) => n.location.jurisdictionId === userContext.jurisdictionId);
    } else if (filters.jurisdictionId) {
      list = list.filter((n) => n.location.jurisdictionId === filters.jurisdictionId);
    }

    if (filters.status) {
      list = list.filter((n) => n.status === filters.status);
    }
    if (filters.needType) {
      list = list.filter((n) => n.needType === filters.needType);
    }
    if (filters.disasterId) {
      list = list.filter((n) => n.disasterId === filters.disasterId);
    }

    return {
      needs: JSON.parse(JSON.stringify(list)),
      totalCount: list.length,
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  async getNeedRequestById(id, userContext = null) {
    this._enforceAuthorization(userContext, 'matching:read');
    const need = this._needs.get(id);
    if (!need) {
      const err = new Error(`Need request '${id}' not found.`);
      err.status = 404;
      throw err;
    }

    let activeAssignment = null;
    if (need.activeAssignmentId && this._assignments.has(need.activeAssignmentId)) {
      activeAssignment = JSON.parse(JSON.stringify(this._assignments.get(need.activeAssignmentId)));
    }

    return {
      need: JSON.parse(JSON.stringify(need)),
      activeAssignment,
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  async getRecommendedMatches(needId, options = {}, userContext = null) {
    this._enforceAuthorization(userContext, 'matching:read');
    const need = this._needs.get(needId);
    if (!need) {
      const err = new Error(`Need request '${needId}' not found.`);
      err.status = 404;
      throw err;
    }

    // Fetch verified candidates from ResourceService
    const resourcesResult = await resourceService.listResources({}, userContext);
    const candidateResources = Array.isArray(resourcesResult)
      ? resourcesResult
      : (resourcesResult?.resources || []);

    const matches = this.computeMatches(need, candidateResources, options);

    // If status is OPEN_PENDING, transition to MATCH_RECOMMENDED
    if (need.status === NEED_STATUS.OPEN_PENDING) {
      need.status = NEED_STATUS.MATCH_RECOMMENDED;
      need.lastUpdatedAt = new Date().toISOString();
      this._needs.set(needId, need);
    }

    const eligibleCount = matches.filter((m) => m.isEligible).length;

    return {
      needId,
      needType: need.needType,
      totalCandidatesEvaluated: matches.length,
      eligibleCandidatesCount: eligibleCount,
      matches,
      isAuthoritative: false,
      disclaimer: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  // ─── 3. COORDINATOR ACCEPTANCE GATE & ASSIGNMENT LIFECYCLE ───

  async acceptAssignment(needId, assignmentData, userContext) {
    // STRICT GATE: Authorized disaster coordinator / ULB admin acceptance
    this._enforceAuthorization(userContext, 'matching:manage');

    const need = this._needs.get(needId);
    if (!need) {
      const err = new Error(`Need request '${needId}' not found.`);
      err.status = 404;
      throw err;
    }

    this._enforceJurisdiction(userContext, need.location.jurisdictionId);

    const resourceId = assignmentData.resourceId;
    if (!resourceId) {
      const err = new Error('resourceId is required to accept an assignment.');
      err.status = 400;
      throw err;
    }

    const targetResource = await resourceService.getResourceById(resourceId);
    if (!targetResource) {
      const err = new Error(`Target resource '${resourceId}' not found.`);
      err.status = 404;
      throw err;
    }
    if (targetResource.status === 'DECOMMISSIONED') {
      const err = new Error('Cannot assign to a decommissioned resource.');
      err.status = 400;
      throw err;
    }

    const assignedQty = Number(assignmentData.assignedQuantity) || need.quantity;
    const now = new Date().toISOString();
    const asgnId = `asgn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const asgnNumber = `ASGN-2026-${String(this._assignments.size + 1).padStart(4, '0')}`;

    const distKm = haversineDistanceKm(
      need.location.latitude,
      need.location.longitude,
      targetResource.location.latitude,
      targetResource.location.longitude
    );

    const newAssignment = {
      id: asgnId,
      assignmentNumber: asgnNumber,
      needId,
      resourceId,
      resourceTitle: targetResource.title,
      resourceType: targetResource.resourceType,
      assignedQuantity: assignedQty,
      unit: need.unit,
      status: ASSIGNMENT_STATUS.ACCEPTED,
      matchScore: assignmentData.matchScore ?? 90.0,
      distanceKm: distKm,
      assignedBy: {
        id: userContext.id,
        role: userContext.role,
        acceptedAt: now,
      },
      coordinatorNotes: assignmentData.notes || 'Assignment accepted by authorized disaster coordinator.',
      history: [
        {
          status: ASSIGNMENT_STATUS.ACCEPTED,
          timestamp: now,
          action: 'Authorized disaster coordinator accepted assignment',
          performedBy: { id: userContext.id, role: userContext.role },
        },
      ],
      createdAt: now,
      lastUpdatedAt: now,
    };

    // Update Need record
    need.status = NEED_STATUS.ASSIGNMENT_ACCEPTED;
    need.activeAssignmentId = asgnId;
    need.lastUpdatedAt = now;
    this._needs.set(needId, need);

    // Save Assignment record
    this._assignments.set(asgnId, newAssignment);

    // Optionally update resource occupancy
    try {
      if (targetResource.capacity && targetResource.capacity.totalCapacity > 0) {
        const newOccupancy = (targetResource.capacity.currentOccupancy || 0) + assignedQty;
        await resourceService.updateResourceCapacity(
          resourceId,
          {
            currentOccupancy: newOccupancy,
            updateSource: 'SHELTER_MANAGER_UPDATE',
            notes: `Auto-capacity reservation for assignment ${asgnNumber} (${need.title})`,
          },
          userContext
        );
      }
    } catch {
      // Non-blocking capacity adjustment
    }

    return {
      need: JSON.parse(JSON.stringify(need)),
      assignment: JSON.parse(JSON.stringify(newAssignment)),
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  async fulfillAssignment(assignmentId, fulfillmentData = {}, userContext) {
    this._enforceAuthorization(userContext, 'matching:write');

    const asgn = this._assignments.get(assignmentId);
    if (!asgn) {
      const err = new Error(`Assignment '${assignmentId}' not found.`);
      err.status = 404;
      throw err;
    }

    const need = this._needs.get(asgn.needId);
    if (need) {
      this._enforceJurisdiction(userContext, need.location.jurisdictionId);
    }

    const now = new Date().toISOString();
    asgn.status = ASSIGNMENT_STATUS.FULFILLED;
    asgn.fulfilledBy = {
      id: userContext.id,
      role: userContext.role,
      fulfilledAt: now,
    };
    asgn.fulfilmentNotes = fulfillmentData.notes || 'Relief assistance fulfilled on-site.';
    asgn.history.push({
      status: ASSIGNMENT_STATUS.FULFILLED,
      timestamp: now,
      action: 'Assignment fulfilled by responder/field worker',
      performedBy: { id: userContext.id, role: userContext.role },
    });
    asgn.lastUpdatedAt = now;
    this._assignments.set(assignmentId, asgn);

    if (need) {
      need.status = NEED_STATUS.FULFILLED;
      need.lastUpdatedAt = now;
      this._needs.set(need.id, need);
    }

    return {
      assignment: JSON.parse(JSON.stringify(asgn)),
      need: need ? JSON.parse(JSON.stringify(need)) : null,
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  async confirmAssignment(assignmentId, confirmationData = {}, userContext) {
    this._enforceAuthorization(userContext, 'matching:read');

    const asgn = this._assignments.get(assignmentId);
    if (!asgn) {
      const err = new Error(`Assignment '${assignmentId}' not found.`);
      err.status = 404;
      throw err;
    }

    const need = this._needs.get(asgn.needId);
    if (need) {
      this._enforceJurisdiction(userContext, need.location.jurisdictionId);
    }

    const now = new Date().toISOString();
    asgn.status = ASSIGNMENT_STATUS.CONFIRMED;
    asgn.confirmedBy = {
      id: userContext.id,
      role: userContext.role,
      confirmedAt: now,
    };
    asgn.confirmationNotes = confirmationData.notes || 'Recipient/inspector confirmed satisfactory fulfillment.';
    asgn.feedbackRating = confirmationData.feedbackRating || 5;
    asgn.history.push({
      status: ASSIGNMENT_STATUS.CONFIRMED,
      timestamp: now,
      action: 'Fulfillment confirmed by recipient or verification official',
      performedBy: { id: userContext.id, role: userContext.role },
    });
    asgn.lastUpdatedAt = now;
    this._assignments.set(assignmentId, asgn);

    if (need) {
      need.status = NEED_STATUS.CONFIRMED;
      need.lastUpdatedAt = now;
      this._needs.set(need.id, need);
    }

    return {
      assignment: JSON.parse(JSON.stringify(asgn)),
      need: need ? JSON.parse(JSON.stringify(need)) : null,
      statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    };
  }

  async getAssignmentById(id, userContext = null) {
    this._enforceAuthorization(userContext, 'matching:read');
    const asgn = this._assignments.get(id);
    if (!asgn) {
      const err = new Error(`Assignment '${id}' not found.`);
      err.status = 404;
      throw err;
    }
    return JSON.parse(JSON.stringify(asgn));
  }

  // ─── 4. SECURITY & JURISDICTION CHECKS ───

  _enforceAuthorization(userContext, requiredPermission) {
    if (!userContext || !userContext.role) {
      const err = new Error('Authentication required.');
      err.status = 401;
      throw err;
    }

    const permissions = getPermissionsForRole(userContext.role);
    if (!permissions.includes(requiredPermission)) {
      const err = new Error(
        `Access denied: role '${userContext.role}' lacks '${requiredPermission}' permission.`
      );
      err.status = 403;
      throw err;
    }
  }

  _enforceJurisdiction(userContext, targetJurisdictionId) {
    if (!userContext || !userContext.jurisdictionId || !targetJurisdictionId) return;

    const crossJurisdictionAllowedRoles = [
      'PLATFORM_SUPER_ADMIN',
      'NATIONAL_ADMIN',
      'STATE_ADMIN',
      'DISASTER_COORDINATOR',
    ];

    if (crossJurisdictionAllowedRoles.includes(userContext.role)) {
      return;
    }

    if (userContext.jurisdictionId !== targetJurisdictionId) {
      const err = new Error(
        `Cross-jurisdiction access denied: user belongs to '${userContext.jurisdictionId}', but resource/need is in '${targetJurisdictionId}'.`
      );
      err.status = 403;
      throw err;
    }
  }

  _isRestrictedRole(role) {
    const multiJurisdictionRoles = [
      'PLATFORM_SUPER_ADMIN',
      'NATIONAL_ADMIN',
      'STATE_ADMIN',
      'DISASTER_COORDINATOR',
    ];
    return !multiJurisdictionRoles.includes(role);
  }
}

export const resourceMatchingService = new ResourceMatchingService();
