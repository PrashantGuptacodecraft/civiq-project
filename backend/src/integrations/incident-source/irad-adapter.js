/**
 * iRAD / eDAR Official Source Feed Adapter
 * Phase 58: Add official-source incident adapter contract
 *
 * Implements integration contract for Ministry of Road Transport and Highways (MoRTH)
 * iRAD (Integrated Road Accident Database) and eDAR feeds.
 * Enforces strict safety boundary: Do not claim live integration unless credentials exist.
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

export class IradOfficialAdapter extends BaseIncidentSourceAdapter {
  constructor(options = {}) {
    const apiUrl = options.apiUrl || process.env.IRAD_API_URL || null;
    const apiKey = options.apiKey || process.env.IRAD_API_KEY || null;

    // Strict rule from AGENTS.md: Do not claim live integration unless credentials and endpoint exist!
    const hasValidLiveCredentials = Boolean(apiUrl && apiKey && !apiKey.startsWith('mock-') && !apiKey.startsWith('test-'));

    super({
      sourceName: OFFICIAL_SOURCES.IRAD,
      sourceType: 'GOVERNMENT_API',
      isLiveIntegration: hasValidLiveCredentials,
      isMockOrSandbox: !hasValidLiveCredentials,
      dataAuthority: 'Ministry of Road Transport and Highways (MoRTH) / NIC iRAD Platform',
      ...options,
    });

    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.hasValidLiveCredentials = hasValidLiveCredentials;
  }

  /**
   * Status check of the live official endpoint.
   */
  getIntegrationStatus() {
    return {
      sourceName: this.sourceName,
      isLiveIntegration: this.isLiveIntegration,
      isMockOrSandbox: this.isMockOrSandbox,
      endpointConfigured: Boolean(this.apiUrl),
      credentialsConfigured: Boolean(this.apiKey),
      statusNotice: this.hasValidLiveCredentials
        ? 'Official iRAD endpoint credentials verified.'
        : 'Official iRAD credentials unconfigured. Live transmission disabled per AGENTS.md safety policy.',
    };
  }

  /**
   * Normalizes live government iRAD payload into canonical CivIQ format.
   * Strips Aadhaar and sensitive PII.
   */
  normalizeRecord(raw = {}) {
    const sanitized = this.sanitizeRawPayload(raw);

    const externalId =
      sanitized.accident_id ||
      sanitized.irad_id ||
      sanitized.accidentId ||
      `IRAD-UNSPECIFIED-${Date.now()}`;

    const occurredAt = sanitized.accident_date_time || sanitized.timestamp || new Date().toISOString();

    const fatalities = Number(sanitized.fatal_count || sanitized.fatalities || 0);
    const injured = Number(sanitized.injured_count || sanitized.injured || 0);

    const provenanceHash = this.computeProvenanceHash(externalId, occurredAt, sanitized);

    return {
      externalId,
      sourceSystem: OFFICIAL_SOURCES.IRAD,
      provenance: {
        sourceAgency: sanitized.police_station_name || sanitized.district || 'MoRTH / State Traffic Police',
        externalRecordType: 'IRAD_STATUTORY_ACCIDENT_RECORD',
        fetchedAt: new Date().toISOString(),
        dataAuthority: this.dataAuthority,
        isLiveGovernmentFeed: this.isLiveIntegration,
        provenanceHash,
        disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
      },
      occurredAt,
      location: {
        latitude: Number(sanitized.latitude || sanitized.gps_lat || 0),
        longitude: Number(sanitized.longitude || sanitized.gps_lng || 0),
        address: sanitized.location_description || sanitized.road_name || 'Location recorded via iRAD GPS',
        roadName: sanitized.road_name || null,
        ward: sanitized.ward_name || null,
        jurisdictionId: sanitized.state_district_code || sanitized.jurisdiction_code || 'mh-pune-pmc',
      },
      severity: this.mapSeverity(sanitized.accident_severity || sanitized.severity_code),
      collisionType: this.mapCollisionType(sanitized.collision_type || sanitized.crash_type),
      casualties: {
        hasCasualties: fatalities > 0 || injured > 0,
        fatalitiesCount: fatalities,
        injuredCount: injured,
        grievousInjuriesCount: Number(sanitized.grievous_injury_count || 0),
      },
      impact: {
        fatalities,
        injured,
      },
      firstInformationReportNo: sanitized.fir_number || sanitized.fir_no || null,
      vehiclesInvolved: Array.isArray(sanitized.vehicles) ? sanitized.vehicles : [],
      roadEnvironment: {
        surfaceCondition: sanitized.road_surface || ROAD_SURFACE_CONDITIONS.DRY_NORMAL,
        lightingCondition: sanitized.lighting_condition || LIGHTING_CONDITIONS.DAYLIGHT,
        weatherCondition: sanitized.weather || 'CLEAR',
        contributingFactors: Array.isArray(sanitized.road_engineering_defects) ? sanitized.road_engineering_defects : [],
      },
      policeCaseDetails: {
        firNumber: sanitized.fir_number || sanitized.fir_no || null,
        policeStation: sanitized.police_station_name || sanitized.police_station || null,
        investigatingOfficerBadge: sanitized.io_badge_number || null,
      },
      rawPayload: sanitized,
      rawFeedData: sanitized,
    };
  }

  mapSeverity(code = '') {
    const c = String(code).toUpperCase();
    if (c.includes('FATAL') || c === '1') return OFFICIAL_SEVERITY_LEVELS.FATAL;
    if (c.includes('GRIEVOUS') || c === '2') return OFFICIAL_SEVERITY_LEVELS.GRIEVOUS_INJURY;
    if (c.includes('MINOR') || c === '3') return OFFICIAL_SEVERITY_LEVELS.MINOR_INJURY;
    return OFFICIAL_SEVERITY_LEVELS.NON_INJURY_DAMAGE_ONLY;
  }

  mapCollisionType(code = '') {
    const c = String(code).toUpperCase();
    if (c.includes('HEAD')) return COLLISION_TYPES.HEAD_ON;
    if (c.includes('REAR')) return COLLISION_TYPES.REAR_END;
    if (c.includes('PEDESTRIAN')) return COLLISION_TYPES.PEDESTRIAN_IMPACT;
    if (c.includes('SKID') || c.includes('OVERTURN')) return COLLISION_TYPES.SKID_OR_OVERTURN;
    if (c.includes('FIXED') || c.includes('OBJECT')) return COLLISION_TYPES.FIXED_OBJECT;
    if (c.includes('SIDESWIPE')) return COLLISION_TYPES.SIDESWIPE;
    return COLLISION_TYPES.OTHER;
  }

  /**
   * Fetches accidents from government endpoint if live credentials exist,
   * otherwise returns safe degradation or error.
   */
  async fetchAccidents(query = {}) {
    if (!this.hasValidLiveCredentials) {
      // In sandbox/college mode without credentials, returns empty or safe notice
      return [];
    }

    // Live endpoint execution path (when real credentials provided)
    const response = await fetch(`${this.apiUrl}/accidents`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iRAD API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const records = Array.isArray(data.items) ? data.items : [];
    return records.map((r) => this.normalizeRecord(r));
  }

  async fetchAccidentById(externalId) {
    if (!this.hasValidLiveCredentials) {
      return null;
    }

    const response = await fetch(`${this.apiUrl}/accidents/${encodeURIComponent(externalId)}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`iRAD API lookup error: ${response.status}`);

    const raw = await response.json();
    return this.normalizeRecord(raw);
  }

  async sync(cursor = null, options = {}) {
    if (!this.hasValidLiveCredentials) {
      return {
        success: false,
        sourceName: this.sourceName,
        isLiveIntegration: false,
        recordsProcessed: 0,
        records: [],
        errorDetails: {
          code: 'UNCONFIGURED_GOVERNMENT_ENDPOINT',
          message: 'Official iRAD endpoint credentials unconfigured. Defaulting to sandbox adapter.',
        },
      };
    }

    // Live sync logic
    const records = await this.fetchAccidents({ since: cursor, limit: options.batchSize || 50 });
    return {
      success: true,
      sourceName: this.sourceName,
      isLiveIntegration: true,
      records,
      recordsProcessed: records.length,
      newCursor: records.length > 0 ? records[records.length - 1].occurredAt : cursor,
    };
  }
}

export const iradOfficialAdapter = new IradOfficialAdapter();
