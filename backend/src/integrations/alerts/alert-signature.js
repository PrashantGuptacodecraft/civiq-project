/**
 * Alert Cryptographic Signature & Provenance Verification
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - SHA-256 digest computation of raw incoming alert payloads
 * - HMAC-SHA256 digital signature creation & verification
 * - Source provenance validation ensuring official alert integrity
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { SIGNATURE_VERIFICATION_STATUS } from './alert-adapter.types.js';

/**
 * Computes a standard SHA-256 hex digest of the raw payload string.
 * @param {string|Buffer|Object} rawPayload - Incoming alert payload
 * @returns {string} Hex SHA-256 digest
 */
export function computePayloadDigest(rawPayload) {
  const content =
    typeof rawPayload === 'string'
      ? rawPayload
      : Buffer.isBuffer(rawPayload)
      ? rawPayload
      : JSON.stringify(rawPayload);

  return createHash('sha256').update(content).digest('hex');
}

/**
 * Computes an HMAC-SHA256 signature for a payload given a secret key.
 * @param {string|Buffer|Object} rawPayload - Raw payload
 * @param {string} secretKey - Secret key
 * @returns {string} Hex HMAC signature
 */
export function computeHmacSignature(rawPayload, secretKey) {
  const content =
    typeof rawPayload === 'string'
      ? rawPayload
      : Buffer.isBuffer(rawPayload)
      ? rawPayload
      : JSON.stringify(rawPayload);

  return createHmac('sha256', secretKey).update(content).digest('hex');
}

/**
 * Validates HMAC-SHA256 signature against expected payload in constant-time.
 * @param {string|Buffer|Object} rawPayload - Raw payload
 * @param {string} signature - Incoming hex signature
 * @param {string} secretKey - Secret key
 * @returns {boolean} True if signature matches
 */
export function verifyHmacSignature(rawPayload, signature, secretKey) {
  if (!signature || !secretKey) return false;

  try {
    const expected = computeHmacSignature(rawPayload, secretKey);
    const sigBuf = Buffer.from(signature.trim().toLowerCase(), 'hex');
    const expBuf = Buffer.from(expected.toLowerCase(), 'hex');

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Validates source provenance and digital signature for an alert payload.
 *
 * @param {string|Buffer|Object} rawPayload - Raw alert payload
 * @param {Object} options - Validation options { signature, secretKey, allowUnsigned }
 * @returns {Object} Validation outcome { isValid, status, signatureHash, algorithm }
 */
export function validateAlertProvenance(rawPayload, options = {}) {
  const signatureHash = computePayloadDigest(rawPayload);

  // Case 1: Signature provided with a verification key
  if (options.signature && options.secretKey) {
    const isValid = verifyHmacSignature(rawPayload, options.signature, options.secretKey);
    return {
      isValid,
      status: isValid
        ? SIGNATURE_VERIFICATION_STATUS.VERIFIED
        : SIGNATURE_VERIFICATION_STATUS.SIGNATURE_MISMATCH,
      signatureHash,
      algorithm: 'HMAC-SHA256',
      error: isValid ? null : 'Incoming payload signature does not match expected cryptographic digest.',
    };
  }

  // Case 2: Direct hash comparison if expectedDigest provided
  if (options.expectedDigest) {
    const isValid = options.expectedDigest.toLowerCase() === signatureHash.toLowerCase();
    return {
      isValid,
      status: isValid
        ? SIGNATURE_VERIFICATION_STATUS.VERIFIED
        : SIGNATURE_VERIFICATION_STATUS.SIGNATURE_MISMATCH,
      signatureHash,
      algorithm: 'SHA256-DIGEST',
      error: isValid ? null : 'Incoming payload hash does not match expected authority digest.',
    };
  }

  // Case 3: Source is marked as trusted unsigned public feed (e.g. open RSS / public CAP endpoint)
  if (options.allowUnsigned !== false) {
    return {
      isValid: true,
      status: SIGNATURE_VERIFICATION_STATUS.UNSIGNED_TRUSTED_SOURCE,
      signatureHash,
      algorithm: 'SHA256-DIGEST',
      error: null,
    };
  }

  // Case 4: Signature was required by policy but not provided
  return {
    isValid: false,
    status: SIGNATURE_VERIFICATION_STATUS.INVALID_SIGNATURE,
    signatureHash,
    algorithm: 'NONE',
    error: 'Cryptographic signature is required for this statutory alert authority.',
  };
}
