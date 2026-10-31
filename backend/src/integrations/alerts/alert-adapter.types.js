/**
 * Disaster Alert Ingestion Types & Enumerations
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - CAP (Common Alerting Protocol v1.2) schema definitions and formats
 * - Alert severity, urgency, certainty, and lifecycle message types
 * - Source authority attribution, provenance, and signature verification status
 * - Statutory safety disclaimer preserving authoritative precedence
 */

export const ALERT_FORMATS = Object.freeze({
  CAP_XML_1_2: 'CAP_XML_1_2',
  CAP_JSON_1_2: 'CAP_JSON_1_2',
  RSS_2_0: 'RSS_2_0',
  ATOM_1_0: 'ATOM_1_0',
});

export const ALERT_SEVERITY = Object.freeze({
  EXTREME: 'Extreme',
  SEVERE: 'Severe',
  MODERATE: 'Moderate',
  MINOR: 'Minor',
  UNKNOWN: 'Unknown',
});

export const ALERT_URGENCY = Object.freeze({
  IMMEDIATE: 'Immediate',
  EXPECTED: 'Expected',
  FUTURE: 'Future',
  PAST: 'Past',
  UNKNOWN: 'Unknown',
});

export const ALERT_CERTAINTY = Object.freeze({
  OBSERVED: 'Observed',
  LIKELY: 'Likely',
  POSSIBLE: 'Possible',
  UNLIKELY: 'Unlikely',
  UNKNOWN: 'Unknown',
});

export const ALERT_STATUS = Object.freeze({
  ACTUAL: 'Actual',
  EXERCISE: 'Exercise',
  SYSTEM: 'System',
  TEST: 'Test',
  DRAFT: 'Draft',
});

export const ALERT_MSG_TYPE = Object.freeze({
  ALERT: 'Alert',
  UPDATE: 'Update',
  CANCEL: 'Cancel',
  ACK: 'Ack',
  ERROR: 'Error',
});

export const ALERT_SOURCE_AUTHORITY = Object.freeze({
  SACHET_NDMA: 'SACHET_NDMA',
  IMD: 'IMD',
  CWC: 'CWC',
  MAHA_SDMA: 'MAHA_SDMA',
  PUNE_DDMA: 'PUNE_DDMA',
  PCMC_DISASTER_CELL: 'PCMC_DISASTER_CELL',
  MOCK_SANDBOX: 'MOCK_SANDBOX',
});

export const SIGNATURE_VERIFICATION_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  UNSIGNED_TRUSTED_SOURCE: 'UNSIGNED_TRUSTED_SOURCE',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
});

export const INGESTION_STATUS = Object.freeze({
  INGESTED: 'INGESTED',
  ALREADY_INGESTED: 'ALREADY_INGESTED',
  REJECTED_SIGNATURE_MISMATCH: 'REJECTED_SIGNATURE_MISMATCH',
  FAILED_VALIDATION: 'FAILED_VALIDATION',
});

/**
 * Statutory safety disclaimer mandated by ADR 0002 and AGENTS.md.
 * Official alerts ingested into CivIQ must always preserve authoritative source primacy.
 */
export const DISASTER_STATUTORY_DISCLAIMER =
  'CivIQ Disaster Alert Ingestion Notice: Statutory emergency declarations, evacuation mandates, and weather bulletins ' +
  'remain under the exclusive sovereign authority of NDMA, SDMA, DDMA, IMD, and municipal corporations under the Disaster Management Act, 2005. ' +
  'CivIQ ingests and displays official alerts verbatim for operational correlation and civic awareness without altering official instructions.';
