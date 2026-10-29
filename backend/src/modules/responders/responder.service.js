/**
 * Emergency Responder & Agency Role Model Service
 * Phase 59: Add emergency responder/agency role model
 *
 * Implements authorized responder organizations, scoped access control,
 * sensitive incident access audit logging, and advisory dispatch recommendations.
 */

import {
  RESPONDER_AGENCY_TYPES,
  RESPONDER_ROLES,
  RESPONDER_STATUS,
  DISPATCH_RECOMMENDATION_STATUS,
  SENSITIVE_ACCESS_ACTIONS,
  DISPATCH_ADVISORY_DISCLAIMER,
} from './responder.types.js';
import {
  SEEDED_RESPONDER_AGENCIES,
  SEEDED_RESPONDERS,
} from './responder.fixtures.js';
import { dispatchRecommendationEngine } from './dispatch-recommendation.engine.js';
import { getPermissionsForRole } from '@civiq/auth';

export class ResponderService {
  constructor() {
    this.agencies = new Map();
    this.responders = new Map();
    this.dispatchRecommendations = new Map();
    this.accessAuditLogs = [];
    this.init();
  }

  /**
   * Initializes store with seeded authorized agencies and responders.
   */
  init() {
    this.agencies.clear();
    this.responders.clear();
    this.dispatchRecommendations.clear();
    this.accessAuditLogs = [];

    for (const agency of SEEDED_RESPONDER_AGENCIES) {
      this.agencies.set(agency.id, JSON.parse(JSON.stringify(agency)));
    }

    for (const responder of SEEDED_RESPONDERS) {
      this.responders.set(responder.id, JSON.parse(JSON.stringify(responder)));
    }
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.init();
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Authorized Agency Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Registers a new authorized responder agency.
   */
  async registerAgency(data = {}) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
      const err = new Error('Agency name is required and must be at least 3 characters.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.agencyType || !Object.values(RESPONDER_AGENCY_TYPES).includes(data.agencyType)) {
      const err = new Error(
        `Invalid agencyType '${data.agencyType}'. Valid types: ${Object.values(RESPONDER_AGENCY_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    if (!data.jurisdictionId) {
      const err = new Error('jurisdictionId is required to register an authorized responder agency.');
      err.statusCode = 400;
      throw err;
    }

    const id = data.id || `org-${data.agencyType.toLowerCase().replace(/_/g, '-')}-${Date.now()}`;
    const agency = {
      id,
      name: data.name.trim(),
      agencyType: data.agencyType,
      jurisdictionId: data.jurisdictionId,
      headquartersAddress: data.headquartersAddress || null,
      controlRoomHotline: data.controlRoomHotline || '112',
      officialCadIdentifier: data.officialCadIdentifier || `CAD-${id.toUpperCase()}`,
      coverageWards: Array.isArray(data.coverageWards) ? data.coverageWards : ['*'],
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      verifiedAt: new Date().toISOString(),
      isActive: Boolean(data.isActive !== undefined ? data.isActive : true),
      registeredAt: new Date().toISOString(),
    };

    this.agencies.set(id, agency);
    return agency;
  }

  /**
   * Retrieves an agency by ID.
   */
  async getAgency(id) {
    return this.agencies.get(id) || null;
  }

  /**
   * Lists agencies with optional filtering.
   */
  async listAgencies(filter = {}) {
    let list = Array.from(this.agencies.values());

    if (filter.jurisdictionId) {
      list = list.filter((a) => a.jurisdictionId === filter.jurisdictionId || a.coverageWards?.includes('*'));
    }

    if (filter.agencyType) {
      list = list.filter((a) => a.agencyType === filter.agencyType);
    }

    if (filter.isActive !== undefined) {
      const activeBool = filter.isActive === true || filter.isActive === 'true';
      list = list.filter((a) => a.isActive === activeBool);
    }

    return list;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Responder Personnel Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Registers an authorized first responder.
   */
  async registerResponder(data = {}) {
    if (!data.name || typeof data.name !== 'string') {
      const err = new Error('Responder name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.badgeNumber) {
      const err = new Error('Official badgeNumber is required for responder accountability.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.agencyId || !this.agencies.has(data.agencyId)) {
      const err = new Error(`Valid agencyId is required. Agency '${data.agencyId}' not found.`);
      err.statusCode = 400;
      throw err;
    }

    const agency = this.agencies.get(data.agencyId);
    const id = data.id || `resp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const responder = {
      id,
      userId: data.userId || `user-${id}`,
      name: data.name.trim(),
      badgeNumber: data.badgeNumber.trim(),
      role: data.role || RESPONDER_ROLES.FIRST_RESPONDER,
      agencyId: agency.id,
      jurisdictionId: agency.jurisdictionId,
      contactNumber: data.contactNumber || null,
      status: data.status || RESPONDER_STATUS.AVAILABLE_ON_DUTY,
      assignedWards: Array.isArray(data.assignedWards) ? data.assignedWards : ['*'],
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : agency.capabilities,
      registeredAt: new Date().toISOString(),
      lastStatusUpdate: new Date().toISOString(),
    };

    this.responders.set(id, responder);
    return responder;
  }

  /**
   * Retrieves responder by ID.
   */
  async getResponderById(id) {
    return this.responders.get(id) || null;
  }

  /**
   * Retrieves responder by user ID.
   */
  async getResponderByUserId(userId) {
    for (const responder of this.responders.values()) {
      if (responder.userId === userId) {
        return responder;
      }
    }
    return null;
  }

  /**
   * Lists responders with filtering.
   */
  async listResponders(filter = {}) {
    let list = Array.from(this.responders.values());

    if (filter.agencyId) {
      list = list.filter((r) => r.agencyId === filter.agencyId);
    }

    if (filter.jurisdictionId) {
      list = list.filter((r) => r.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.role) {
      list = list.filter((r) => r.role === filter.role);
    }

    if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    return list;
  }

  /**
   * Updates responder operational status (e.g. available, dispatched, on-scene).
   */
  async updateResponderStatus(id, newStatus, location = null) {
    const responder = this.responders.get(id);
    if (!responder) {
      const err = new Error(`Responder with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!Object.values(RESPONDER_STATUS).includes(newStatus)) {
      const err = new Error(
        `Invalid responder status '${newStatus}'. Valid statuses: ${Object.values(RESPONDER_STATUS).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    responder.status = newStatus;
    responder.lastStatusUpdate = new Date().toISOString();
    if (location) {
      responder.currentLocation = location;
    }

    return responder;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Scoped Access Control & Sensitive Incident Access
  // ─────────────────────────────────────────────────────────────

  /**
   * Evaluates scoped access permission and audits any access to sensitive data.
   *
   * @param {Object} actor - The user/responder requesting access
   * @param {Object} incident - The canonical incident record
   * @param {string} requestedLevel - 'SUMMARY' | 'OPERATIONAL' | 'SENSITIVE_PII'
   * @param {Object} context - Request metadata (justification, ipAddress, userAgent)
   * @returns {Object} { allowed, incident, redactionsApplied, auditLogged }
   */
  async authorizeIncidentAccess(actor, incident, requestedLevel = 'SUMMARY', context = {}) {
    if (!incident) {
      const err = new Error('Incident is required for access evaluation.');
      err.statusCode = 400;
      throw err;
    }

    const incidentJurisdiction = incident.location?.jurisdictionId || 'mh-pune-pmc';
    const actorRole = actor?.roleAssignments?.[0]?.role || actor?.role || 'CITIZEN';
    const actorJurisdiction = actor?.roleAssignments?.[0]?.jurisdictionId || actor?.jurisdictionId || null;
    const actorAgencyId = actor?.agencyId || null;

    // Check if actor has platform-wide super access
    const isSuperAdmin = actorRole === 'PLATFORM_SUPER_ADMIN';

    // Check jurisdiction match
    const jurisdictionMatches = isSuperAdmin || !actorJurisdiction || actorJurisdiction === incidentJurisdiction;

    // Permissions check
    const perms = actor?.permissions || getPermissionsForRole(actorRole);
    const hasSensitivePerm = perms.includes('incidents:read:sensitive');
    const isResponderRole = [
      RESPONDER_ROLES.FIRST_RESPONDER,
      RESPONDER_ROLES.EMERGENCY_DISPATCHER,
      RESPONDER_ROLES.AGENCY_ADMIN,
      'FIRST_RESPONDER',
      'TRAFFIC_POLICE',
      'POLICE',
      'FIRE',
    ].includes(actorRole);

    // If requesting sensitive access (victim medical notes, unmasked reporter Aadhaar/phone, raw graphic photos)
    if (requestedLevel === 'SENSITIVE_PII') {
      const isAuthorizedForSensitive = (isSuperAdmin || (hasSensitivePerm && jurisdictionMatches && isResponderRole));

      if (!isAuthorizedForSensitive) {
        // Audit unauthorized attempt
        this.auditSensitiveAccess({
          actor,
          incidentId: incident.id,
          jurisdictionId: incidentJurisdiction,
          accessAction: SENSITIVE_ACCESS_ACTIONS.VIEW_SENSITIVE_PII,
          justification: context.justification || 'Unauthorized sensitive access attempt',
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent || null,
          granted: false,
        });

        const err = new Error(
          `Access Denied: Role '${actorRole}' with jurisdiction '${actorJurisdiction}' is not authorized to inspect sensitive incident PII or evidence.`
        );
        err.statusCode = 403;
        throw err;
      }

      // Authorized sensitive access -> Log mandatory compliance audit record
      const auditEntry = this.auditSensitiveAccess({
        actor,
        incidentId: incident.id,
        jurisdictionId: incidentJurisdiction,
        accessAction: context.accessAction || SENSITIVE_ACCESS_ACTIONS.VIEW_SENSITIVE_PII,
        justification: context.justification || 'Emergency triage and scene coordination',
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        granted: true,
      });

      return {
        allowed: true,
        incident: JSON.parse(JSON.stringify(incident)), // Unredacted view
        redactionsApplied: false,
        auditLogged: true,
        auditEntryId: auditEntry.id,
      };
    }

    // Default: Redacted / Safe view for public or standard viewers
    const safeIncident = JSON.parse(JSON.stringify(incident));
    if (safeIncident.reporter) {
      safeIncident.reporter.contactNumber = '***-***-****';
      if (safeIncident.reporter.reporterType === 'CITIZEN') {
        safeIncident.reporter.name = 'Citizen Reporter';
      }
    }
    if (safeIncident.casualties && safeIncident.casualties.medicalNotes) {
      safeIncident.casualties.medicalNotes = '[REDACTED FOR PRIVACY]';
    }
    if (Array.isArray(safeIncident.evidence)) {
      safeIncident.evidence = safeIncident.evidence.map((ev) => {
        if (ev.isGraphicOrSensitive) {
          return {
            ...ev,
            mediaUrl: 'https://civiq.local/media/redacted-graphic-warning.png',
            isContentRestricted: true,
          };
        }
        return ev;
      });
    }

    safeIncident.isSensitiveDataRedacted = true;

    return {
      allowed: true,
      incident: safeIncident,
      redactionsApplied: true,
      auditLogged: false,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Sensitive Access Audit Trail
  // ─────────────────────────────────────────────────────────────

  /**
   * Logs an immutable sensitive access audit record.
   */
  auditSensitiveAccess(params = {}) {
    const {
      actor,
      incidentId,
      jurisdictionId,
      accessAction = SENSITIVE_ACCESS_ACTIONS.VIEW_SENSITIVE_PII,
      justification = 'Operational necessity',
      ipAddress = null,
      userAgent = null,
      granted = true,
    } = params;

    const auditEntry = {
      id: `AUDIT-SENS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      incidentId: incidentId || 'UNKNOWN_INCIDENT',
      jurisdictionId: jurisdictionId || 'mh-pune-pmc',
      actor: {
        id: actor?.id || actor?.userId || 'anonymous-actor',
        name: actor?.name || 'Unknown User',
        role: actor?.roleAssignments?.[0]?.role || actor?.role || 'UNKNOWN_ROLE',
        badgeNumber: actor?.badgeNumber || null,
        agencyId: actor?.agencyId || null,
      },
      action: accessAction,
      justification,
      ipAddress,
      userAgent,
      granted,
    };

    this.accessAuditLogs.push(auditEntry);
    return auditEntry;
  }

  /**
   * Retrieves audit trail for a specific incident or jurisdiction.
   */
  async getSensitiveAccessAuditTrail(incidentId = null, filter = {}) {
    let logs = [...this.accessAuditLogs];

    if (incidentId) {
      logs = logs.filter((log) => log.incidentId === incidentId);
    }

    if (filter.jurisdictionId) {
      logs = logs.filter((log) => log.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.actorId) {
      logs = logs.filter((log) => log.actor.id === filter.actorId);
    }

    return logs;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Dispatch Recommendation Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Computes multi-agency dispatch recommendations for an incident.
   */
  async createDispatchRecommendation(incident) {
    if (!incident) {
      const err = new Error('Incident is required to generate dispatch recommendations.');
      err.statusCode = 400;
      throw err;
    }

    const jurisdictionAgencies = await this.listAgencies({
      jurisdictionId: incident.location?.jurisdictionId,
      isActive: true,
    });

    const recommendation = dispatchRecommendationEngine.evaluate(incident, jurisdictionAgencies);
    this.dispatchRecommendations.set(recommendation.recommendationId, recommendation);

    return recommendation;
  }

  /**
   * Retrieves a recommendation by ID.
   */
  async getDispatchRecommendation(id) {
    return this.dispatchRecommendations.get(id) || null;
  }

  /**
   * Updates recommendation operational status (e.g. transmitted to CAD, acknowledged by responder).
   */
  async updateDispatchRecommendationStatus(id, newStatus, updateContext = {}) {
    const rec = this.dispatchRecommendations.get(id);
    if (!rec) {
      const err = new Error(`Dispatch recommendation with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!Object.values(DISPATCH_RECOMMENDATION_STATUS).includes(newStatus)) {
      const err = new Error(
        `Invalid recommendation status '${newStatus}'. Valid statuses: ${Object.values(
          DISPATCH_RECOMMENDATION_STATUS
        ).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    rec.status = newStatus;
    rec.lastUpdatedAt = new Date().toISOString();
    rec.updatedBy = updateContext.actor ? {
      id: updateContext.actor.id || updateContext.actor.userId,
      role: updateContext.actor.role,
      name: updateContext.actor.name,
      badgeNumber: updateContext.actor.badgeNumber || null,
    } : null;

    if (updateContext.notes) {
      rec.updateNotes = updateContext.notes;
    }

    return rec;
  }

  /**
   * Lists recommendations by incident or status.
   */
  async listDispatchRecommendations(filter = {}) {
    let list = Array.from(this.dispatchRecommendations.values());

    if (filter.incidentId) {
      list = list.filter((r) => r.incidentId === filter.incidentId);
    }

    if (filter.jurisdictionId) {
      list = list.filter((r) => r.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    return list;
  }
}

export const responderService = new ResponderService();
