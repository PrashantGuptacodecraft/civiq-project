/**
 * Disaster Alert Ingestion Service
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - Authoritative alert ingestion engine with strict idempotency
 * - Verification of cryptographic source provenance & digital signatures
 * - Verbatim retention of official government warning content and instructions
 * - Correlation with active municipal disaster events (Phase 61 DisasterService)
 */

import {
  ALERT_SOURCE_AUTHORITY,
  INGESTION_STATUS,
  DISASTER_STATUTORY_DISCLAIMER,
} from './alert-adapter.types.js';
import {
  parseCapXml,
  parseCapJson,
  parseRssAtomAlertFeed,
  normalizeIngestedAlert,
} from './alert-parser.js';
import { validateAlertProvenance, computePayloadDigest } from './alert-signature.js';
import { alertAdapterRegistry } from './alert-adapter-registry.js';
import { disasterService } from '../../modules/disasters/index.js';

export class AlertIngestionService {
  constructor() {
    this.alerts = new Map(); // internalId -> IngestedAlert
    this.externalIndex = new Map(); // `${authority}:${externalIdentifier}` -> internalId
    this.hashIndex = new Map(); // rawPayloadHash -> internalId
    this.auditLog = [];
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.alerts.clear();
    this.externalIndex.clear();
    this.hashIndex.clear();
    this.auditLog = [];
  }

  /**
   * Ingests a raw alert payload (CAP XML, CAP JSON, or RSS feed).
   * Guarantees strict idempotency: re-ingesting identical alert returns existing record.
   *
   * @param {string|Object} rawPayload - Raw alert payload
   * @param {Object} options - Ingestion options:
   *   - sourceAuthority: Authority enum
   *   - signature: Cryptographic hex signature
   *   - secretKey: Key to verify signature
   *   - allowUnsigned: Boolean
   *   - format: 'CAP_XML_1_2', 'CAP_JSON_1_2', etc.
   *   - correlateWithDisasters: Boolean (default true)
   * @returns {Promise<Object>} Outcome { success, status, isDuplicate, alert, message }
   */
  async ingestAlert(rawPayload, options = {}) {
    if (!rawPayload) {
      const err = new Error('rawPayload is required for alert ingestion.');
      err.statusCode = 400;
      throw err;
    }

    const payloadString =
      typeof rawPayload === 'string'
        ? rawPayload
        : JSON.stringify(rawPayload);

    const payloadHash = computePayloadDigest(payloadString);

    // 1. Fast-Path Idempotency Check by Payload Hash
    if (this.hashIndex.has(payloadHash)) {
      const existingId = this.hashIndex.get(payloadHash);
      const existingAlert = this.alerts.get(existingId);
      if (existingAlert) {
        return {
          success: true,
          status: INGESTION_STATUS.ALREADY_INGESTED,
          isDuplicate: true,
          alert: existingAlert,
          message: 'Official alert with identical payload already ingested; returning existing record.',
          statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
        };
      }
    }

    // 2. Parse Raw Alert
    let parsed;
    try {
      if (typeof rawPayload === 'string' && rawPayload.trim().startsWith('<')) {
        if (rawPayload.includes('<rss') || rawPayload.includes('<feed')) {
          const items = parseRssAtomAlertFeed(rawPayload, options);
          parsed = items[0];
          if (!parsed) {
            throw new Error('Feed contained no parseable emergency alert items.');
          }
        } else {
          parsed = parseCapXml(rawPayload, options);
        }
      } else {
        parsed = parseCapJson(rawPayload, options);
      }
    } catch (parseErr) {
      const err = new Error(`Failed to parse alert payload: ${parseErr.message}`);
      err.statusCode = 400;
      throw err;
    }

    const authority = options.sourceAuthority || ALERT_SOURCE_AUTHORITY.SACHET_NDMA;
    const externalKey = `${authority}:${parsed.identifier}`;

    // 3. Second Idempotency Check by External Identifier & Authority
    if (this.externalIndex.has(externalKey)) {
      const existingId = this.externalIndex.get(externalKey);
      const existingAlert = this.alerts.get(existingId);
      if (existingAlert) {
        return {
          success: true,
          status: INGESTION_STATUS.ALREADY_INGESTED,
          isDuplicate: true,
          alert: existingAlert,
          message: `Official alert '${parsed.identifier}' from '${authority}' already ingested; returning existing record.`,
          statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
        };
      }
    }

    // 4. Validate Cryptographic Provenance / Signature
    const provCheck = validateAlertProvenance(payloadString, {
      signature: options.signature,
      secretKey: options.secretKey,
      allowUnsigned: options.allowUnsigned !== false,
      expectedDigest: options.expectedDigest,
    });

    if (!provCheck.isValid && options.enforceSignature !== false && options.secretKey) {
      const err = new Error(`Official alert signature verification failed: ${provCheck.error}`);
      err.statusCode = 401;
      err.status = INGESTION_STATUS.REJECTED_SIGNATURE_MISMATCH;
      err.verificationStatus = provCheck.status;
      throw err;
    }

    // 5. Normalize Alert Record Preserving Verbatim Content
    const normalizedAlert = normalizeIngestedAlert(parsed, rawPayload, {
      sourceAuthority: authority,
      signatureStatus: provCheck.status,
      signatureAlgorithm: provCheck.algorithm,
      feedUrl: options.feedUrl || null,
    });

    // 6. Store in Indexes
    this.alerts.set(normalizedAlert.id, normalizedAlert);
    this.externalIndex.set(externalKey, normalizedAlert.id);
    this.hashIndex.set(payloadHash, normalizedAlert.id);

    // Audit log
    this.auditLog.push({
      action: 'ALERT_INGESTED',
      alertId: normalizedAlert.id,
      authority,
      externalIdentifier: parsed.identifier,
      timestamp: new Date().toISOString(),
      signatureStatus: provCheck.status,
    });

    // 7. Correlate with DisasterService if applicable
    if (options.correlateWithDisasters !== false) {
      await this._correlateWithActiveDisasters(normalizedAlert);
    }

    return {
      success: true,
      status: INGESTION_STATUS.INGESTED,
      isDuplicate: false,
      alert: normalizedAlert,
      message: 'Official statutory alert ingested successfully.',
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }

  /**
   * Correlates newly ingested alert with active disaster event entities.
   */
  async _correlateWithActiveDisasters(alert) {
    try {
      const activeDisasters = await disasterService.listDisasters({ isActive: true });

      for (const disaster of activeDisasters) {
        // Match 1: Alert references an existing disaster or externalAlertId
        const hasRef = disaster.officialAlertReferences.some(
          (ref) => ref.externalAlertId === alert.externalIdentifier
        );

        // Match 2: Bounding box overlap or polygon proximity if available
        let matchesLocation = false;
        if (alert.affectedPolygon && disaster.affectedPolygon) {
          // Alert has polygon geometry; correlate with active disaster in same jurisdiction
          const jurisdictionParam = alert.parameters?.JurisdictionId;
          if (jurisdictionParam && disaster.jurisdictionIds.includes(jurisdictionParam)) {
            matchesLocation = true;
          }
        }

        if (hasRef || matchesLocation) {
          // Attach official alert reference if not already attached
          const alreadyLinked = disaster.officialAlertReferences.some(
            (ref) => ref.externalAlertId === alert.externalIdentifier
          );

          if (!alreadyLinked) {
            await disasterService.attachOfficialAlertReference(disaster.id, {
              authority: alert.sourceAuthority,
              externalAlertId: alert.externalIdentifier,
              alertHeadline: alert.verbatimHeadline,
              issuedAt: alert.sentAt,
              sourceUrl: alert.web,
              sourceSignatureHash: alert.provenance.rawPayloadHash,
            });
          }
        }
      }
    } catch {
      // Correlation failure should not prevent alert ingestion
    }
  }

  /**
   * Retrieves an ingested alert by internal ID.
   */
  async getAlertById(id) {
    return this.alerts.get(id) || null;
  }

  /**
   * Retrieves an ingested alert by authority and external identifier.
   */
  async getAlertByExternalId(authority, externalIdentifier) {
    const key = `${authority}:${externalIdentifier}`;
    const internalId = this.externalIndex.get(key);
    if (!internalId) return null;
    return this.alerts.get(internalId) || null;
  }

  /**
   * Lists ingested alerts with optional filters.
   */
  async listAlerts(filter = {}) {
    let list = Array.from(this.alerts.values());

    if (filter.authority) {
      list = list.filter((a) => a.sourceAuthority === filter.authority);
    }

    if (filter.severity) {
      list = list.filter((a) => a.severity.toLowerCase() === filter.severity.toLowerCase());
    }

    if (filter.urgency) {
      list = list.filter((a) => a.urgency.toLowerCase() === filter.urgency.toLowerCase());
    }

    if (filter.event) {
      list = list.filter((a) => a.event.toLowerCase().includes(filter.event.toLowerCase()));
    }

    if (filter.status) {
      list = list.filter((a) => a.status.toLowerCase() === filter.status.toLowerCase());
    }

    return list;
  }

  /**
   * Polls registered alert adapters and ingests any newly published alerts.
   * @param {Array<string>} adapterIds - Optional list of adapter IDs to poll
   * @returns {Promise<Object>} Aggregated poll results
   */
  async pollAdapters(adapterIds = []) {
    const targetAdapters =
      adapterIds.length > 0
        ? adapterIds.map((id) => alertAdapterRegistry.getAdapter(id)).filter(Boolean)
        : Array.from(alertAdapterRegistry.adapters.values());

    const results = [];
    let totalIngested = 0;
    let totalDuplicates = 0;

    for (const adapter of targetAdapters) {
      try {
        const rawItems = await adapter.fetchFeed();
        for (const item of rawItems) {
          const outcome = await this.ingestAlert(item, {
            sourceAuthority: adapter.authority,
            secretKey: adapter.secretKey,
            feedUrl: adapter.feedUrl,
            format: adapter.defaultFormat,
            allowUnsigned: true,
          });

          if (outcome.isDuplicate) {
            totalDuplicates++;
          } else {
            totalIngested++;
          }
        }

        results.push({
          adapterId: adapter.adapterId,
          authority: adapter.authority,
          status: 'SUCCESS',
          itemsPolled: rawItems.length,
        });
      } catch (err) {
        results.push({
          adapterId: adapter.adapterId,
          authority: adapter.authority,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    return {
      success: true,
      polledAdaptersCount: targetAdapters.length,
      totalIngested,
      totalDuplicates,
      results,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }
}

export const alertIngestionService = new AlertIngestionService();
export const alertService = alertIngestionService;
