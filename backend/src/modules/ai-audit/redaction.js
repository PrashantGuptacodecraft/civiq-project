/**
 * PII and Secret Redactor for AI Governance and Audit Trails.
 *
 * Ensures compliance with AGENTS.md rules:
 * - No raw Aadhaar numbers or unnecessary identity data stored.
 * - No exposed citizen PII in AI inference logs.
 * - Strips sensitive secrets (passwords, tokens, API keys, OTPs).
 */

const SECRET_KEY_NAMES = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'refreshtoken',
  'accesstoken',
  'apikey',
  'api_key',
  'bearer',
  'authorization',
  'otp',
  'pin',
  'privatekey',
  'private_key',
  'cvv',
  'creditcard',
  'aadhaar',
  'aadhaarnumber',
  'pan',
  'pannumber',
]);

// 1. Credit Card / Debit Card (16-digit formatted or unformatted - matched first)
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]){3}\d{4}\b|\b\d{16}\b/g;

// 2. Aadhaar: 12-digit Indian National ID (4-4-4 formatted or contiguous 12 digits)
const AADHAAR_FORMATTED_REGEX = /\b[2-9]\d{3}[ -]\d{4}[ -]\d{4}\b/g;
const AADHAAR_RAW_REGEX = /\b[2-9]\d{11}\b/g;

// 3. PAN Card: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;

// 4. Indian & International Phone Numbers: +91 9876543210, 9876543210, +1-xxx-xxx-xxxx
const PHONE_REGEX = /(?:\+91[ -]?)?[6-9]\d{4}[ -]?\d{5}\b/g;
const GENERAL_PHONE_REGEX = /(?:\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g;

// 5. Email Address
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Redact sensitive PII text patterns within a string.
 */
export function redactPiiString(text) {
  if (!text || typeof text !== 'string') return text;

  return text
    // Redact Credit Cards first (prevents 16 digits from matching 12-digit Aadhaar)
    .replace(CREDIT_CARD_REGEX, '[REDACTED_FINANCIAL]')
    // Redact Aadhaar
    .replace(AADHAAR_FORMATTED_REGEX, '[REDACTED_AADHAAR]')
    .replace(AADHAAR_RAW_REGEX, '[REDACTED_AADHAAR]')
    // Redact PAN
    .replace(PAN_REGEX, '[REDACTED_PAN]')
    // Redact Emails
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    // Redact Phone numbers
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(GENERAL_PHONE_REGEX, '[REDACTED_PHONE]');
}

/**
 * Deeply redact an arbitrary object, array, or primitive before storing in AI audit records.
 * - Masks sensitive PII patterns in string values.
 * - Completely masks values of sensitive keys (password, token, etc.).
 */
export function redactPiiAndSecrets<T>(data: T) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactPiiString(data)  as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactPiiAndSecrets(item))  as T;
  }

  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data <string, unknown>)) {
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');

      // If key name itself indicates high sensitivity, completely mask it
      if (SECRET_KEY_NAMES.has(normalizedKey)) {
        result[key] = '[REDACTED_SECRET]';
      } else if (typeof value === 'string') {
        result[key] = redactPiiString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactPiiAndSecrets(value);
      } else {
        result[key] = value;
      }
    }
    return result  as T;
  }

  return data;
}