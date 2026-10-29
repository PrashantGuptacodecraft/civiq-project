/**
 * Mock / Sandbox Official Incident Source Adapter
 * Phase 58: Add official-source incident adapter contract
 *
 * Default adapter for college deployment, developer testing, and automated checks.
 * Explicitly marked as a non-live sandbox per AGENTS.md safety guidelines.
 */

import { BaseIncidentSourceAdapter } from './incident-adapter.interface.js';
import {
  OFFICIAL_SOURCES,
  COLLISION_TYPES,
  OFFICIAL_SEVERITY_LEVELS,
  ROAD_SURFACE_CONDITIONS,
  LIGHTING_CONDITIONS,
  OFFICIAL_ADAPTER_DISCLAIMER,
} from './incident-adapter.types.js';

export const MOCK_RAW_ACCIDENT_FEED = [
  // ─── 1. Paud Road Flyover Ramp Collision ───
  {
    accident_id: 'IRAD-MH-PUN-2026-0042',
    fir_no: 'FIR-2026-PS-KOTHRUD-0189',
    police_station: 'Kothrud Police Station',
    investigating_officer_badge: 'IO-MH-TP-4421',
    timestamp: '2026-10-29T08:15:00Z',
    gps_lat: 18.5074,
    gps_lng: 73.8077,
    road_name: 'Paud Road Flyover Incline',
    jurisdiction_code: 'mh-pune-pmc',
    ward_name: 'Ward 5 - Kothrud',
    crash_type: 'HEAD_ON_COLLISION',
    severity_code: 'GRIEVOUS_INJURY',
    fatalities: 0,
    injured: 3,
    vehicles: ['CITY_BUS', 'AUTO_RICKSHAW', 'MOTORCYCLE'],
    surface_condition: 'POTHOLE_OR_DAMAGED',
    lighting: 'DAYLIGHT',
    weather: 'CLEAR',
    contributing_factors: ['Sunken expansion joint', 'Two-wheeler evasive maneuver', 'Fuel spill on tarmac'],
    // Test compliance: aadhaar should be stripped during normalization
    aadhaar_number: '9999-8888-7777',
    driver_mobile: '+91 9822019483',
  },

  // ─── 2. FC Road / Goodluck Chowk Pedestrian Collision ───
  {
    accident_id: 'IRAD-MH-PUN-2026-0089',
    fir_no: 'FIR-2026-PS-DECCAN-0312',
    police_station: 'Deccan Gymkhana Police Station',
    investigating_officer_badge: 'IO-MH-TP-1290',
    timestamp: '2026-10-28T18:40:00Z',
    gps_lat: 18.5204,
    gps_lng: 73.8567,
    road_name: 'FC Road near Goodluck Chowk',
    jurisdiction_code: 'mh-pune-pmc',
    ward_name: 'Ward 12 - Shivaji Nagar',
    crash_type: 'PEDESTRIAN_IMPACT',
    severity_code: 'MINOR_INJURY',
    fatalities: 0,
    injured: 1,
    vehicles: ['CAR'],
    surface_condition: 'DRY_NORMAL',
    lighting: 'DUSK',
    weather: 'CLEAR',
    contributing_factors: ['Defective signal countdown', 'Pedestrian zebra crossing crossing obstructed'],
  },

  // ─── 3. Bhosari MIDC Industrial Vehicle Collision ───
  {
    accident_id: 'IRAD-MH-PCM-2026-0112',
    fir_no: 'FIR-2026-PS-BHOSARI-0881',
    police_station: 'Bhosari MIDC Police Station',
    investigating_officer_badge: 'IO-MH-TP-8871',
    timestamp: '2026-10-29T08:50:00Z',
    gps_lat: 18.6298,
    gps_lng: 73.7997,
    road_name: 'Chinchwad Station Road, MIDC',
    jurisdiction_code: 'mh-pune-pcmc',
    ward_name: 'Ward 18 - Chinchwad',
    crash_type: 'FIXED_OBJECT',
    severity_code: 'NON_INJURY_DAMAGE_ONLY',
    fatalities: 0,
    injured: 0,
    vehicles: ['HEAVY_TRUCK'],
    surface_condition: 'WET_OR_SLIPPERY',
    lighting: 'DAYLIGHT',
    weather: 'OVERCAST',
    contributing_factors: ['Snapped 11kV overhead cable arcing', 'Roadside unpaved ditch'],
  },

  // ─── 4. University Flyover Crest Collision ───
  {
    accident_id: 'IRAD-MH-PUN-2026-0155',
    fir_no: 'FIR-2026-PS-CHATUR-0544',
    police_station: 'Chaturshringi Police Station',
    investigating_officer_badge: 'IO-MH-TP-3310',
    timestamp: '2026-10-29T09:10:00Z',
    gps_lat: 18.5314,
    gps_lng: 73.8298,
    road_name: 'University Flyover Crest, Ganeshkhind Road',
    jurisdiction_code: 'mh-pune-pmc',
    ward_name: 'Ward 10 - Model Colony',
    crash_type: 'SKID_OR_OVERTURN',
    severity_code: 'GRIEVOUS_INJURY',
    fatalities: 0,
    injured: 1,
    vehicles: ['AUTO_RICKSHAW'],
    surface_condition: 'DRY_NORMAL',
    lighting: 'DAYLIGHT',
    weather: 'CLEAR',
    contributing_factors: ['High-speed collision with lane divider', 'CNG fuel tank odor'],
  },
];

export class MockSandboxIncidentAdapter extends BaseIncidentSourceAdapter {
  constructor(options = {}) {
    super({
      sourceName: OFFICIAL_SOURCES.MOCK_SANDBOX,
      sourceType: 'SANDBOX',
      isLiveIntegration: false,
      isMockOrSandbox: true,
      dataAuthority: 'Mock iRAD/eDAR Sandbox (College/Developer Environment)',
      ...options,
    });

    this.records = [...(options.records || MOCK_RAW_ACCIDENT_FEED)];
  }

  get rawRecords() {
    return this.records;
  }

  /**
   * Ingests a new raw accident record into the sandbox feed and returns its normalized form.
   */
  ingestRecord(rawRecord = {}) {
    this.records.push(rawRecord);
    return this.normalizeRecord(rawRecord);
  }

  /**
   * Maps raw feed crash types to normalized types.
   */
  mapCollisionType(rawType = '') {
    const t = rawType.toUpperCase();
    if (t.includes('HEAD_ON')) return COLLISION_TYPES.HEAD_ON;
    if (t.includes('REAR')) return COLLISION_TYPES.REAR_END;
    if (t.includes('PEDESTRIAN')) return COLLISION_TYPES.PEDESTRIAN_IMPACT;
    if (t.includes('SKID') || t.includes('OVERTURN') || t.includes('ROLLOVER')) return COLLISION_TYPES.SKID_OR_OVERTURN;
    if (t.includes('FIXED') || t.includes('POLE') || t.includes('TREE')) return COLLISION_TYPES.FIXED_OBJECT;
    if (t.includes('SIDESWIPE')) return COLLISION_TYPES.SIDESWIPE;
    return COLLISION_TYPES.OTHER;
  }

  /**
   * Maps raw severity codes to normalized levels.
   */
  mapSeverity(rawSev = '') {
    const s = rawSev.toUpperCase();
    if (s.includes('FATAL')) return OFFICIAL_SEVERITY_LEVELS.FATAL;
    if (s.includes('GRIEVOUS') || s.includes('SERIOUS')) return OFFICIAL_SEVERITY_LEVELS.GRIEVOUS_INJURY;
    if (s.includes('MINOR')) return OFFICIAL_SEVERITY_LEVELS.MINOR_INJURY;
    return OFFICIAL_SEVERITY_LEVELS.NON_INJURY_DAMAGE_ONLY;
  }

  /**
   * Maps vehicles to normalized types.
   */
  mapVehicles(vehicles = []) {
    return vehicles.map((v) => {
      const vUpper = v.toUpperCase();
      if (vUpper.includes('BUS') || vUpper.includes('TRUCK') || vUpper.includes('HEAVY')) return 'BUS_OR_TRUCK';
      if (vUpper.includes('AUTO') || vUpper.includes('CAR')) return 'CAR_OR_AUTO';
      if (vUpper.includes('MOTORCYCLE') || vUpper.includes('SCOOTER') || vUpper.includes('2W')) return 'TWO_WHEELER';
      if (vUpper.includes('PEDESTRIAN')) return 'PEDESTRIAN';
      return 'OTHER';
    });
  }

  /**
   * Normalizes raw feed payload into the canonical CivIQ official accident contract.
   */
  normalizeRecord(raw = {}) {
    const sanitized = this.sanitizeRawPayload(raw);
    const externalId = sanitized.accident_id || `MOCK-IRAD-${Date.now()}`;
    const occurredAt = sanitized.timestamp || new Date().toISOString();

    const fatalitiesCount = Number(sanitized.fatalities || 0);
    const injuredCount = Number(sanitized.injured || 0);

    const provenanceHash = this.computeProvenanceHash(externalId, occurredAt, sanitized);

    return {
      externalId,
      sourceSystem: this.sourceName,
      provenance: {
        sourceAgency: sanitized.police_station || 'Maharashtra State Police / Traffic Branch',
        externalRecordType: 'IRAD_OFFICIAL_ACCIDENT_RECORD',
        fetchedAt: new Date().toISOString(),
        dataAuthority: this.dataAuthority,
        isLiveGovernmentFeed: false, // Explicitly false for mock sandbox
        provenanceHash,
        disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
      },
      occurredAt,
      location: {
        latitude: Number(sanitized.gps_lat),
        longitude: Number(sanitized.gps_lng),
        address: sanitized.road_name || 'Accident location captured via GPS',
        roadName: sanitized.road_name || null,
        ward: sanitized.ward_name || null,
        jurisdictionId: sanitized.jurisdiction_code || 'mh-pune-pmc',
      },
      severity: this.mapSeverity(sanitized.severity_code),
      collisionType: this.mapCollisionType(sanitized.crash_type),
      casualties: {
        hasCasualties: fatalitiesCount > 0 || injuredCount > 0,
        fatalitiesCount,
        injuredCount,
        grievousInjuriesCount: sanitized.severity_code === 'GRIEVOUS_INJURY' ? injuredCount : 0,
      },
      impact: {
        fatalities: fatalitiesCount,
        injured: injuredCount,
      },
      firstInformationReportNo: sanitized.fir_no || null,
      vehiclesInvolved: this.mapVehicles(sanitized.vehicles || []),
      roadEnvironment: {
        surfaceCondition: sanitized.surface_condition || ROAD_SURFACE_CONDITIONS.DRY_NORMAL,
        lightingCondition: sanitized.lighting || LIGHTING_CONDITIONS.DAYLIGHT,
        weatherCondition: sanitized.weather || 'CLEAR',
        contributingFactors: sanitized.contributing_factors || [],
      },
      policeCaseDetails: {
        firNumber: sanitized.fir_no || null,
        policeStation: sanitized.police_station || null,
        investigatingOfficerBadge: sanitized.investigating_officer_badge || null,
      },
      rawPayload: sanitized,
      rawFeedData: sanitized,
    };
  }

  /**
   * Fetches accidents with optional filtering.
   */
  async fetchAccidents(query = {}) {
    const { since, until, jurisdictionId, corridorName, severity, limit = 50, offset = 0 } = query;

    let items = [...this.records];

    if (jurisdictionId) {
      items = items.filter(
        (r) => r.jurisdiction_code && r.jurisdiction_code.toLowerCase() === jurisdictionId.toLowerCase()
      );
    }

    if (corridorName) {
      items = items.filter(
        (r) => r.road_name && r.road_name.toLowerCase().includes(corridorName.toLowerCase())
      );
    }

    if (since) {
      const sinceMs = new Date(since).getTime();
      items = items.filter((r) => new Date(r.timestamp).getTime() >= sinceMs);
    }

    if (until) {
      const untilMs = new Date(until).getTime();
      items = items.filter((r) => new Date(r.timestamp).getTime() <= untilMs);
    }

    const paginated = items.slice(Number(offset), Number(offset) + Number(limit));
    return paginated.map((r) => this.normalizeRecord(r));
  }

  /**
   * Fetches single accident by external ID.
   */
  async fetchAccidentById(externalId) {
    const found = this.records.find(
      (r) => r.accident_id.toLowerCase() === externalId.toLowerCase()
    );
    if (!found) return null;
    return this.normalizeRecord(found);
  }

  /**
   * Executes incremental cursor-based synchronization.
   */
  async sync(cursor = null, options = {}) {
    const { batchSize = 10 } = options;

    let itemsToProcess = [...this.records];

    if (cursor) {
      const cursorTime = new Date(cursor).getTime();
      itemsToProcess = itemsToProcess.filter((r) => new Date(r.timestamp).getTime() > cursorTime);
    }

    // Sort ascending by timestamp for cursor tracking
    itemsToProcess.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const batch = itemsToProcess.slice(0, batchSize);
    const normalized = batch.map((r) => this.normalizeRecord(r));

    const newCursor = batch.length > 0 ? batch[batch.length - 1].timestamp : cursor;

    return {
      success: true,
      sourceName: this.sourceName,
      isLiveIntegration: false,
      isMockOrSandbox: true,
      records: normalized,
      recordsProcessed: normalized.length,
      newCursor,
      remainingCount: Math.max(0, itemsToProcess.length - batch.length),
    };
  }
}

export const mockSandboxIncidentAdapter = new MockSandboxIncidentAdapter();
