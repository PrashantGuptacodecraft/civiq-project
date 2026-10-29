/**
 * Phase 58 Exit Checks: Official Source Incident Adapter Contract Tests
 * Validates adapter interface contract, PII sanitization (Aadhaar/PAN removal),
 * normalization of external accident IDs & provenance hashing,
 * college-deployment mock sandbox defaults, safety restrictions for unconfigured live feeds,
 * and REST endpoints for adapter listing, record retrieval, and sync.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  BaseIncidentSourceAdapter,
  MockSandboxIncidentAdapter,
  mockSandboxIncidentAdapter,
  IradOfficialAdapter,
  iradOfficialAdapter,
  IncidentAdapterRegistry,
  incidentAdapterRegistry,
  OFFICIAL_SOURCES,
  COLLISION_TYPES,
  OFFICIAL_SEVERITY_LEVELS,
  ROAD_SURFACE_CONDITIONS,
  LIGHTING_CONDITIONS,
  OFFICIAL_ADAPTER_DISCLAIMER,
} from './index.js';

describe('Phase 58: Official Incident Source Adapter Contract', () => {
  describe('1. Base Contract & Safety Guidelines (AGENTS.md & ADR 0002)', () => {
    class MinimalAdapter extends BaseIncidentSourceAdapter {
      normalizeRecord(raw) {
        return { externalId: raw.id, clean: this.sanitizeRawPayload(raw) };
      }
    }

    it('enforces abstract method implementation on BaseIncidentSourceAdapter', async () => {
      const base = new BaseIncidentSourceAdapter();
      await expect(base.fetchAccidents()).rejects.toThrow(/must be implemented/);
      await expect(base.fetchAccidentById('TEST-1')).rejects.toThrow(/must be implemented/);
      await expect(base.sync()).rejects.toThrow(/must be implemented/);
      expect(() => base.normalizeRecord({})).toThrow(/must be implemented/);
    });

    it('sanitizes raw feed payload by stripping raw Aadhaar numbers, PAN, and voter IDs', () => {
      const adapter = new MinimalAdapter();
      const rawWithPii = {
        id: 'ACC-2026-01',
        driverName: 'Ramesh K.',
        aadhaar_number: '1234-5678-9012',
        aadhaarNumber: '1234-5678-9012',
        pan_no: 'ABCDE1234F',
        voterId: 'VOT9876543',
        nested: {
          aadhaar: '9999-0000-1111',
          legitimateField: 'Helmet worn',
        },
        crashDetails: {
          surface: 'WET',
        },
      };

      const sanitized = adapter.sanitizeRawPayload(rawWithPii);

      expect(sanitized.aadhaar_number).toBeUndefined();
      expect(sanitized.aadhaarNumber).toBeUndefined();
      expect(sanitized.pan_no).toBeUndefined();
      expect(sanitized.voterId).toBeUndefined();
      expect(sanitized.nested.aadhaar).toBeUndefined();
      expect(sanitized.nested.legitimateField).toBe('Helmet worn');
      expect(sanitized.crashDetails.surface).toBe('WET');
      expect(sanitized.id).toBe('ACC-2026-01');
    });

    it('generates a deterministic SHA-256 provenance hash for auditability', () => {
      const adapter = new MinimalAdapter({ sourceName: 'TEST_FEED' });
      const hash1 = adapter.computeProvenanceHash('ID-100', '2026-10-29T10:00:00Z', { val: 42 });
      const hash2 = adapter.computeProvenanceHash('ID-100', '2026-10-29T10:00:00Z', { val: 42 });
      const hash3 = adapter.computeProvenanceHash('ID-101', '2026-10-29T10:00:00Z', { val: 42 });

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('2. Mock Sandbox Adapter (Default for College Deployment)', () => {
    let adapter;

    beforeEach(() => {
      adapter = new MockSandboxIncidentAdapter();
    });

    it('identifies itself as sandbox mock and not a live feed', () => {
      expect(adapter.sourceName).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);
      expect(adapter.isLiveIntegration).toBe(false);
      expect(adapter.isMockOrSandbox).toBe(true);
    });

    it('contains seeded accident records with normalized fields', async () => {
      const records = await adapter.fetchAccidents();
      expect(records.length).toBeGreaterThanOrEqual(4);

      const record = records[0];
      expect(record.externalId).toBe('IRAD-MH-PUN-2026-0042');
      expect(record.sourceSystem).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);
      expect(record.location).toBeDefined();
      expect(record.location.latitude).toBeCloseTo(18.5074, 3);
      expect(record.location.longitude).toBeCloseTo(73.8077, 3);
      expect(record.location.roadName).toBe('Paud Road Flyover Incline');
      expect(record.location.ward).toBe('Ward 5 - Kothrud');
      expect(record.location.jurisdictionId).toBe('mh-pune-pmc');
      expect(record.severity).toBe(OFFICIAL_SEVERITY_LEVELS.GRIEVOUS_INJURY);
      expect(record.collisionType).toBe(COLLISION_TYPES.HEAD_ON);
      expect(record.impact.fatalities).toBe(0);
      expect(record.impact.injured).toBe(3);
      expect(record.provenance.provenanceHash).toBeDefined();
      expect(record.provenance.disclaimer).toContain('CivIQ integration adapter');
      expect(record.provenance.isLiveGovernmentFeed).toBe(false);

      // Verify that Aadhaar was stripped from raw feed payload
      expect(record.rawFeedData.aadhaar_number).toBeUndefined();
    });

    it('fetches record by external ID', async () => {
      const record = await adapter.fetchAccidentById('IRAD-MH-PUN-2026-0042');
      expect(record).not.toBeNull();
      expect(record.externalId).toBe('IRAD-MH-PUN-2026-0042');
      expect(record.firstInformationReportNo).toBe('FIR-2026-PS-KOTHRUD-0189');

      const nonExistent = await adapter.fetchAccidentById('NON-EXISTENT-ID');
      expect(nonExistent).toBeNull();
    });

    it('filters records by jurisdiction and corridor', async () => {
      const pmcRecords = await adapter.fetchAccidents({ jurisdictionId: 'mh-pune-pmc' });
      expect(pmcRecords.length).toBeGreaterThan(0);
      pmcRecords.forEach((r) => {
        expect(r.location.jurisdictionId).toBe('mh-pune-pmc');
      });

      const pcmcRecords = await adapter.fetchAccidents({ jurisdictionId: 'mh-pune-pcmc' });
      expect(pcmcRecords.length).toBeGreaterThan(0);
      pcmcRecords.forEach((r) => {
        expect(r.location.jurisdictionId).toBe('mh-pune-pcmc');
      });

      const corridorRecords = await adapter.fetchAccidents({ corridorName: 'Paud' });
      expect(corridorRecords.length).toBe(1);
      expect(corridorRecords[0].location.roadName).toContain('Paud');
    });

    it('executes incremental cursor-based synchronization', async () => {
      // First sync: no cursor, batchSize 2
      const firstSync = await adapter.sync(null, { batchSize: 2 });
      expect(firstSync.success).toBe(true);
      expect(firstSync.recordsProcessed).toBe(2);
      expect(firstSync.records.length).toBe(2);
      expect(firstSync.newCursor).toBeDefined();

      // Second sync: pass cursor
      const secondSync = await adapter.sync(firstSync.newCursor, { batchSize: 2 });
      expect(secondSync.success).toBe(true);
      expect(secondSync.recordsProcessed).toBe(2);
      expect(secondSync.records.length).toBe(2);

      // Ensure records in first and second batch do not overlap
      const ids1 = firstSync.records.map((r) => r.externalId);
      const ids2 = secondSync.records.map((r) => r.externalId);
      for (const id of ids1) {
        expect(ids2).not.toContain(id);
      }
    });

    it('allows dynamic ingestion and normalization of new raw accident data', () => {
      const initialCount = adapter.rawRecords.length;
      const normalized = adapter.ingestRecord({
        accident_id: 'IRAD-MH-PUN-2026-9999',
        fir_no: 'FIR-2026-TEST-9999',
        timestamp: '2026-10-29T11:00:00Z',
        gps_lat: 18.5200,
        gps_lng: 73.8500,
        road_name: 'JM Road',
        crash_type: 'SKID_OR_OVERTURN',
        severity_code: 'MINOR_INJURY',
        aadhaar_number: '1234-9999-0000',
      });

      expect(adapter.rawRecords.length).toBe(initialCount + 1);
      expect(normalized.externalId).toBe('IRAD-MH-PUN-2026-9999');
      expect(normalized.collisionType).toBe(COLLISION_TYPES.SKID_OR_OVERTURN);
      expect(normalized.rawFeedData.aadhaar_number).toBeUndefined();
    });
  });

  describe('3. Official iRAD/eDAR Adapter & Live Credentials Safety Guard', () => {
    it('disables live integration mode when credentials are missing or mocked', () => {
      // Default instance with no env credentials
      const adapter = new IradOfficialAdapter();
      expect(adapter.isLiveIntegration).toBe(false);
      expect(adapter.isMockOrSandbox).toBe(true);

      const status = adapter.getIntegrationStatus();
      expect(status.isLiveIntegration).toBe(false);
      expect(status.statusNotice).toContain('Live transmission disabled per AGENTS.md safety policy');
    });

    it('enables live integration mode ONLY when real URL and non-mock API key exist', () => {
      const realAdapter = new IradOfficialAdapter({
        apiUrl: 'https://irad.parivahan.gov.in/api/v1/incidents',
        apiKey: 'prod-sec-key-morth-nic-88492048',
      });
      expect(realAdapter.isLiveIntegration).toBe(true);
      expect(realAdapter.isMockOrSandbox).toBe(false);

      const status = realAdapter.getIntegrationStatus();
      expect(status.endpointConfigured).toBe(true);
      expect(status.credentialsConfigured).toBe(true);
      expect(status.statusNotice).toContain('Official iRAD endpoint credentials verified');
    });

    it('normalizes government iRAD payload and removes sensitive Aadhaar data', () => {
      const adapter = new IradOfficialAdapter();
      const normalized = adapter.normalizeRecord({
        accident_id: 'IRAD-GOV-2026-001',
        fir_no: 'FIR-GOV-001',
        police_station_name: 'Kothrud Police Station',
        accident_date_time: '2026-10-29T07:30:00Z',
        latitude: 18.5080,
        longitude: 73.8090,
        road_name: 'Paud Road',
        accident_severity: 'FATAL',
        collision_type: 'HEAD_ON',
        fatal_count: 1,
        injured_count: 2,
        aadhaar_no: '8888-7777-6666',
      });

      expect(normalized.externalId).toBe('IRAD-GOV-2026-001');
      expect(normalized.severity).toBe(OFFICIAL_SEVERITY_LEVELS.FATAL);
      expect(normalized.collisionType).toBe(COLLISION_TYPES.HEAD_ON);
      expect(normalized.impact.fatalities).toBe(1);
      expect(normalized.impact.injured).toBe(2);
      expect(normalized.rawFeedData.aadhaar_no).toBeUndefined();
      expect(normalized.provenance.provenanceHash).toBeDefined();
      expect(normalized.provenance.disclaimer).toBe(OFFICIAL_ADAPTER_DISCLAIMER);
    });
  });

  describe('4. Incident Adapter Registry', () => {
    let registry;

    beforeEach(() => {
      registry = new IncidentAdapterRegistry();
    });

    it('defaults to mock-sandbox adapter for college deployment', () => {
      const defaultAdapter = registry.getDefaultAdapter();
      expect(defaultAdapter.sourceName).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);
      expect(defaultAdapter.isMockOrSandbox).toBe(true);

      // getAdapter() with empty or unknown string falls back to default sandbox adapter
      const adapter1 = registry.getAdapter();
      expect(adapter1.sourceName).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);

      const adapter2 = registry.getAdapter('unknown-foreign-system');
      expect(adapter2.sourceName).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);
    });

    it('retrieves official iRAD adapter when requested', () => {
      const adapter = registry.getAdapter('irad');
      expect(adapter.sourceName).toBe(OFFICIAL_SOURCES.IRAD);
    });

    it('lists registered adapters and indicates default for college deployment', () => {
      const list = registry.listAdapters();
      expect(list.length).toBeGreaterThanOrEqual(2);

      const sandboxEntry = list.find((a) => a.sourceName === OFFICIAL_SOURCES.MOCK_SANDBOX);
      expect(sandboxEntry).toBeDefined();
      expect(sandboxEntry.isDefault).toBe(true);
      expect(sandboxEntry.isMockOrSandbox).toBe(true);

      const iradEntry = list.find((a) => a.sourceName === OFFICIAL_SOURCES.IRAD);
      expect(iradEntry).toBeDefined();
      expect(iradEntry.isDefault).toBe(false);
    });
  });

  describe('5. REST Endpoints (/integrations/incident-source)', () => {
    it('GET /integrations/incident-source/adapters returns registry list', async () => {
      const res = await request(app).get('/integrations/incident-source/adapters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.defaultAdapter).toBe('MOCK_SANDBOX');
      expect(res.body.disclaimer).toBeDefined();
      expect(Array.isArray(res.body.adapters)).toBe(true);
      expect(res.body.adapters.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /integrations/incident-source/records returns normalized mock records', async () => {
      const res = await request(app).get('/integrations/incident-source/records');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isMockOrSandbox).toBe(true);
      expect(res.body.sourceName).toBe(OFFICIAL_SOURCES.MOCK_SANDBOX);
      expect(res.body.count).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records[0].externalId).toBeDefined();
    });

    it('GET /integrations/incident-source/records supports query filters', async () => {
      const res = await request(app)
        .get('/integrations/incident-source/records')
        .query({ jurisdictionId: 'mh-pune-pmc', limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.records.length).toBe(2);
      expect(res.body.records[0].location.jurisdictionId).toBe('mh-pune-pmc');
    });

    it('GET /integrations/incident-source/records/:externalId retrieves single record or returns 404', async () => {
      const resValid = await request(app).get('/integrations/incident-source/records/IRAD-MH-PUN-2026-0042');
      expect(resValid.status).toBe(200);
      expect(resValid.body.success).toBe(true);
      expect(resValid.body.record.externalId).toBe('IRAD-MH-PUN-2026-0042');
      expect(resValid.body.disclaimer).toBeDefined();

      const resNotFound = await request(app).get('/integrations/incident-source/records/IRAD-NON-EXISTENT');
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.success).toBe(false);
      expect(resNotFound.body.error).toContain('not found');
    });

    it('POST /integrations/incident-source/sync triggers incremental cursor sync', async () => {
      const res = await request(app)
        .post('/integrations/incident-source/sync')
        .send({ adapter: 'mock-sandbox', batchSize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recordsProcessed).toBe(2);
      expect(res.body.newCursor).toBeDefined();
      expect(res.body.isMockOrSandbox).toBe(true);
    });
  });
});
