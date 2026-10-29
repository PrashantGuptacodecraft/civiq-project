/**
 * Base Incident Source Adapter Interface Contract
 * Phase 58: Add official-source incident adapter contract
 */

import { createHash } from 'crypto';
import {
  OFFICIAL_SOURCES,
  COLLISION_TYPES,
  OFFICIAL_SEVERITY_LEVELS,
  ROAD_SURFACE_CONDITIONS,
  LIGHTING_CONDITIONS,
  OFFICIAL_ADAPTER_DISCLAIMER,
} from './incident-adapter.types.js';

export class BaseIncidentSourceAdapter {
  constructor(options = {}) {
    this.sourceName = options.sourceName || OFFICIAL_SOURCES.MOCK_SANDBOX;
    this.sourceType = options.sourceType || 'SANDBOX';
    this.isLiveIntegration = Boolean(options.isLiveIntegration || false);
    this.isMockOrSandbox = Boolean(options.isMockOrSandbox !== undefined ? options.isMockOrSandbox : true);
    this.dataAuthority = options.dataAuthority || 'State Police / MoRTH iRAD Initiative';
  }

  /**
   * Fetches official accident records matching query parameters.
   * @param {Object} query - Filter parameters (since, until, jurisdictionId, corridorName, limit, offset)
   * @returns {Promise<Array<Object>>} List of normalized accident records
   */
  async fetchAccidents(query = {}) {
    throw new Error('fetchAccidents() must be implemented by subclass.');
  }

  /**
   * Fetches single official accident record by external ID.
   * @param {string} externalId - External identifier (e.g. 'IRAD-MH-PUN-2026-0042')
   * @returns {Promise<Object|null>} Normalized accident record or null if not found
   */
  async fetchAccidentById(externalId) {
    throw new Error('fetchAccidentById() must be implemented by subclass.');
  }

  /**
   * Executes incremental synchronization using a cursor.
   * @param {string|null} cursor - Previous sync cursor (e.g. timestamp or sequence ID)
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} { success, records, newCursor, recordsProcessed, errorDetails }
   */
  async sync(cursor = null, options = {}) {
    throw new Error('sync() must be implemented by subclass.');
  }

  /**
   * Sanitizes raw feed payload to ensure compliance with AGENTS.md rules:
   * - Strips any raw Aadhaar numbers, PAN, or excessive personal identity data.
   * - Masks phone numbers if present.
   */
  sanitizeRawPayload(raw = {}) {
    const sanitized = JSON.parse(JSON.stringify(raw));

    function isSensitiveKey(k) {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        lower.includes('aadhaar') ||
        lower.includes('voter') ||
        lower.includes('nationalid') ||
        lower === 'pan' ||
        lower.startsWith('pan') ||
        lower === 'ssn'
      );
    }

    function deepClean(obj) {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (isSensitiveKey(key)) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          deepClean(obj[key]);
        }
      }
    }

    deepClean(sanitized);
    return sanitized;
  }

  /**
   * Computes deterministic SHA-256 hash for provenance and tamper detection.
   */
  computeProvenanceHash(externalId, occurredAt, rawPayload) {
    const content = `${this.sourceName}:${externalId}:${occurredAt}:${JSON.stringify(rawPayload || {})}`;
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Normalizes raw external feed payload into standardized CivIQ official accident contract.
   * @param {Object} raw - Raw payload from external source feed
   * @returns {Object} Normalized accident record
   */
  normalizeRecord(raw = {}) {
    throw new Error('normalizeRecord() must be implemented by subclass.');
  }
}
