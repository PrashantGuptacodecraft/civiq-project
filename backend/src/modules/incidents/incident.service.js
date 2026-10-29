/**
 * Critical Incident & Accident Reporting Service
 * Phase 55: Build accident/incident reporting model
 * Phase 56: Build accident response workflow
 */

import {
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  VERIFICATION_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_HAZARDS,
  VEHICLE_TYPES,
  REPORTER_TYPES,
  INCIDENT_SOURCES,
  OFFICIAL_RESPONDER_AGENCIES,
  TIMELINE_EVENT_TYPES,
  INCIDENT_NOTIFICATION_TYPES,
  REDACTED_PII_VALUE,
  REDACTED_CONTACT_MASK,
  REDACTED_GRAPHIC_MEDIA,
} from './incident.types.js';
import {
  SYNTHETIC_INCIDENTS,
  SYNTHETIC_TIMELINES,
  SYNTHETIC_INCIDENT_NOTIFICATIONS,
} from './incident.fixtures.js';
import { getPermissionsForRole } from '@civiq/auth';

export class IncidentService {
  constructor() {
    this.incidents = new Map();
    this.timelines = new Map();
    this.notifications = new Map();
    this.auditLogs = [];
    this.sequenceCounter = 100;
    this.init();
  }

  /**
   * Initializes store with synthetic baseline incident fixtures, timelines, and notifications.
   */
  init() {
    this.incidents.clear();
    this.timelines.clear();
    this.notifications.clear();
    this.auditLogs = [];
    this.sequenceCounter = 100;

    for (const fixture of SYNTHETIC_INCIDENTS) {
      this.incidents.set(fixture.id, JSON.parse(JSON.stringify(fixture)));
    }

    for (const [id, events] of Object.entries(SYNTHETIC_TIMELINES)) {
      this.timelines.set(id, JSON.parse(JSON.stringify(events)));
    }

    for (const [id, notifs] of Object.entries(SYNTHETIC_INCIDENT_NOTIFICATIONS)) {
      this.notifications.set(id, JSON.parse(JSON.stringify(notifs)));
    }
  }

  /**
   * Resets repository for test isolation.
   */
  reset() {
    this.init();
  }

  /**
   * Helper to append a timeline event.
   */
  addTimelineEvent(incidentId, event) {
    if (!this.timelines.has(incidentId)) {
      this.timelines.set(incidentId, []);
    }
    this.timelines.get(incidentId).push(event);
  }

  /**
   * Helper to append an incident notification.
   */
  addNotification(incidentId, notification) {
    if (!this.notifications.has(incidentId)) {
      this.notifications.set(incidentId, []);
    }
    this.notifications.get(incidentId).push(notification);
  }

  /**
   * Checks if a user has permission to read sensitive accident/PII details.
   */
  canReadSensitiveDetails(user) {
    if (!user) return false;
    const userRole = user.roleAssignments?.[0]?.role || user.role;
    if (userRole === 'PLATFORM_SUPER_ADMIN') return true;

    const perms = user.permissions || (userRole ? getPermissionsForRole(userRole) : []);
    return perms.includes('incidents:read:sensitive');
  }

  /**
   * Checks if a user has permission to manage incident lifecycle status.
   * Authorized roles: Super Admin, ULB Admin, Disaster Coordinator, and First Responders.
   */
  canManageIncidents(user) {
    if (!user) return false;
    const userRole = user.roleAssignments?.[0]?.role || user.role;
    if (
      userRole === 'PLATFORM_SUPER_ADMIN' ||
      userRole === 'DISTRICT_ULB_ADMIN' ||
      userRole === 'DISASTER_COORDINATOR' ||
      userRole === 'FIRST_RESPONDER' ||
      userRole === 'TRAFFIC_POLICE' ||
      userRole === 'POLICE' ||
      userRole === 'FIRE'
    ) {
      return true;
    }

    const perms = user.permissions || (userRole ? getPermissionsForRole(userRole) : []);
    return perms.includes('incidents:manage');
  }

  /**
   * Redacts sensitive personal and graphic accident details for public or unauthorized viewers.
   */
  redactSensitiveIncidentDetails(incident) {
    const safe = JSON.parse(JSON.stringify(incident));

    // 1. Redact reporter PII
    if (safe.reporter) {
      safe.reporter.contactNumber = REDACTED_CONTACT_MASK;
      if (safe.reporter.reporterType === REPORTER_TYPES.CITIZEN) {
        safe.reporter.name = 'Citizen Reporter';
      }
    }

    // 2. Redact sensitive victim medical details
    if (safe.casualties && safe.casualties.medicalNotes) {
      safe.casualties.medicalNotes = REDACTED_PII_VALUE;
    }

    // 3. Restrict sensitive / graphic injury evidence from public view
    if (Array.isArray(safe.evidence)) {
      safe.evidence = safe.evidence.map((ev) => {
        if (ev.isGraphicOrSensitive) {
          return {
            ...ev,
            mediaUrl: REDACTED_GRAPHIC_MEDIA,
            isContentRestricted: true,
          };
        }
        return ev;
      });
    }

    safe.isSensitiveDataRedacted = true;
    return safe;
  }

  /**
   * Creates a new accident/incident report.
   */
  async createIncident(data = {}, options = {}) {
    const { user } = options;
    const now = new Date();

    // 1. Validate Title
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (title.length < 5) {
      const err = new Error('Incident title is required and must be at least 5 characters long.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate Incident Type
    if (!data.incidentType || !Object.values(INCIDENT_TYPES).includes(data.incidentType)) {
      const err = new Error(
        `Invalid incidentType '${data.incidentType}'. Valid types: ${Object.values(INCIDENT_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Validate Occurred At Timestamp
    if (!data.occurredAt) {
      const err = new Error('occurredAt timestamp is required.');
      err.statusCode = 400;
      throw err;
    }
    const occurredDate = new Date(data.occurredAt);
    if (isNaN(occurredDate.getTime())) {
      const err = new Error('Invalid occurredAt timestamp format.');
      err.statusCode = 400;
      throw err;
    }
    if (occurredDate.getTime() > now.getTime() + 60000) {
      const err = new Error('occurredAt cannot be in the future.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Validate Location Coordinates
    if (!data.location || typeof data.location !== 'object') {
      const err = new Error('Incident location object is required.');
      err.statusCode = 400;
      throw err;
    }
    const { latitude, longitude, jurisdictionId } = data.location;
    if (latitude === undefined || typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      const err = new Error('Valid latitude between -90 and 90 is required.');
      err.statusCode = 400;
      throw err;
    }
    if (longitude === undefined || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      const err = new Error('Valid longitude between -180 and 180 is required.');
      err.statusCode = 400;
      throw err;
    }
    if (!jurisdictionId || typeof jurisdictionId !== 'string' || !jurisdictionId.trim()) {
      const err = new Error('location.jurisdictionId is required.');
      err.statusCode = 400;
      throw err;
    }

    // 5. Validate and normalize Hazards
    let hazards = [INCIDENT_HAZARDS.NONE];
    if (Array.isArray(data.hazards) && data.hazards.length > 0) {
      for (const h of data.hazards) {
        if (!Object.values(INCIDENT_HAZARDS).includes(h)) {
          const err = new Error(`Invalid hazard '${h}'. Valid hazards: ${Object.values(INCIDENT_HAZARDS).join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
      }
      hazards = data.hazards;
    }

    // 6. Validate and normalize Casualties
    const casualtiesInput = data.casualties || {};
    const casualties = {
      hasCasualties: Boolean(
        casualtiesInput.hasCasualties ||
          (casualtiesInput.injuredCount || 0) > 0 ||
          (casualtiesInput.fatalitiesCount || 0) > 0 ||
          (casualtiesInput.trappedCount || 0) > 0
      ),
      injuredCount: Number(casualtiesInput.injuredCount || 0),
      fatalitiesCount: Number(casualtiesInput.fatalitiesCount || 0),
      trappedCount: Number(casualtiesInput.trappedCount || 0),
      requiresAmbulance: Boolean(casualtiesInput.requiresAmbulance || (casualtiesInput.injuredCount || 0) > 0),
      medicalNotes: casualtiesInput.medicalNotes || null,
    };

    // 7. Validate Vehicles Involved
    let vehiclesInvolved = [];
    if (Array.isArray(data.vehiclesInvolved)) {
      for (const v of data.vehiclesInvolved) {
        if (!Object.values(VEHICLE_TYPES).includes(v)) {
          const err = new Error(`Invalid vehicleType '${v}'.`);
          err.statusCode = 400;
          throw err;
        }
      }
      vehiclesInvolved = data.vehiclesInvolved;
    }

    // 8. Validate Evidence items
    const evidence = [];
    if (Array.isArray(data.evidence)) {
      for (let i = 0; i < data.evidence.length; i++) {
        const ev = data.evidence[i];
        if (!ev.mediaUrl) {
          const err = new Error(`Evidence item #${i + 1} requires mediaUrl.`);
          err.statusCode = 400;
          throw err;
        }
        evidence.push({
          id: ev.id || `ev-inc-${Date.now().toString(36)}-${i}`,
          mediaUrl: ev.mediaUrl,
          mediaType: ev.mediaType || 'IMAGE',
          caption: ev.caption || '',
          isGraphicOrSensitive: Boolean(ev.isGraphicOrSensitive),
          capturedAt: ev.capturedAt || now.toISOString(),
        });
      }
    }

    // 9. Determine / Infer Severity
    let severity = data.severity;
    if (!severity || !Object.values(INCIDENT_SEVERITY).includes(severity)) {
      if (casualties.fatalitiesCount > 0 || casualties.injuredCount >= 3) {
        severity = INCIDENT_SEVERITY.CRITICAL;
      } else if (
        hazards.includes(INCIDENT_HAZARDS.LIVE_WIRES_OR_ELECTROCUTION) ||
        hazards.includes(INCIDENT_HAZARDS.STRUCTURAL_INSTABILITY) ||
        hazards.includes(INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT) ||
        casualties.hasCasualties
      ) {
        severity = INCIDENT_SEVERITY.HIGH;
      } else {
        severity = INCIDENT_SEVERITY.MEDIUM;
      }
    }

    // 10. Generate Identifiers & Sequence
    this.sequenceCounter += 1;
    const year = now.getFullYear();
    const incidentNumber = `INC-${year}-${String(this.sequenceCounter).padStart(4, '0')}`;
    const id = `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    // 11. Normalize Reporter
    const reporterInput = data.reporter || {};
    const reporter = {
      reporterId: user?.userId || user?.id || reporterInput.reporterId || 'anonymous-reporter',
      reporterType: reporterInput.reporterType || (user?.role === 'CITIZEN' ? REPORTER_TYPES.CITIZEN : REPORTER_TYPES.CITIZEN),
      name: reporterInput.name || user?.name || 'Citizen Reporter',
      contactNumber: reporterInput.contactNumber || user?.phone || null,
      isContactNumberVerified: Boolean(reporterInput.isContactNumberVerified || user?.phoneVerifiedAt),
    };

    // 12. Normalize Initial Status & Verification State
    const status = data.status || INCIDENT_STATUS.REPORTED;
    const verificationStatus =
      data.verificationStatus ||
      (status === INCIDENT_STATUS.UNVERIFIED ? VERIFICATION_STATUS.UNVERIFIED : VERIFICATION_STATUS.UNVERIFIED);

    const officialResponderHandoff = data.officialResponderHandoff || {
      isHandedOffTo112: false,
    };

    // 13. Build Incident Entity
    const incident = {
      id,
      incidentNumber,
      title,
      description: data.description ? data.description.trim() : title,
      incidentType: data.incidentType,
      severity,
      status,
      verificationStatus,
      occurredAt: occurredDate.toISOString(),
      reportedAt: now.toISOString(),
      location: {
        latitude,
        longitude,
        accuracyMeters: data.location.accuracyMeters || 10.0,
        address: data.location.address || 'Location captured via GPS',
        ward: data.location.ward || 'Ward Undetermined',
        jurisdictionId,
        corridorOrRoadName: data.location.corridorOrRoadName || null,
      },
      hazards,
      casualties,
      vehiclesInvolved,
      evidence,
      reporter,
      source: data.source || INCIDENT_SOURCES.CITIZEN_MOBILE_APP,
      officialResponderHandoff,
      statusHistory: [
        {
          status,
          timestamp: now.toISOString(),
          actorId: reporter.reporterId,
          notes: status === INCIDENT_STATUS.UNVERIFIED
            ? 'Incident initially recorded as UNVERIFIED via emergency workflow'
            : 'Incident initially recorded in CivIQ',
        },
      ],
      metadata: data.metadata || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.incidents.set(incident.id, incident);

    // Initial timeline event: INCIDENT_RECORDED
    this.addTimelineEvent(incident.id, {
      id: `tl-${incident.id}-rec`,
      incidentId: incident.id,
      eventType: TIMELINE_EVENT_TYPES.INCIDENT_RECORDED,
      status,
      title: status === INCIDENT_STATUS.UNVERIFIED ? 'Emergency Report Recorded (UNVERIFIED)' : 'Incident Recorded',
      description: incident.description,
      actorId: reporter.reporterId,
      actorRole: reporter.reporterType,
      timestamp: now.toISOString(),
    });

    // If official 112 handoff was flagged at creation, record timeline event and alert
    if (officialResponderHandoff.isHandedOffTo112) {
      this.addTimelineEvent(incident.id, {
        id: `tl-${incident.id}-h112`,
        incidentId: incident.id,
        eventType: TIMELINE_EVENT_TYPES.CALL_112_HANDOFF_INITIATED,
        status,
        title: 'Official Call 112 Handoff Initiated',
        description: officialResponderHandoff.notes || 'Emergency 112 hotline handoff registered upon submission.',
        actorId: reporter.reporterId,
        actorRole: reporter.reporterType,
        timestamp: officialResponderHandoff.handoffTimestamp || now.toISOString(),
      });

      this.addNotification(incident.id, {
        id: `notif-${incident.id}-h112`,
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        type: INCIDENT_NOTIFICATION_TYPES.CALL_112_HANDOFF_ALERT,
        title: 'Call 112 Handoff Recorded',
        message: `Official emergency handoff initiated for incident #${incident.incidentNumber}.`,
        channel: 'IN_APP',
        recipientRole: 'DISASTER_COORDINATOR',
        timestamp: now.toISOString(),
        read: false,
      });
    }

    // Citizen acknowledgement notification
    this.addNotification(incident.id, {
      id: `notif-${incident.id}-ack`,
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      type: INCIDENT_NOTIFICATION_TYPES.INCIDENT_RECORDED_UNVERIFIED,
      title: 'Incident Recorded in CivIQ',
      message: `Your report #${incident.incidentNumber} is recorded as ${status}. For life-threatening emergencies, dial 112 immediately.`,
      channel: 'IN_APP',
      recipientRole: 'CITIZEN',
      timestamp: now.toISOString(),
      read: true,
    });

    // Audit log
    this.auditLogs.push({
      action: 'INCIDENT_CREATED',
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      actorId: reporter.reporterId,
      timestamp: now.toISOString(),
    });

    return incident;
  }

  /**
   * Phase 56: Rapid Incident Submission for active emergencies.
   * Minimal required inputs, sets status to UNVERIFIED, links Call 112 handoff if requested.
   */
  async submitRapidIncident(data = {}, options = {}) {
    const now = new Date();

    // Auto-generate title if omitted or too brief
    let title = typeof data.title === 'string' ? data.title.trim() : '';
    if (title.length < 5) {
      const typeLabel = (data.incidentType || 'CRITICAL_INCIDENT').replace(/_/g, ' ');
      const addressPart = data.location?.address ? ` near ${data.location.address}` : ' reported via GPS';
      title = `Emergency: ${typeLabel}${addressPart}`;
    }

    // Default occurredAt to now if omitted
    const occurredAt = data.occurredAt || now.toISOString();

    // Process 112 handoff flag
    const isHandedOffTo112 = Boolean(data.handoffTo112 || data.isEmergencyHandoffInitiated);
    const officialResponderHandoff = isHandedOffTo112
      ? {
          isHandedOffTo112: true,
          handoffChannel: 'CALL_112',
          handoffTimestamp: now.toISOString(),
          externalReferenceNumber: data.externalReferenceNumber || `CAD-112-${Date.now().toString(36).toUpperCase()}`,
          notes: data.handoffNotes || 'Immediate 112 emergency call initiated during rapid submission',
        }
      : { isHandedOffTo112: false };

    const rapidPayload = {
      ...data,
      title,
      occurredAt,
      status: INCIDENT_STATUS.UNVERIFIED,
      verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
      source: data.source || INCIDENT_SOURCES.CITIZEN_MOBILE_APP,
      officialResponderHandoff,
    };

    return this.createIncident(rapidPayload, options);
  }

  /**
   * Phase 56: Records an official Call 112 handoff for an incident.
   */
  async recordCall112Handoff(idOrNumber, handoffDetails = {}, options = {}) {
    const incident = await this.getIncidentRaw(idOrNumber);
    const now = new Date().toISOString();
    const actorId = options.user?.userId || options.user?.id || incident.reporter.reporterId;

    incident.officialResponderHandoff = {
      isHandedOffTo112: true,
      handoffChannel: 'CALL_112',
      handoffTimestamp: now,
      externalReferenceNumber:
        handoffDetails.externalReferenceNumber || `CAD-112-${Date.now().toString(36).toUpperCase()}`,
      agencyNotified: handoffDetails.agencyNotified || OFFICIAL_RESPONDER_AGENCIES.POLICE,
      notes: handoffDetails.notes || 'Official Call 112 national emergency handoff initiated by user',
      ...handoffDetails,
    };
    incident.updatedAt = now;

    // Timeline event
    this.addTimelineEvent(incident.id, {
      id: `tl-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      eventType: TIMELINE_EVENT_TYPES.CALL_112_HANDOFF_INITIATED,
      status: incident.status,
      title: 'Official Call 112 Handoff Initiated',
      description: handoffDetails.notes || 'Emergency 112 hotline call initiated by citizen/reporter.',
      actorId,
      actorRole: options.user?.role || REPORTER_TYPES.CITIZEN,
      timestamp: now,
    });

    // Alert notification for coordinators
    this.addNotification(incident.id, {
      id: `notif-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      type: INCIDENT_NOTIFICATION_TYPES.CALL_112_HANDOFF_ALERT,
      title: '112 Emergency Handoff Alert',
      message: `Citizen initiated Call 112 for incident #${incident.incidentNumber} (${incident.title}).`,
      channel: 'IN_APP',
      recipientRole: 'DISASTER_COORDINATOR',
      timestamp: now,
      read: false,
    });

    // Audit log
    this.auditLogs.push({
      action: 'CALL_112_HANDOFF_RECORDED',
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      actorId,
      timestamp: now,
    });

    return { ...incident };
  }

  /**
   * Phase 56: Responder confirmation transitions incident from UNVERIFIED to RESPONDER_CONFIRMED.
   * Requires first-responder or administrative authorization.
   */
  async confirmIncident(idOrNumber, confirmationData = {}, options = {}) {
    const { user } = options;

    if (!user || !this.canManageIncidents(user)) {
      const err = new Error(
        'Forbidden: Incident responder confirmation requires first-responder or administrative authorization.'
      );
      err.statusCode = 403;
      throw err;
    }

    const incident = await this.getIncidentRaw(idOrNumber);
    const now = new Date().toISOString();
    const actorId = user.userId || user.id || 'responder-actor';

    incident.status = INCIDENT_STATUS.RESPONDER_CONFIRMED;
    incident.verificationStatus = VERIFICATION_STATUS.CONFIRMED;

    if (
      confirmationData.confirmedSeverity &&
      Object.values(INCIDENT_SEVERITY).includes(confirmationData.confirmedSeverity)
    ) {
      incident.severity = confirmationData.confirmedSeverity;
    }

    if (Array.isArray(confirmationData.confirmedHazards) && confirmationData.confirmedHazards.length > 0) {
      incident.hazards = confirmationData.confirmedHazards;
    }

    incident.responderConfirmation = {
      confirmedAt: now,
      responderId: actorId,
      officerName: confirmationData.officerName || 'Duty Officer',
      agency: confirmationData.agency || OFFICIAL_RESPONDER_AGENCIES.POLICE,
      badgeNumber: confirmationData.badgeNumber || 'UNIT-01',
      notes: confirmationData.notes || 'Scene ground truth confirmed by first responder on-site',
    };
    incident.updatedAt = now;

    // Status history
    if (!incident.statusHistory) incident.statusHistory = [];
    incident.statusHistory.push({
      status: INCIDENT_STATUS.RESPONDER_CONFIRMED,
      timestamp: now,
      actorId,
      notes: confirmationData.notes || 'Incident confirmed on scene by first responder',
    });

    // Timeline event
    this.addTimelineEvent(incident.id, {
      id: `tl-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      eventType: TIMELINE_EVENT_TYPES.RESPONDER_CONFIRMED,
      status: INCIDENT_STATUS.RESPONDER_CONFIRMED,
      title: 'Responder Ground Confirmation',
      description: `${confirmationData.agency || 'Emergency Responder'} (${confirmationData.officerName || 'Officer'}) confirmed incident scene. ${confirmationData.notes || ''}`.trim(),
      actorId,
      actorRole: confirmationData.agency || 'FIRST_RESPONDER',
      timestamp: now,
    });

    // Notification to citizen reporter
    this.addNotification(incident.id, {
      id: `notif-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      type: INCIDENT_NOTIFICATION_TYPES.RESPONDER_CONFIRMATION_NOTICE,
      title: 'Incident Confirmed on Scene',
      message: `Incident #${incident.incidentNumber} ground truth has been verified by ${confirmationData.agency || 'first responders'}.`,
      channel: 'IN_APP',
      recipientRole: 'CITIZEN',
      timestamp: now,
      read: false,
    });

    this.auditLogs.push({
      action: 'INCIDENT_RESPONDER_CONFIRMED',
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      actorId,
      timestamp: now,
    });

    return { ...incident };
  }

  /**
   * Phase 56: Closes an incident with resolution notes and optional proof.
   * Requires first-responder or administrative authorization.
   */
  async closeIncident(idOrNumber, closureData = {}, options = {}) {
    const { user } = options;

    if (!user || !this.canManageIncidents(user)) {
      const err = new Error('Forbidden: Closing an incident requires first-responder or administrative authorization.');
      err.statusCode = 403;
      throw err;
    }

    const incident = await this.getIncidentRaw(idOrNumber);
    const now = new Date().toISOString();
    const actorId = user.userId || user.id || 'responder-actor';

    const notes = typeof closureData.notes === 'string'
      ? closureData.notes.trim()
      : typeof closureData.closureReason === 'string'
      ? closureData.closureReason.trim()
      : '';

    if (notes.length < 5) {
      const err = new Error('Closure notes or reason is required and must be at least 5 characters long.');
      err.statusCode = 400;
      throw err;
    }

    const targetStatus = closureData.status || INCIDENT_STATUS.CLOSED;
    if (
      targetStatus !== INCIDENT_STATUS.CLOSED &&
      targetStatus !== INCIDENT_STATUS.RESOLVED &&
      targetStatus !== INCIDENT_STATUS.FALSE_ALARM
    ) {
      const err = new Error(
        `Invalid closure status '${targetStatus}'. Must be CLOSED, RESOLVED, or FALSE_ALARM.`
      );
      err.statusCode = 400;
      throw err;
    }

    incident.status = targetStatus;
    incident.closedAt = now;
    incident.closedBy = actorId;
    incident.closureReason = notes;
    incident.resolutionProof = Array.isArray(closureData.resolutionProof) ? closureData.resolutionProof : [];
    incident.updatedAt = now;

    // Status history
    if (!incident.statusHistory) incident.statusHistory = [];
    incident.statusHistory.push({
      status: targetStatus,
      timestamp: now,
      actorId,
      notes: `Incident closed: ${notes}`,
    });

    // Timeline event
    this.addTimelineEvent(incident.id, {
      id: `tl-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      eventType: TIMELINE_EVENT_TYPES.INCIDENT_CLOSED,
      status: targetStatus,
      title: targetStatus === INCIDENT_STATUS.FALSE_ALARM ? 'Incident Marked False Alarm' : 'Incident Closed & Cleared',
      description: notes,
      actorId,
      actorRole: 'OFFICIAL_RESPONDER',
      timestamp: now,
    });

    // Closure notification
    this.addNotification(incident.id, {
      id: `notif-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      type: INCIDENT_NOTIFICATION_TYPES.INCIDENT_CLOSURE_NOTICE,
      title: `Incident #${incident.incidentNumber} Closed`,
      message: `Incident #${incident.incidentNumber} is now marked ${targetStatus}. ${notes}`,
      channel: 'IN_APP',
      recipientRole: 'CITIZEN',
      timestamp: now,
      read: false,
    });

    this.auditLogs.push({
      action: 'INCIDENT_CLOSED',
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      newStatus: targetStatus,
      actorId,
      timestamp: now,
    });

    return { ...incident };
  }

  /**
   * Helper to retrieve un-redacted incident by ID or Number.
   */
  async getIncidentRaw(idOrNumber) {
    let incident = this.incidents.get(idOrNumber);
    if (!incident) {
      incident = Array.from(this.incidents.values()).find(
        (inc) => inc.incidentNumber.toLowerCase() === idOrNumber.toLowerCase()
      );
    }

    if (!incident) {
      const err = new Error(`Incident with ID or Number '${idOrNumber}' not found.`);
      err.statusCode = 404;
      throw err;
    }
    return incident;
  }

  /**
   * Retrieves an incident by ID or incidentNumber with role-based sensitive data protection.
   */
  async getIncidentById(idOrNumber, options = {}) {
    const { user } = options;
    const incident = await this.getIncidentRaw(idOrNumber);
    const canReadSensitive = this.canReadSensitiveDetails(user);

    if (!canReadSensitive) {
      return this.redactSensitiveIncidentDetails(incident);
    }

    // Privileged access audit log
    this.auditLogs.push({
      action: 'SENSITIVE_INCIDENT_VIEWED',
      incidentId: incident.id,
      actorId: user?.userId || user?.id || 'privileged-actor',
      timestamp: new Date().toISOString(),
    });

    return {
      ...JSON.parse(JSON.stringify(incident)),
      isSensitiveDataRedacted: false,
    };
  }

  /**
   * Phase 56: Retrieves chronological timeline of events for an incident.
   */
  async getIncidentTimeline(idOrNumber, options = {}) {
    const incident = await this.getIncidentRaw(idOrNumber);
    const events = this.timelines.get(incident.id) || [];

    // If no custom timeline events stored yet, generate from statusHistory
    if (events.length === 0 && Array.isArray(incident.statusHistory)) {
      for (let i = 0; i < incident.statusHistory.length; i++) {
        const sh = incident.statusHistory[i];
        events.push({
          id: `tl-${incident.id}-${i}`,
          incidentId: incident.id,
          eventType: i === 0 ? TIMELINE_EVENT_TYPES.INCIDENT_RECORDED : TIMELINE_EVENT_TYPES.STATUS_UPDATED,
          status: sh.status,
          title: `Status: ${sh.status}`,
          description: sh.notes || 'Status updated',
          actorId: sh.actorId || 'system',
          actorRole: 'SYSTEM',
          timestamp: sh.timestamp,
        });
      }
    }

    // Sort chronologically ascending
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted;
  }

  /**
   * Phase 56: Retrieves notifications generated for an incident.
   */
  async getIncidentNotifications(idOrNumber, options = {}) {
    const incident = await this.getIncidentRaw(idOrNumber);
    const notifs = this.notifications.get(incident.id) || [];

    // Sort latest first
    return [...notifs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Lists incidents matching query filters with sensitive data redaction.
   */
  async listIncidents(query = {}, options = {}) {
    const { user } = options;
    const {
      incidentType,
      status,
      verificationStatus,
      severity,
      jurisdictionId,
      corridorOrRoadName,
      hasCasualties,
      search,
      since,
      until,
      limit = 50,
      offset = 0,
    } = query;

    let items = Array.from(this.incidents.values());

    // Filter soft deleted
    items = items.filter((inc) => !inc.deletedAt);

    if (incidentType) {
      items = items.filter((inc) => inc.incidentType === incidentType);
    }

    if (status) {
      items = items.filter((inc) => inc.status === status);
    }

    if (verificationStatus) {
      items = items.filter((inc) => inc.verificationStatus === verificationStatus);
    }

    if (severity) {
      items = items.filter((inc) => inc.severity === severity);
    }

    if (jurisdictionId) {
      items = items.filter(
        (inc) => inc.location.jurisdictionId.toLowerCase() === jurisdictionId.toLowerCase()
      );
    }

    if (corridorOrRoadName) {
      items = items.filter(
        (inc) =>
          inc.location.corridorOrRoadName &&
          inc.location.corridorOrRoadName.toLowerCase().includes(corridorOrRoadName.toLowerCase())
      );
    }

    if (hasCasualties !== undefined) {
      const boolVal = hasCasualties === true || hasCasualties === 'true';
      items = items.filter((inc) => inc.casualties.hasCasualties === boolVal);
    }

    if (since) {
      const sinceDate = new Date(since).getTime();
      items = items.filter((inc) => new Date(inc.occurredAt).getTime() >= sinceDate);
    }

    if (until) {
      const untilDate = new Date(until).getTime();
      items = items.filter((inc) => new Date(inc.occurredAt).getTime() <= untilDate);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (inc) =>
          inc.title.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q) ||
          inc.incidentNumber.toLowerCase().includes(q) ||
          inc.location.address.toLowerCase().includes(q)
      );
    }

    // Sort latest occurred first
    items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const total = items.length;
    const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

    const canReadSensitive = this.canReadSensitiveDetails(user);

    const sanitized = paginated.map((inc) => {
      if (!canReadSensitive) {
        return this.redactSensitiveIncidentDetails(inc);
      }
      return { ...inc, isSensitiveDataRedacted: false };
    });

    return {
      incidents: sanitized,
      total,
      count: sanitized.length,
      offset: Number(offset),
      limit: Number(limit),
    };
  }

  /**
   * Updates an incident lifecycle status (requires responder or administrative authorization).
   */
  async updateIncidentStatus(idOrNumber, newStatus, metadata = {}, options = {}) {
    const { user } = options;

    if (!user || !this.canManageIncidents(user)) {
      const err = new Error(
        'Forbidden: Updating incident status requires first-responder or administrative authorization.'
      );
      err.statusCode = 403;
      throw err;
    }

    if (!Object.values(INCIDENT_STATUS).includes(newStatus)) {
      const err = new Error(
        `Invalid status '${newStatus}'. Valid statuses: ${Object.values(INCIDENT_STATUS).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const incident = await this.getIncidentRaw(idOrNumber);
    const now = new Date().toISOString();
    const actorId = user.userId || user.id || 'authorized-actor';

    incident.status = newStatus;
    incident.updatedAt = now;

    if (newStatus === INCIDENT_STATUS.RESPONDER_CONFIRMED) {
      incident.verificationStatus = VERIFICATION_STATUS.CONFIRMED;
    }

    if (!incident.statusHistory) {
      incident.statusHistory = [];
    }

    incident.statusHistory.push({
      status: newStatus,
      timestamp: now,
      actorId,
      notes: metadata.notes || `Status transitioned to ${newStatus}`,
      ...metadata,
    });

    // Timeline event
    this.addTimelineEvent(incident.id, {
      id: `tl-${incident.id}-${Date.now().toString(36)}`,
      incidentId: incident.id,
      eventType: TIMELINE_EVENT_TYPES.STATUS_UPDATED,
      status: newStatus,
      title: `Status Updated to ${newStatus}`,
      description: metadata.notes || `Incident status updated to ${newStatus}`,
      actorId,
      actorRole: user.role || 'OFFICIAL',
      timestamp: now,
    });

    this.auditLogs.push({
      action: 'INCIDENT_STATUS_UPDATED',
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      newStatus,
      actorId,
      timestamp: now,
    });

    return { ...incident };
  }

  /**
   * Returns summary metrics without PII for command dashboards.
   */
  getIncidentSummaryStats(query = {}) {
    const { jurisdictionId } = query;
    let items = Array.from(this.incidents.values()).filter((inc) => !inc.deletedAt);

    if (jurisdictionId) {
      items = items.filter((inc) => inc.location.jurisdictionId === jurisdictionId);
    }

    const activeStatuses = [
      INCIDENT_STATUS.UNVERIFIED,
      INCIDENT_STATUS.REPORTED,
      INCIDENT_STATUS.DISPATCH_PENDING,
      INCIDENT_STATUS.RESPONDER_CONFIRMED,
      INCIDENT_STATUS.RESPONDER_EN_ROUTE,
      INCIDENT_STATUS.ON_SCENE,
    ];

    const stats = {
      total: items.length,
      unverifiedCount: items.filter((inc) => inc.status === INCIDENT_STATUS.UNVERIFIED).length,
      activeCount: items.filter((inc) => activeStatuses.includes(inc.status)).length,
      criticalCount: items.filter((inc) => inc.severity === INCIDENT_SEVERITY.CRITICAL).length,
      highCount: items.filter((inc) => inc.severity === INCIDENT_SEVERITY.HIGH).length,
      closedCount: items.filter((inc) => inc.status === INCIDENT_STATUS.CLOSED || inc.status === INCIDENT_STATUS.RESOLVED).length,
      casualtiesReportedCount: items.filter((inc) => inc.casualties.hasCasualties).length,
      byType: {},
      byStatus: {},
      hazardsDistribution: {},
      jurisdictions: {},
    };

    for (const inc of items) {
      stats.byType[inc.incidentType] = (stats.byType[inc.incidentType] || 0) + 1;
      stats.byStatus[inc.status] = (stats.byStatus[inc.status] || 0) + 1;
      stats.jurisdictions[inc.location.jurisdictionId] =
        (stats.jurisdictions[inc.location.jurisdictionId] || 0) + 1;

      for (const h of inc.hazards || []) {
        if (h !== INCIDENT_HAZARDS.NONE) {
          stats.hazardsDistribution[h] = (stats.hazardsDistribution[h] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

export const incidentService = new IncidentService();
