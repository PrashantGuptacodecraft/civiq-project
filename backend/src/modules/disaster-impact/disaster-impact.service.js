/**
 * Disaster Impact Reporting Service
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - Citizen and field worker impact report intake for multi-hazard disasters
 * - Automatic geospatial binding to active disaster event polygons (Phase 61)
 * - Emergency-fast path with mandatory initial UNVERIFIED status (ADR 0002)
 * - Life-safety emergency 112 handoff detection
 * - Automatic cross-correlation and user signal emission into DisasterService
 */

import {
  IMPACT_TYPES,
  IMPACT_SEVERITY,
  IMPACT_STATUS,
  REPORTER_TYPE,
  DISASTER_IMPACT_DISCLAIMER,
} from './disaster-impact.types.js';
import { SEEDED_IMPACT_REPORTS } from './disaster-impact.fixtures.js';
import { disasterService, SIGNAL_SOURCE_TYPE } from '../disasters/index.js';

export class DisasterImpactService {
  constructor() {
    this.reports = new Map();
    this.sequenceCounter = 100;
    this.init();
  }

  /**
   * Initializes store with seeded realistic impact reports.
   */
  init() {
    this.reports.clear();
    this.sequenceCounter = 100;

    for (const fixture of SEEDED_IMPACT_REPORTS) {
      const copy = JSON.parse(JSON.stringify(fixture));
      if (!Array.isArray(copy.triageHistory)) {
        copy.triageHistory = [
          {
            fromStatus: null,
            toStatus: copy.status,
            timestamp: copy.reportedAt,
            actor: { id: 'system', role: 'INITIAL_REPORT' },
            notes: 'Initial impact report recorded.',
          },
        ];
      }
      this.reports.set(copy.reportId, copy);
    }
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.init();
  }

  /**
   * Submits a disaster impact report via emergency fast-path.
   * Mandates initial UNVERIFIED status to prevent blocking civic awareness.
   *
   * @param {Object} data - Impact report data
   * @param {Object} reporterContext - Reporter identity
   * @returns {Promise<Object>} Created report record with emergency handoff notice
   */
  async submitImpactReport(data = {}, reporterContext = {}) {
    // 1. Validate Impact Type
    if (!data.impactType || !Object.values(IMPACT_TYPES).includes(data.impactType)) {
      const err = new Error(
        `Invalid impactType '${data.impactType}'. Valid types: ${Object.values(IMPACT_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate Geospatial Location
    if (!data.location || typeof data.location.latitude !== 'number' || typeof data.location.longitude !== 'number') {
      const err = new Error('location with latitude and longitude numbers is required.');
      err.statusCode = 400;
      throw err;
    }

    const { latitude, longitude } = data.location;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      const err = new Error('Invalid GPS coordinates: latitude [-90,90], longitude [-180,180].');
      err.statusCode = 400;
      throw err;
    }

    // 3. Resolve or Validate Disaster Event Binding
    let boundDisasterId = data.disasterId || null;
    let boundDisasterTitle = null;

    if (boundDisasterId) {
      const disaster = await disasterService.getDisasterById(boundDisasterId);
      if (disaster) {
        boundDisasterTitle = disaster.title;
      }
    } else {
      // Spatial Point-in-Polygon Lookup: auto-bind report to active disaster at this coordinate
      const spatialMatch = await disasterService.findDisastersAtPoint(latitude, longitude);
      if (spatialMatch.isInDisasterZone && spatialMatch.disasters.length > 0) {
        boundDisasterId = spatialMatch.disasters[0].id;
        boundDisasterTitle = spatialMatch.disasters[0].title;
      }
    }

    // 4. Generate Unique Report Identifier
    this.sequenceCounter += 1;
    const year = new Date().getFullYear();
    const reportId = data.reportId || `DIR-${year}-${String(this.sequenceCounter).padStart(4, '0')}`;
    const now = new Date().toISOString();

    // 5. Life Safety Handoff Evaluation
    const isLifeThreatening = Boolean(
      data.isLifeThreatening ||
      data.impactDetails?.isLifeThreatening ||
      data.impactType === IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED ||
      (data.impactDetails?.strandedPersonsCount && data.impactDetails.strandedPersonsCount > 0)
    );

    const severity =
      data.severity ||
      (isLifeThreatening ? IMPACT_SEVERITY.CRITICAL_LIFE_SAFETY : IMPACT_SEVERITY.HIGH_URGENT);

    const handoffRecommended = isLifeThreatening;

    // 6. Build Normalized Report Object (Emergency Fast-Path: always UNVERIFIED initially)
    const report = {
      reportId,
      disasterId: boundDisasterId,
      disasterTitle: boundDisasterTitle,
      impactType: data.impactType,
      severity,
      status: IMPACT_STATUS.UNVERIFIED,
      reporterType: reporterContext.role === 'FIELD_WORKER' || reporterContext.role === 'RESPONDER'
        ? REPORTER_TYPE.FIELD_WORKER
        : REPORTER_TYPE.CITIZEN,
      reporter: {
        id: reporterContext.id || data.reporter?.id || 'citizen-anonymous',
        phoneMasked: this._maskPhoneNumber(reporterContext.phone || data.reporter?.phone),
        role: reporterContext.role || 'CITIZEN',
      },
      location: {
        latitude,
        longitude,
        address: data.location.address || 'Reported Location',
        ward: data.location.ward || null,
        jurisdictionId: data.location.jurisdictionId || 'mh-pune-pmc',
      },
      impactDetails: {
        title: data.title || data.impactDetails?.title || `Reported ${data.impactType.replace(/_/g, ' ')}`,
        description: data.description || data.impactDetails?.description || '',
        isLifeThreatening,
        peopleAffectedEstimated: Number(data.peopleAffectedEstimated || data.impactDetails?.peopleAffectedEstimated || 1),
        strandedPersonsCount: Number(data.strandedPersonsCount || data.impactDetails?.strandedPersonsCount || 0),
        waterDepthMeters: Number(data.waterDepthMeters || data.impactDetails?.waterDepthMeters || 0),
        roadPassable: data.roadPassable !== undefined ? Boolean(data.roadPassable) : data.impactDetails?.roadPassable,
        utilityType: data.utilityType || data.impactDetails?.utilityType || null,
        reliefNeeds: Array.isArray(data.reliefNeeds || data.impactDetails?.reliefNeeds)
          ? data.reliefNeeds || data.impactDetails?.reliefNeeds
          : [],
      },
      emergencyHandoff: {
        handoffRecommended,
        emergencyService: handoffRecommended ? '112 (National Emergency Hotline)' : null,
        statutoryDisclaimer: DISASTER_IMPACT_DISCLAIMER,
      },
      photos: Array.isArray(data.photos) ? data.photos : [],
      corroboration: {
        signalCreated: false,
        corroboratingSignalId: null,
      },
      triageHistory: [
        {
          fromStatus: null,
          toStatus: IMPACT_STATUS.UNVERIFIED,
          timestamp: now,
          actor: { id: reporterContext.id || 'system', role: 'REPORTER' },
          notes: 'Fast-path disaster impact report recorded with UNVERIFIED status.',
        },
      ],
      reportedAt: now,
      lastUpdatedAt: now,
    };

    // 7. Emit Corroborating Signal into DisasterService
    if (boundDisasterId) {
      try {
        const signal = await disasterService.recordSignal(boundDisasterId, {
          sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
          title: report.impactDetails.title,
          description: report.impactDetails.description,
          location: report.location,
          sourceMetadata: {
            impactReportId: report.reportId,
            impactType: report.impactType,
            severity: report.severity,
            isLifeThreatening,
          },
        });

        report.corroboration.signalCreated = true;
        report.corroboration.corroboratingSignalId = signal.signalId;
      } catch {
        // Non-blocking signal emission
      }
    }

    this.reports.set(reportId, report);

    return {
      success: true,
      report,
      emergencyHandoffNotice: handoffRecommended
        ? 'CRITICAL ALERT: Life-safety hazard reported. If not already done, please dial 112 immediately.'
        : null,
      statutoryNotice: DISASTER_IMPACT_DISCLAIMER,
    };
  }

  /**
   * Retrieves an impact report by ID.
   */
  async getReportById(reportId) {
    return this.reports.get(reportId) || null;
  }

  /**
   * Lists impact reports with filtering.
   */
  async listReports(filter = {}) {
    let list = Array.from(this.reports.values());

    if (filter.disasterId) {
      list = list.filter((r) => r.disasterId === filter.disasterId);
    }

    if (filter.impactType) {
      list = list.filter((r) => r.impactType === filter.impactType);
    }

    if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    if (filter.jurisdictionId) {
      list = list.filter((r) => r.location?.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.isLifeThreatening !== undefined) {
      const boolVal = filter.isLifeThreatening === true || filter.isLifeThreatening === 'true';
      list = list.filter((r) => r.impactDetails?.isLifeThreatening === boolVal);
    }

    if (filter.ward) {
      list = list.filter((r) => r.location?.ward === filter.ward);
    }

    return list;
  }

  /**
   * Computes aggregated situational impact metrics for a disaster event.
   */
  async getImpactSummary(disasterId) {
    const disaster = await disasterService.getDisasterById(disasterId);
    const reports = await this.listReports({ disasterId });

    const byType = {
      [IMPACT_TYPES.FLOODING_WATERLOGGING]: 0,
      [IMPACT_TYPES.BLOCKED_ROAD_DEBRIS]: 0,
      [IMPACT_TYPES.UTILITY_OUTAGE]: 0,
      [IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED]: 0,
      [IMPACT_TYPES.STRUCTURAL_INFRASTRUCTURE_DAMAGE]: 0,
      [IMPACT_TYPES.URGENT_RELIEF_NEEDS]: 0,
    };

    let totalPeopleAffected = 0;
    let totalStrandedPersons = 0;
    let criticalLifeSafetyCount = 0;
    let unverifiedCount = 0;
    let triagedCount = 0;
    let resolvedCount = 0;

    const wardBreakdown = {};

    for (const r of reports) {
      if (byType[r.impactType] !== undefined) {
        byType[r.impactType]++;
      }

      totalPeopleAffected += r.impactDetails?.peopleAffectedEstimated || 0;
      totalStrandedPersons += r.impactDetails?.strandedPersonsCount || 0;

      if (r.severity === IMPACT_SEVERITY.CRITICAL_LIFE_SAFETY || r.impactDetails?.isLifeThreatening) {
        criticalLifeSafetyCount++;
      }

      if (r.status === IMPACT_STATUS.UNVERIFIED) unverifiedCount++;
      else if (r.status === IMPACT_STATUS.FIELD_TRIAGED || r.status === IMPACT_STATUS.RESPONDER_DISPATCHED) triagedCount++;
      else if (r.status === IMPACT_STATUS.RESOLVED) resolvedCount++;

      const ward = r.location?.ward || 'Unassigned Ward';
      wardBreakdown[ward] = (wardBreakdown[ward] || 0) + 1;
    }

    return {
      disasterId,
      disasterTitle: disaster ? disaster.title : 'Unbound Incident Area',
      totalReports: reports.length,
      criticalLifeSafetyCount,
      unverifiedCount,
      triagedCount,
      resolvedCount,
      totalPeopleAffectedEstimated: totalPeopleAffected,
      totalStrandedPersonsEstimated: totalStrandedPersons,
      breakdownByType: byType,
      breakdownByWard: wardBreakdown,
      statutoryNotice: DISASTER_IMPACT_DISCLAIMER,
    };
  }

  /**
   * Field triage transition by disaster response personnel.
   */
  async triageReport(reportId, newStatus, triageContext = {}) {
    const report = this.reports.get(reportId);
    if (!report) {
      const err = new Error(`Disaster impact report '${reportId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!Object.values(IMPACT_STATUS).includes(newStatus)) {
      const err = new Error(`Invalid status '${newStatus}'. Valid statuses: ${Object.values(IMPACT_STATUS).join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const previousStatus = report.status;
    const now = new Date().toISOString();

    report.status = newStatus;
    report.lastUpdatedAt = now;

    if (!Array.isArray(report.triageHistory)) {
      report.triageHistory = [];
    }

    report.triageHistory.push({
      fromStatus: previousStatus,
      toStatus: newStatus,
      timestamp: now,
      actor: triageContext.actor || { id: 'field-responder', role: 'RESPONDER' },
      notes: triageContext.notes || `Impact report triaged from ${previousStatus} to ${newStatus}.`,
    });

    return report;
  }

  /**
   * Helper to mask phone numbers to preserve privacy (AGENTS.md rule).
   */
  _maskPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return null;
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.length < 7) return '***';
    return `${cleaned.slice(0, 3)}XXXX${cleaned.slice(-4)}`;
  }
}

export const disasterImpactService = new DisasterImpactService();
