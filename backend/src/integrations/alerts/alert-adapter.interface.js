/**
 * Base Disaster Alert Source Adapter Interface Contract
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - Abstract adapter contract for official statutory disaster alert providers
 * - Strict adherence to ADR 0002: authoritative government alert primacy
 * - Cryptographic source verification & verbatim content enforcement
 */

import {
  ALERT_FORMATS,
  ALERT_SOURCE_AUTHORITY,
  DISASTER_STATUTORY_DISCLAIMER,
} from './alert-adapter.types.js';
import {
  parseCapXml,
  parseCapJson,
  parseRssAtomAlertFeed,
  normalizeIngestedAlert,
} from './alert-parser.js';
import { validateAlertProvenance } from './alert-signature.js';

export class BaseAlertSourceAdapter {
  constructor(options = {}) {
    this.adapterId = options.adapterId || 'base-alert-adapter';
    this.sourceName = options.sourceName || 'Generic Alert Adapter';
    this.authority = options.authority || ALERT_SOURCE_AUTHORITY.MOCK_SANDBOX;
    this.isLiveIntegration = Boolean(options.isLiveIntegration || false);
    this.feedUrl = options.feedUrl || null;
    this.secretKey = options.secretKey || null;
    this.defaultFormat = options.defaultFormat || ALERT_FORMATS.CAP_XML_1_2;
  }

  /**
   * Fetches alerts from the authoritative feed source.
   * @param {Object} options - Fetch options
   * @returns {Promise<Array<string|Object>>} Array of raw alert payloads
   */
  async fetchFeed(options = {}) {
    throw new Error(`fetchFeed() must be implemented by subclass adapter '${this.adapterId}'.`);
  }

  /**
   * Parses raw alert payload according to the specified format.
   * @param {string|Object} rawPayload - Raw alert payload
   * @param {string} format - Format enum
   * @returns {Object} Normalized parsed alert data
   */
  parseRawAlert(rawPayload, format = this.defaultFormat) {
    if (format === ALERT_FORMATS.CAP_XML_1_2 || (typeof rawPayload === 'string' && rawPayload.includes('<alert'))) {
      return parseCapXml(rawPayload);
    }

    if (format === ALERT_FORMATS.CAP_JSON_1_2 || (typeof rawPayload === 'object' && !rawPayload.channel)) {
      return parseCapJson(rawPayload);
    }

    if (format === ALERT_FORMATS.RSS_2_0 || format === ALERT_FORMATS.ATOM_1_0 || (typeof rawPayload === 'string' && rawPayload.includes('<rss'))) {
      const items = parseRssAtomAlertFeed(rawPayload);
      return items[0] || null;
    }

    // Default fallback try JSON then XML
    try {
      return parseCapJson(rawPayload);
    } catch {
      return parseCapXml(String(rawPayload));
    }
  }

  /**
   * Validates cryptographic provenance of incoming alert payload.
   * @param {string|Buffer|Object} rawPayload - Incoming raw payload
   * @param {string} signature - Hex signature (if supported/provided by source)
   * @param {Object} options - Verification options
   * @returns {Object} Verification outcome
   */
  validateProvenance(rawPayload, signature = null, options = {}) {
    return validateAlertProvenance(rawPayload, {
      signature,
      secretKey: options.secretKey || this.secretKey,
      allowUnsigned: options.allowUnsigned !== undefined ? options.allowUnsigned : !this.secretKey,
      expectedDigest: options.expectedDigest,
    });
  }

  /**
   * Normalizes parsed alert ensuring verbatim preservation of official warnings.
   */
  normalizeAlert(parsedData, rawPayload, options = {}) {
    return normalizeIngestedAlert(parsedData, rawPayload, {
      sourceAuthority: this.authority,
      feedUrl: this.feedUrl,
      signatureStatus: options.signatureStatus,
      signatureAlgorithm: options.signatureAlgorithm,
      ...options,
    });
  }

  /**
   * Ingests a single alert payload through this adapter:
   * 1. Validates source signature/provenance.
   * 2. Parses the alert payload.
   * 3. Normalizes to CivIQ standard contract with verbatim official content.
   *
   * @param {string|Object} rawPayload - Raw alert payload
   * @param {Object} options - Options including signature
   * @returns {Promise<Object>} Normalized Ingested Alert Record
   */
  async ingestAlert(rawPayload, options = {}) {
    const provCheck = this.validateProvenance(rawPayload, options.signature, options);
    if (!provCheck.isValid && options.enforceSignature !== false && this.secretKey) {
      const err = new Error(`Alert provenance validation failed: ${provCheck.error}`);
      err.statusCode = 401;
      err.verificationStatus = provCheck.status;
      throw err;
    }

    const parsed = this.parseRawAlert(rawPayload, options.format || this.defaultFormat);
    if (!parsed) {
      const err = new Error('Failed to parse alert payload.');
      err.statusCode = 400;
      throw err;
    }

    return this.normalizeAlert(parsed, rawPayload, {
      signatureStatus: provCheck.status,
      signatureAlgorithm: provCheck.algorithm,
      feedUrl: options.feedUrl || this.feedUrl,
    });
  }

  /**
   * Executes synchronization against the feed.
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync outcome
   */
  async sync(options = {}) {
    const rawItems = await this.fetchFeed(options);
    const ingestedAlerts = [];
    const errors = [];

    for (const rawItem of rawItems) {
      try {
        const ingested = await this.ingestAlert(rawItem, options);
        ingestedAlerts.push(ingested);
      } catch (err) {
        errors.push({ error: err.message, payload: rawItem });
      }
    }

    return {
      success: errors.length === 0,
      adapterId: this.adapterId,
      sourceName: this.sourceName,
      authority: this.authority,
      totalFetched: rawItems.length,
      totalIngested: ingestedAlerts.length,
      alerts: ingestedAlerts,
      errors,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    };
  }
}
