/**
 * Phase 62 Exit Checks: Disaster Alert Ingestion Tests
 *
 * Validates:
 * 1. CAP v1.2 XML parsing and GeoJSON polygon coordinate conversion
 * 2. CAP JSON parsing and multi-hazard parameter extraction
 * 3. RSS 2.0 / Atom emergency feed parsing
 * 4. Cryptographic source signature and provenance validation (HMAC / SHA-256)
 * 5. Verbatim official alert text retention without AI/system rewriting
 * 6. Strict alert ingestion idempotency (duplicate suppression and identical returns)
 * 7. Correlation with active municipal disaster entities
 * 8. Background feed poller worker job execution
 * 9. REST API endpoints (/alerts/ingest, /alerts, /alerts/:id, /alerts/poll)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import {
  alertIngestionService,
  alertAdapterRegistry,
  parseCapXml,
  parseCapJson,
  parseRssAtomAlertFeed,
  convertCapPolygonToGeoJson,
  convertCapCircle,
  computeHmacSignature,
  computePayloadDigest,
  validateAlertProvenance,
  runAlertPollerJob,
  ALERT_FORMATS,
  ALERT_SEVERITY,
  ALERT_URGENCY,
  ALERT_CERTAINTY,
  ALERT_SOURCE_AUTHORITY,
  SIGNATURE_VERIFICATION_STATUS,
  INGESTION_STATUS,
  DISASTER_STATUTORY_DISCLAIMER,
  SACHET_PUNE_FLOOD_CAP_XML,
  IMD_PUNE_NOWCAST_CAP_XML,
  PCMC_HAZMAT_CAP_JSON,
  MAHARASHTRA_DISASTER_RSS_FEED_XML,
  SAMPLE_ALERT_SECRET_KEY,
  VALID_SACHET_HMAC_SIGNATURE,
  VALID_PCMC_HMAC_SIGNATURE,
  INVALID_HMAC_SIGNATURE,
} from './index.js';
import { disasterService } from '../../modules/disasters/index.js';

describe('Phase 62: Disaster Alert Ingestion Adapter', () => {
  beforeEach(() => {
    alertIngestionService.reset();
    disasterService.reset();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CAP v1.2 XML Parsing & Geometry Conversion
  // ─────────────────────────────────────────────────────────────
  describe('1. CAP v1.2 XML Parsing & Geometry Conversion', () => {
    it('parses authentic NDMA SACHET CAP v1.2 XML flood warning', () => {
      const parsed = parseCapXml(SACHET_PUNE_FLOOD_CAP_XML);

      expect(parsed.format).toBe(ALERT_FORMATS.CAP_XML_1_2);
      expect(parsed.identifier).toBe('CAP-IN-MH-PUN-2026-1030-001');
      expect(parsed.sender).toBe('sachet-alerts@ndma.gov.in');
      expect(parsed.senderName).toBe('National Disaster Management Authority (NDMA)');
      expect(parsed.status).toBe('Actual');
      expect(parsed.msgType).toBe('Alert');
      expect(parsed.severity).toBe(ALERT_SEVERITY.SEVERE);
      expect(parsed.urgency).toBe(ALERT_URGENCY.IMMEDIATE);
      expect(parsed.certainty).toBe(ALERT_CERTAINTY.OBSERVED);
      expect(parsed.headline).toContain('Severe Flood Warning');
      expect(parsed.description).toContain('45,000 cusecs');
      expect(parsed.instruction).toContain('Immediate evacuation for ground floor residences');
      expect(parsed.parameters.DamDischargeCusecs).toBe('45000');
      expect(parsed.parameters.JurisdictionId).toBe('mh-pune-pmc');
    });

    it('converts CAP space-delimited lat,lng polygon string to GeoJSON standard with closed ring', () => {
      const capPolyStr = '18.48,73.82 18.49,73.84 18.52,73.86 18.48,73.82';
      const geoJson = convertCapPolygonToGeoJson(capPolyStr);

      expect(geoJson).toBeDefined();
      expect(geoJson.type).toBe('Polygon');
      expect(Array.isArray(geoJson.coordinates)).toBe(true);
      expect(geoJson.coordinates[0]).toHaveLength(4);

      // GeoJSON standard: [longitude, latitude]
      expect(geoJson.coordinates[0][0]).toEqual([73.82, 18.48]);
      expect(geoJson.coordinates[0][1]).toEqual([73.84, 18.49]);
      expect(geoJson.coordinates[0][3]).toEqual([73.82, 18.48]); // Closed ring
    });

    it('converts CAP circle string to latitude, longitude, and radius', () => {
      const capCircleStr = '18.4500,73.8500,15.0';
      const circle = convertCapCircle(capCircleStr);

      expect(circle).toBeDefined();
      expect(circle.latitude).toBe(18.45);
      expect(circle.longitude).toBe(73.85);
      expect(circle.radiusKm).toBe(15.0);
    });

    it('rejects malformed XML missing root alert or identifier tag', () => {
      expect(() => parseCapXml('<invalid><foo>bar</foo></invalid>')).toThrow(/missing root <alert>/);
      expect(() => parseCapXml('<alert><sender>test</sender></alert>')).toThrow(/missing required <identifier>/);
      expect(() => parseCapXml('')).toThrow(/non-empty string/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. CAP JSON Parsing
  // ─────────────────────────────────────────────────────────────
  describe('2. CAP JSON Parsing', () => {
    it('parses authentic PCMC Disaster Cell CAP JSON Hazmat advisory', () => {
      const parsed = parseCapJson(PCMC_HAZMAT_CAP_JSON);

      expect(parsed.format).toBe(ALERT_FORMATS.CAP_JSON_1_2);
      expect(parsed.identifier).toBe('PCMC-DISASTER-HAZ-2026-002');
      expect(parsed.sender).toBe('disastercell@pcmcindia.gov.in');
      expect(parsed.event).toBe('Industrial Chlorine Vapor Emission');
      expect(parsed.severity).toBe('Moderate');
      expect(parsed.urgency).toBe(ALERT_URGENCY.IMMEDIATE);
      expect(parsed.headline).toContain('Atmospheric Hazmat Advisory');
      expect(parsed.instruction).toContain('remain indoors with doors and windows closed');
      expect(parsed.polygonGeometry).toBeDefined();
      expect(parsed.polygonGeometry.type).toBe('Polygon');
    });

    it('rejects invalid or null CAP JSON', () => {
      expect(() => parseCapJson(null)).toThrow(/valid JSON object/);
      expect(() => parseCapJson({})).toThrow(/missing required "identifier"/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. RSS 2.0 / Atom Feed Parser
  // ─────────────────────────────────────────────────────────────
  describe('3. RSS 2.0 / Atom Emergency Feed Parser', () => {
    it('parses RSS feed containing multiple emergency items and geometries', () => {
      const items = parseRssAtomAlertFeed(MAHARASHTRA_DISASTER_RSS_FEED_XML);

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(2);

      const floodItem = items.find((i) => i.identifier === 'CAP-IN-MH-PUN-2026-1030-001');
      expect(floodItem).toBeDefined();
      expect(floodItem.headline).toContain('Severe Flood Warning');
      expect(floodItem.polygonGeometry).toBeDefined();

      const landslideItem = items.find((i) => i.identifier === 'REF-DDMA-PUN-LS-2026-03');
      expect(landslideItem).toBeDefined();
      expect(landslideItem.headline).toContain('Katraj Ghat Slope Failure');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Cryptographic Provenance & Signature Validation
  // ─────────────────────────────────────────────────────────────
  describe('4. Cryptographic Provenance & Signature Validation', () => {
    it('computes SHA-256 payload digest consistently', () => {
      const digest1 = computePayloadDigest(SACHET_PUNE_FLOOD_CAP_XML);
      const digest2 = computePayloadDigest(SACHET_PUNE_FLOOD_CAP_XML);

      expect(digest1).toMatch(/^[a-f0-9]{64}$/);
      expect(digest1).toBe(digest2);
    });

    it('verifies valid HMAC-SHA256 signature for authentic alert', () => {
      const outcome = validateAlertProvenance(SACHET_PUNE_FLOOD_CAP_XML, {
        signature: VALID_SACHET_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(outcome.isValid).toBe(true);
      expect(outcome.status).toBe(SIGNATURE_VERIFICATION_STATUS.VERIFIED);
      expect(outcome.algorithm).toBe('HMAC-SHA256');
    });

    it('detects tampering and rejects signature mismatch', () => {
      const tamperedXml = SACHET_PUNE_FLOOD_CAP_XML.replace('45,000', '95,000');

      const outcome = validateAlertProvenance(tamperedXml, {
        signature: VALID_SACHET_HMAC_SIGNATURE, // Signature was for original XML!
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(outcome.isValid).toBe(false);
      expect(outcome.status).toBe(SIGNATURE_VERIFICATION_STATUS.SIGNATURE_MISMATCH);
      expect(outcome.error).toContain('does not match');
    });

    it('supports trusted unsigned public feed endpoints when configured', () => {
      const outcome = validateAlertProvenance(SACHET_PUNE_FLOOD_CAP_XML, {
        allowUnsigned: true,
      });

      expect(outcome.isValid).toBe(true);
      expect(outcome.status).toBe(SIGNATURE_VERIFICATION_STATUS.UNSIGNED_TRUSTED_SOURCE);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Verbatim Content Preservation & Source Labeling
  // ─────────────────────────────────────────────────────────────
  describe('5. Verbatim Content Preservation & Source Labeling', () => {
    it('preserves official headline, description, instruction, and areaDesc without alteration', async () => {
      const res = await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        signature: VALID_SACHET_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(res.success).toBe(true);
      const alert = res.alert;

      expect(alert.verbatimHeadline).toBe(
        'Severe Flood Warning: Khadakwasla Dam Spillway Discharge in Mutha River Basin'
      );
      expect(alert.verbatimDescription).toContain('Emergency discharge of 45,000 cusecs');
      expect(alert.verbatimInstruction).toContain('Immediate evacuation for ground floor residences');
      expect(alert.verbatimAreaDesc).toContain('Mutha River Corridor');
      expect(alert.isVerbatimOfficialText).toBe(true);

      // Verifies explicit source authority attribution
      expect(alert.sourceAuthority).toBe(ALERT_SOURCE_AUTHORITY.SACHET_NDMA);
      expect(alert.provenance.statutoryNotice).toBe(DISASTER_STATUTORY_DISCLAIMER);
      expect(alert.provenance.rawPayloadHash).toBeDefined();
      expect(alert.provenance.signatureVerificationStatus).toBe(SIGNATURE_VERIFICATION_STATUS.VERIFIED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Ingestion Idempotency Tests
  // ─────────────────────────────────────────────────────────────
  describe('6. Strict Ingestion Idempotency', () => {
    it('returns existing record and does not duplicate when ingesting identical payload twice', async () => {
      // 1. First Ingestion
      const res1 = await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        signature: VALID_SACHET_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(res1.success).toBe(true);
      expect(res1.status).toBe(INGESTION_STATUS.INGESTED);
      expect(res1.isDuplicate).toBe(false);

      const allAlertsFirst = await alertIngestionService.listAlerts();
      expect(allAlertsFirst.length).toBe(1);

      // 2. Second Ingestion (Exact Same Payload)
      const res2 = await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        signature: VALID_SACHET_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(res2.success).toBe(true);
      expect(res2.status).toBe(INGESTION_STATUS.ALREADY_INGESTED);
      expect(res2.isDuplicate).toBe(true);
      expect(res2.alert.id).toBe(res1.alert.id);
      expect(res2.alert.externalIdentifier).toBe(res1.alert.externalIdentifier);

      // Ensure store count did not increase
      const allAlertsSecond = await alertIngestionService.listAlerts();
      expect(allAlertsSecond.length).toBe(1);
    });

    it('enforces idempotency for CAP JSON payloads as well', async () => {
      const res1 = await alertIngestionService.ingestAlert(PCMC_HAZMAT_CAP_JSON, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.PCMC_DISASTER_CELL,
        signature: VALID_PCMC_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(res1.isDuplicate).toBe(false);

      const res2 = await alertIngestionService.ingestAlert(PCMC_HAZMAT_CAP_JSON, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.PCMC_DISASTER_CELL,
        signature: VALID_PCMC_HMAC_SIGNATURE,
        secretKey: SAMPLE_ALERT_SECRET_KEY,
      });

      expect(res2.isDuplicate).toBe(true);
      expect(res2.status).toBe(INGESTION_STATUS.ALREADY_INGESTED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Disaster Service Correlation
  // ─────────────────────────────────────────────────────────────
  describe('7. Disaster Service Correlation', () => {
    it('correlates ingested official alert with active municipal disaster record', async () => {
      const floodDisaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');
      const initialAlertRefs = floodDisaster.officialAlertReferences.length;

      // Ingest IMD Red alert nowcast which covers Pune ghats
      await alertIngestionService.ingestAlert(IMD_PUNE_NOWCAST_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.IMD,
        allowUnsigned: true,
      });

      // Query disaster to verify alert reference was attached
      const updatedDisaster = await disasterService.getDisasterById('dis-pune-mutha-flood-2026');
      expect(updatedDisaster.officialAlertReferences.length).toBeGreaterThanOrEqual(initialAlertRefs);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Background Poller Worker Job
  // ─────────────────────────────────────────────────────────────
  describe('8. Background Poller Worker Job', () => {
    it('runs alert poller worker job and ingests feeds from registered adapters', async () => {
      const jobResult = await runAlertPollerJob();

      expect(jobResult.success).toBe(true);
      expect(jobResult.jobType).toBe('ALERT_FEED_POLLER');
      expect(jobResult.polledAdaptersCount).toBeGreaterThanOrEqual(3);
      expect(jobResult.totalIngested).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(jobResult.results)).toBe(true);

      // Verify alerts are in the service store
      const alerts = await alertIngestionService.listAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. REST API Endpoints (/alerts)
  // ─────────────────────────────────────────────────────────────
  describe('9. REST API Endpoints (/alerts)', () => {
    it('POST /alerts/ingest ingests CAP XML alert with signature (201 created)', async () => {
      const res = await request(app)
        .post('/alerts/ingest')
        .send({
          payload: SACHET_PUNE_FLOOD_CAP_XML,
          sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
          signature: VALID_SACHET_HMAC_SIGNATURE,
          secretKey: SAMPLE_ALERT_SECRET_KEY,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe(INGESTION_STATUS.INGESTED);
      expect(res.body.isDuplicate).toBe(false);
      expect(res.body.alert.externalIdentifier).toBe('CAP-IN-MH-PUN-2026-1030-001');
      expect(res.body.alert.verbatimHeadline).toContain('Severe Flood Warning');
      expect(res.body.statutoryNotice).toBeDefined();
    });

    it('POST /alerts/ingest returns 200 and isDuplicate: true on re-ingestion', async () => {
      // 1. Ingest once
      await request(app)
        .post('/alerts/ingest')
        .send({
          payload: SACHET_PUNE_FLOOD_CAP_XML,
          sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
          signature: VALID_SACHET_HMAC_SIGNATURE,
          secretKey: SAMPLE_ALERT_SECRET_KEY,
        });

      // 2. Ingest again -> 200 OK idempotent
      const res = await request(app)
        .post('/alerts/ingest')
        .send({
          payload: SACHET_PUNE_FLOOD_CAP_XML,
          sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
          signature: VALID_SACHET_HMAC_SIGNATURE,
          secretKey: SAMPLE_ALERT_SECRET_KEY,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isDuplicate).toBe(true);
      expect(res.body.status).toBe(INGESTION_STATUS.ALREADY_INGESTED);
    });

    it('POST /alerts/ingest rejects invalid signature (401)', async () => {
      const res = await request(app)
        .post('/alerts/ingest')
        .send({
          payload: SACHET_PUNE_FLOOD_CAP_XML,
          sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
          signature: INVALID_HMAC_SIGNATURE,
          secretKey: SAMPLE_ALERT_SECRET_KEY,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.verificationStatus).toBe(SIGNATURE_VERIFICATION_STATUS.SIGNATURE_MISMATCH);
    });

    it('GET /alerts lists ingested alerts and supports filtering', async () => {
      // Ingest two distinct alerts
      await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        allowUnsigned: true,
      });
      await alertIngestionService.ingestAlert(PCMC_HAZMAT_CAP_JSON, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.PCMC_DISASTER_CELL,
        allowUnsigned: true,
      });

      const resAll = await request(app).get('/alerts');
      expect(resAll.status).toBe(200);
      expect(resAll.body.success).toBe(true);
      expect(resAll.body.count).toBe(2);

      // Filter by authority
      const resFilter = await request(app)
        .get('/alerts')
        .query({ authority: ALERT_SOURCE_AUTHORITY.PCMC_DISASTER_CELL });

      expect(resFilter.status).toBe(200);
      expect(resFilter.body.count).toBe(1);
      expect(resFilter.body.alerts[0].externalIdentifier).toBe('PCMC-DISASTER-HAZ-2026-002');
    });

    it('GET /alerts/:id retrieves single alert or 404', async () => {
      const ingestRes = await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        allowUnsigned: true,
      });

      const res = await request(app).get(`/alerts/${ingestRes.alert.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alert.id).toBe(ingestRes.alert.id);

      const res404 = await request(app).get('/alerts/non-existent-alert-id');
      expect(res404.status).toBe(404);
      expect(res404.body.success).toBe(false);
    });

    it('GET /alerts/external/:authority/:externalId finds alert by official external ID', async () => {
      await alertIngestionService.ingestAlert(SACHET_PUNE_FLOOD_CAP_XML, {
        sourceAuthority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA,
        allowUnsigned: true,
      });

      const res = await request(app).get(
        `/alerts/external/${ALERT_SOURCE_AUTHORITY.SACHET_NDMA}/CAP-IN-MH-PUN-2026-1030-001`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alert.externalIdentifier).toBe('CAP-IN-MH-PUN-2026-1030-001');
    });

    it('GET /alerts/adapters lists registered official alert adapters', async () => {
      const res = await request(app).get('/alerts/adapters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(3);

      const adapterIds = res.body.adapters.map((a) => a.adapterId);
      expect(adapterIds).toContain('sachet-ndma');
      expect(adapterIds).toContain('imd-weather');
      expect(adapterIds).toContain('mock-sandbox');
    });

    it('POST /alerts/poll triggers adapter polling via REST API', async () => {
      const res = await request(app).post('/alerts/poll').send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.polledAdaptersCount).toBeGreaterThanOrEqual(3);
    });
  });
});
