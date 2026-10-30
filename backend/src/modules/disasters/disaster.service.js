/**
 * Disaster Event Model Service
 * Phase 61: Build disaster event model
 *
 * Implements:
 * - Disaster types, official alert references, affected polygons, severity, state, and lifecycle.
 * - Source provenance storage and strict official-vs-user signal distinction.
 * - Concurrent disaster operations, active matrix, and point-in-polygon spatial detection.
 */

import { createHash } from 'crypto';
import {
  DISASTER_TYPES,
  DISASTER_SEVERITY,
  DISASTER_LIFECYCLE_STATE,
  SIGNAL_SOURCE_TYPE,
  OFFICIAL_ALERT_AUTHORITIES,
  DISASTER_STATUTORY_DISCLAIMER,
} from './disaster.types.js';
import {
  validatePolygonGeometry,
  computeBoundingBox,
  computeCentroid,
  isPointInPolygon,
  doBoundingBoxesOverlap,
} from './disaster.geometry.js';
import { SEEDED_DISASTER_EVENTS, SEEDED_DISASTER_SIGNALS } from './disaster.fixtures.js';

export class DisasterService {
  constructor() {
    this.disasters = new Map();
    this.signals = new Map(); // disasterId -> Array<Signal>
    this.auditLogs = [];
    this.sequenceCounter = 100;
    this.init();
  }

  /**
   * Initializes store with seeded baseline disaster event fixtures.
   */
  init() {
    this.disasters.clear();
    this.signals.clear();
    this.auditLogs = [];
    this.sequenceCounter = 100;

    for (const fixture of SEEDED_DISASTER_EVENTS) {
      const copy = JSON.parse(JSON.stringify(fixture));
      // Compute bounding box and centroid if not present
      if (copy.affectedPolygon) {
        copy.boundingBox = computeBoundingBox(copy.affectedPolygon);
        copy.centroid = computeCentroid(copy.affectedPolygon);
      }
      if (!Array.isArray(copy.lifecycleHistory)) {
        copy.lifecycleHistory = [
          {
            fromState: null,
            toState: copy.lifecycleState,
            timestamp: copy.declaredAt || copy.createdAt,
            actor: { id: 'ddma-system', role: 'SYSTEM' },
            notes: 'Initial disaster declaration.',
          },
        ];
      }
      if (!Array.isArray(copy.polygonHistory)) {
        copy.polygonHistory = [
          {
            polygon: copy.affectedPolygon,
            timestamp: copy.declaredAt || copy.createdAt,
            reason: 'Initial affected polygon boundary declaration.',
          },
        ];
      }
      this.disasters.set(copy.id, copy);
      this.signals.set(copy.id, []);
    }

    // Populate seeded signals
    for (const sig of SEEDED_DISASTER_SIGNALS) {
      const copySig = JSON.parse(JSON.stringify(sig));
      if (this.signals.has(copySig.disasterId)) {
        this.signals.get(copySig.disasterId).push(copySig);
      }
    }

    // Recompute signals summary for all seeded disasters
    for (const disaster of this.disasters.values()) {
      this._recomputeSignalsSummary(disaster);
    }
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.init();
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Disaster Entity Management & Lifecycle
  // ─────────────────────────────────────────────────────────────

  /**
   * Creates a new disaster event.
   */
  async createDisaster(data = {}, context = {}) {
    // 1. Validate Title
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (title.length < 5) {
      const err = new Error('Disaster title is required and must be at least 5 characters.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate Disaster Type
    if (!data.disasterType || !Object.values(DISASTER_TYPES).includes(data.disasterType)) {
      const err = new Error(
        `Invalid disasterType '${data.disasterType}'. Valid types: ${Object.values(DISASTER_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Validate Severity
    if (!data.severity || !Object.values(DISASTER_SEVERITY).includes(data.severity)) {
      const err = new Error(
        `Invalid severity '${data.severity}'. Valid levels: ${Object.values(DISASTER_SEVERITY).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Validate Affected Polygon Geometry
    if (!data.affectedPolygon) {
      const err = new Error('affectedPolygon GeoJSON geometry is required.');
      err.statusCode = 400;
      throw err;
    }
    validatePolygonGeometry(data.affectedPolygon);

    const boundingBox = computeBoundingBox(data.affectedPolygon);
    const centroid = computeCentroid(data.affectedPolygon);

    // 5. Generate Identifier
    this.sequenceCounter += 1;
    const year = new Date().getFullYear();
    const id = data.id || `dis-${data.disasterType.toLowerCase().replace(/_/g, '-')}-${Date.now()}`;
    const disasterNumber = data.disasterNumber || `DIS-${year}-${String(this.sequenceCounter).padStart(4, '0')}`;

    const initialState = data.lifecycleState || DISASTER_LIFECYCLE_STATE.DETECTED;
    const now = new Date().toISOString();

    // 6. Compute Source Provenance Hash
    const rawProvenanceString = `${id}:${disasterNumber}:${data.disasterType}:${data.severity}:${now}`;
    const provenanceHash = createHash('sha256').update(rawProvenanceString).digest('hex');

    const disaster = {
      id,
      disasterNumber,
      title,
      description: data.description || '',
      disasterType: data.disasterType,
      severity: data.severity,
      lifecycleState: initialState,
      jurisdictionIds: Array.isArray(data.jurisdictionIds) && data.jurisdictionIds.length > 0
        ? data.jurisdictionIds
        : ['mh-pune-pmc'],
      affectedWards: Array.isArray(data.affectedWards) ? data.affectedWards : [],
      affectedPolygon: data.affectedPolygon,
      boundingBox,
      centroid,
      declaredAt: data.declaredAt || now,
      expectedDurationHours: data.expectedDurationHours || 24,
      officialAlertReferences: Array.isArray(data.officialAlertReferences)
        ? data.officialAlertReferences
        : [],
      signalsSummary: {
        officialSignalsCount: 0,
        userSignalsCount: 0,
        sensorSignalsCount: 0,
        fieldResponderSignalsCount: 0,
        totalSignalsCount: 0,
        corroborationScore: 0.0,
      },
      provenance: {
        originatingAuthority: data.originatingAuthority || 'CivIQ Municipal Operations Intake',
        leadRespondingAgency: data.leadRespondingAgency || 'District Disaster Management Authority (DDMA)',
        statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
        provenanceHash,
      },
      lifecycleHistory: [
        {
          fromState: null,
          toState: initialState,
          timestamp: now,
          actor: context.actor || { id: 'system', role: 'SYSTEM' },
          notes: data.initialNotes || 'Disaster event record initiated.',
        },
      ],
      polygonHistory: [
        {
          polygon: data.affectedPolygon,
          timestamp: now,
          reason: 'Initial affected polygon boundary declaration.',
        },
      ],
      createdAt: now,
      lastUpdatedAt: now,
    };

    this.disasters.set(id, disaster);
    this.signals.set(id, []);

    // If initial official alert references were passed, process them
    if (Array.isArray(data.officialAlertReferences)) {
      for (const alertRef of data.officialAlertReferences) {
        this._recordOfficialAlertSignal(id, alertRef);
      }
    }

    return disaster;
  }

  /**
   * Retrieves a disaster by ID.
   */
  async getDisasterById(id) {
    return this.disasters.get(id) || null;
  }

  /**
   * Lists disasters with optional filtering.
   */
  async listDisasters(filter = {}) {
    let list = Array.from(this.disasters.values());

    if (filter.disasterType) {
      list = list.filter((d) => d.disasterType === filter.disasterType);
    }

    if (filter.severity) {
      list = list.filter((d) => d.severity === filter.severity);
    }

    if (filter.lifecycleState) {
      list = list.filter((d) => d.lifecycleState === filter.lifecycleState);
    }

    if (filter.jurisdictionId) {
      list = list.filter((d) => d.jurisdictionIds.includes(filter.jurisdictionId));
    }

    if (filter.isActive !== undefined) {
      const activeBool = filter.isActive === true || filter.isActive === 'true';
      list = list.filter((d) => {
        const isClosed =
          d.lifecycleState === DISASTER_LIFECYCLE_STATE.CLOSED_RESOLVED ||
          d.lifecycleState === DISASTER_LIFECYCLE_STATE.CANCELLED_FALSE_ALARM;
        return activeBool ? !isClosed : isClosed;
      });
    }

    return list;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Concurrent Disasters Support & Point-in-Polygon Query
  // ─────────────────────────────────────────────────────────────

  /**
   * Retrieves all concurrent active disasters.
   * Computes spatial bounding-box overlap relationships between concurrent disasters.
   */
  async findConcurrentDisasters(options = {}) {
    const activeDisasters = await this.listDisasters({ isActive: true });

    // Check pairwise overlap among all active disasters
    const overlapMatrix = [];

    for (let i = 0; i < activeDisasters.length; i++) {
      for (let j = i + 1; j < activeDisasters.length; j++) {
        const d1 = activeDisasters[i];
        const d2 = activeDisasters[j];

        const boxesOverlap = doBoundingBoxesOverlap(d1.boundingBox, d2.boundingBox);
        const sharedJurisdictions = d1.jurisdictionIds.filter((jId) =>
          d2.jurisdictionIds.includes(jId)
        );

        if (boxesOverlap || sharedJurisdictions.length > 0) {
          overlapMatrix.push({
            disasterA: { id: d1.id, title: d1.title, type: d1.disasterType },
            disasterB: { id: d2.id, title: d2.title, type: d2.disasterType },
            boundingBoxesOverlap: boxesOverlap,
            sharedJurisdictions,
          });
        }
      }
    }

    return {
      concurrentCount: activeDisasters.length,
      activeDisasters,
      overlapMatrix,
      isMultiDisasterActive: activeDisasters.length > 1,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }

  /**
   * Identifies all active disasters that contain a specific GPS point.
   * Supports detecting multiple concurrent disasters at the citizen's location!
   */
  async findDisastersAtPoint(latitude, longitude, options = {}) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const err = new Error('latitude and longitude numbers are required.');
      err.statusCode = 400;
      throw err;
    }

    const point = { latitude, longitude };
    const candidates = await this.listDisasters({ isActive: true });

    const matchingDisasters = [];

    for (const disaster of candidates) {
      if (isPointInPolygon(point, disaster.affectedPolygon)) {
        matchingDisasters.push(disaster);
      }
    }

    return {
      point,
      count: matchingDisasters.length,
      isInDisasterZone: matchingDisasters.length > 0,
      hasMultipleConcurrentDisastersAtLocation: matchingDisasters.length > 1,
      disasters: matchingDisasters,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Lifecycle State & Polygon Dynamic Updates
  // ─────────────────────────────────────────────────────────────

  /**
   * Updates disaster lifecycle state with validation and audit log.
   */
  async updateLifecycleState(id, newState, updateContext = {}) {
    const disaster = this.disasters.get(id);
    if (!disaster) {
      const err = new Error(`Disaster with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!Object.values(DISASTER_LIFECYCLE_STATE).includes(newState)) {
      const err = new Error(
        `Invalid lifecycleState '${newState}'. Valid states: ${Object.values(DISASTER_LIFECYCLE_STATE).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const previousState = disaster.lifecycleState;
    const now = new Date().toISOString();

    disaster.lifecycleState = newState;
    disaster.lastUpdatedAt = now;

    if (!Array.isArray(disaster.lifecycleHistory)) {
      disaster.lifecycleHistory = [];
    }

    disaster.lifecycleHistory.push({
      fromState: previousState,
      toState: newState,
      timestamp: now,
      actor: updateContext.actor || { id: 'unknown', role: 'COORDINATOR' },
      notes: updateContext.notes || `Disaster transitioned from ${previousState} to ${newState}.`,
    });

    return disaster;
  }

  /**
   * Dynamically expands or contracts the affected disaster polygon.
   */
  async updateAffectedPolygon(id, newPolygon, reason = 'Boundary updated', actor = null) {
    const disaster = this.disasters.get(id);
    if (!disaster) {
      const err = new Error(`Disaster with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    validatePolygonGeometry(newPolygon);

    const boundingBox = computeBoundingBox(newPolygon);
    const centroid = computeCentroid(newPolygon);
    const now = new Date().toISOString();

    disaster.affectedPolygon = newPolygon;
    disaster.boundingBox = boundingBox;
    disaster.centroid = centroid;
    disaster.lastUpdatedAt = now;

    if (!Array.isArray(disaster.polygonHistory)) {
      disaster.polygonHistory = [];
    }

    disaster.polygonHistory.push({
      polygon: newPolygon,
      timestamp: now,
      reason,
      actor,
    });

    return disaster;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Official Alert References & Source Provenance
  // ─────────────────────────────────────────────────────────────

  /**
   * Attaches an external statutory official alert reference (e.g. SACHET CAP, IMD Bulletin).
   */
  async attachOfficialAlertReference(id, alertReference = {}) {
    const disaster = this.disasters.get(id);
    if (!disaster) {
      const err = new Error(`Disaster with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!alertReference.authority || !alertReference.externalAlertId) {
      const err = new Error('Official alert reference must contain authority and externalAlertId.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const referenceId = alertReference.referenceId || `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sourceSignatureHash =
      alertReference.sourceSignatureHash ||
      createHash('sha256')
        .update(`${alertReference.authority}:${alertReference.externalAlertId}:${now}`)
        .digest('hex');

    const normalizedRef = {
      referenceId,
      authority: alertReference.authority,
      externalAlertId: alertReference.externalAlertId,
      alertHeadline: alertReference.alertHeadline || 'Official Disaster Advisory Notice',
      issuedAt: alertReference.issuedAt || now,
      ingestedAt: now,
      sourceSignatureHash,
      sourceUrl: alertReference.sourceUrl || null,
      rawAlertMetadata: alertReference.rawAlertMetadata || null,
    };

    disaster.officialAlertReferences.push(normalizedRef);
    disaster.lastUpdatedAt = now;

    // Record an official signal automatically
    this._recordOfficialAlertSignal(id, normalizedRef);

    return normalizedRef;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Official vs User Signal Distinction & Corroboration
  // ─────────────────────────────────────────────────────────────

  /**
   * Records a signal (Official Alert, Citizen Report, IoT Sensor, Responder Confirmation)
   * maintaining strict official-vs-user signal distinction and provenance.
   */
  async recordSignal(id, signalData = {}) {
    const disaster = this.disasters.get(id);
    if (!disaster) {
      const err = new Error(`Disaster with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!signalData.sourceType || !Object.values(SIGNAL_SOURCE_TYPE).includes(signalData.sourceType)) {
      const err = new Error(
        `Invalid sourceType '${signalData.sourceType}'. Valid types: ${Object.values(SIGNAL_SOURCE_TYPE).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const signalId = `SIG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const isOfficial = signalData.sourceType === SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT;
    const isUser = signalData.sourceType === SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL;
    const isSensor = signalData.sourceType === SIGNAL_SOURCE_TYPE.IOT_SENSOR_SIGNAL;
    const isResponder = signalData.sourceType === SIGNAL_SOURCE_TYPE.FIELD_RESPONDER_CONFIRMATION;

    // Strict provenance hashing for each signal
    const provenanceString = `${signalId}:${signalData.sourceType}:${now}:${JSON.stringify(signalData.sourceMetadata || {})}`;
    const signalProvenanceHash = createHash('sha256').update(provenanceString).digest('hex');

    const signal = {
      signalId,
      disasterId: id,
      sourceType: signalData.sourceType,
      isOfficialGovernmentSignal: isOfficial,
      isUserReportedSignal: isUser,
      title: signalData.title || (isOfficial ? 'Official Government Alert Signal' : 'Citizen Distress Signal'),
      description: signalData.description || '',
      location: signalData.location || null,
      sourceMetadata: signalData.sourceMetadata || {},
      confidenceWeight: isOfficial ? 1.0 : isResponder ? 0.95 : isSensor ? 0.85 : 0.65,
      signalProvenanceHash,
      recordedAt: now,
    };

    if (!this.signals.has(id)) {
      this.signals.set(id, []);
    }
    this.signals.get(id).push(signal);

    // Recalculate signals summary
    this._recomputeSignalsSummary(disaster);

    return signal;
  }

  /**
   * Internal helper to record an official alert as a signal.
   */
  _recordOfficialAlertSignal(disasterId, alertRef) {
    if (!this.signals.has(disasterId)) {
      this.signals.set(disasterId, []);
    }

    const signalId = `SIG-OFFICIAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const signal = {
      signalId,
      disasterId,
      sourceType: SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT,
      isOfficialGovernmentSignal: true,
      isUserReportedSignal: false,
      title: alertRef.alertHeadline,
      description: `Official statutory advisory from ${alertRef.authority} (${alertRef.externalAlertId})`,
      sourceMetadata: {
        authority: alertRef.authority,
        externalAlertId: alertRef.externalAlertId,
        sourceSignatureHash: alertRef.sourceSignatureHash,
      },
      confidenceWeight: 1.0,
      signalProvenanceHash: alertRef.sourceSignatureHash,
      recordedAt: alertRef.ingestedAt || new Date().toISOString(),
    };

    this.signals.get(disasterId).push(signal);
    const disaster = this.disasters.get(disasterId);
    if (disaster) {
      this._recomputeSignalsSummary(disaster);
    }
  }

  /**
   * Recomputes official vs user signal breakdown metrics and corroboration score.
   */
  _recomputeSignalsSummary(disaster) {
    const signalList = this.signals.get(disaster.id) || [];

    let officialCount = 0;
    let userCount = 0;
    let sensorCount = 0;
    let responderCount = 0;

    for (const s of signalList) {
      if (s.sourceType === SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT) officialCount++;
      else if (s.sourceType === SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL) userCount++;
      else if (s.sourceType === SIGNAL_SOURCE_TYPE.IOT_SENSOR_SIGNAL) sensorCount++;
      else if (s.sourceType === SIGNAL_SOURCE_TYPE.FIELD_RESPONDER_CONFIRMATION) responderCount++;
    }

    const total = signalList.length;
    // Corroboration formula: official alert anchors it at >= 0.85; user & sensor signals boost it
    let corroborationScore = 0.0;
    if (officialCount > 0) {
      corroborationScore = Math.min(1.0, 0.80 + 0.05 * officialCount + 0.02 * userCount + 0.03 * sensorCount);
    } else if (responderCount > 0) {
      corroborationScore = Math.min(1.0, 0.70 + 0.05 * responderCount + 0.02 * userCount);
    } else if (userCount > 0 || sensorCount > 0) {
      corroborationScore = Math.min(0.79, 0.40 + 0.04 * userCount + 0.05 * sensorCount);
    }

    disaster.signalsSummary = {
      officialSignalsCount: officialCount,
      userSignalsCount: userCount,
      sensorSignalsCount: sensorCount,
      fieldResponderSignalsCount: responderCount,
      totalSignalsCount: total,
      corroborationScore: Number(corroborationScore.toFixed(2)),
    };
    disaster.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Retrieves signals recorded for a disaster with optional filter.
   */
  async getDisasterSignals(id, filter = {}) {
    const list = this.signals.get(id) || [];
    if (filter.sourceType) {
      return list.filter((s) => s.sourceType === filter.sourceType);
    }
    if (filter.isOfficialOnly === true || filter.isOfficialOnly === 'true') {
      return list.filter((s) => s.isOfficialGovernmentSignal);
    }
    if (filter.isUserOnly === true || filter.isUserOnly === 'true') {
      return list.filter((s) => s.isUserReportedSignal);
    }
    return list;
  }

  /**
   * Generates a high-level situational report for a disaster event.
   */
  async getSituationalReport(id) {
    const disaster = await this.getDisasterById(id);
    if (!disaster) {
      const err = new Error(`Disaster with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const signals = await this.getDisasterSignals(id);

    return {
      disasterId: disaster.id,
      disasterNumber: disaster.disasterNumber,
      title: disaster.title,
      disasterType: disaster.disasterType,
      severity: disaster.severity,
      lifecycleState: disaster.lifecycleState,
      jurisdictionIds: disaster.jurisdictionIds,
      affectedWards: disaster.affectedWards,
      centroid: disaster.centroid,
      boundingBox: disaster.boundingBox,
      officialAlertReferencesCount: disaster.officialAlertReferences.length,
      officialAlertReferences: disaster.officialAlertReferences,
      signalsBreakdown: {
        total: signals.length,
        official: disaster.signalsSummary.officialSignalsCount,
        userReported: disaster.signalsSummary.userSignalsCount,
        sensor: disaster.signalsSummary.sensorSignalsCount,
        responderConfirmed: disaster.signalsSummary.fieldResponderSignalsCount,
        corroborationScore: disaster.signalsSummary.corroborationScore,
      },
      provenance: disaster.provenance,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }
}

export const disasterService = new DisasterService();
