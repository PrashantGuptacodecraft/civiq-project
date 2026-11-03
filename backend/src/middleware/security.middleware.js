/**
 * CivIQ Security Hardening Middleware
 * Phase 70: Security hardening and threat-model closure
 *
 * Implements:
 * 1. Production HTTP Security Headers (OWASP / DPDP compliant)
 * 2. In-Memory Sliding-Window Rate Limiter with standard RFC headers
 * 3. Deep Request Sanitization (prototype pollution, null-byte injection, path traversal)
 * 4. AI Prompt & PII Sanitizer (prompt injection defense, Aadhaar & PII redaction)
 * 5. Webhook HMAC-SHA256 Signature & Replay Verification
 */

import crypto from 'node:crypto';

/**
 * 1. HTTP Security Headers Middleware
 * Protects against MIME-sniffing, clickjacking, cross-site leaks, and unsafe embeddings.
 */
export function securityHeaders() {
  return (req, res, next) => {
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by forbidding embedding in iframes
    res.setHeader('X-Frame-Options', 'DENY');

    // Force HTTPS with HSTS (1 year + preload)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Modern Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';"
    );

    // Limit referrer leakage
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict browser features to self
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=(self), payment=()'
    );

    // Cross-Origin isolation
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove tech stack identification
    res.removeHeader('X-Powered-By');

    next();
  };
}

/**
 * 2. In-Memory Rate Limiter with Sliding Window & RFC Standard Headers
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // max requests per windowMs
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) =>
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
    skip = () => false,
  } = options;

  // Map of clientKey -> Array of request timestamps
  const clients = new Map();

  // Periodic cleanup of stale entries (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of clients.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        clients.delete(key);
      } else {
        clients.set(key, active);
      }
    }
  }, 5 * 60 * 1000);

  // Unref timer so it doesn't hold open process in tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  const limiter = (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let timestamps = clients.get(key) || [];
    // Discard timestamps outside the current window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    const remaining = Math.max(0, max - (timestamps.length + 1));
    const oldestTimestamp = timestamps[0] || now;
    const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    // Standard RFC RateLimit Headers
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.max(1, resetTimeSeconds)));

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', String(Math.max(1, resetTimeSeconds)));
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.max(1, resetTimeSeconds),
      });
    }

    timestamps.push(now);
    clients.set(key, timestamps);
    next();
  };

  // Expose reset for testing
  limiter.reset = () => {
    clients.clear();
  };

  return limiter;
}

/**
 * 3. Request Input Sanitization Middleware
 * In-place deep cleaning of query, params, and body against prototype pollution,
 * null-byte injection, and path traversal strings without breaking Express 5 property getters.
 */
export function sanitizeInput() {
  const sanitizeInPlace = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      // Prevent Prototype Pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
        continue;
      }

      const val = obj[key];
      if (typeof val === 'string') {
        // Strip null bytes and directory traversal patterns
        obj[key] = val.replace(/\0/g, '').replace(/(\.\.[\/\\])+/g, '');
      } else if (Array.isArray(val)) {
        obj[key] = val.map((item) => {
          if (typeof item === 'string') {
            return item.replace(/\0/g, '').replace(/(\.\.[\/\\])+/g, '');
          }
          if (item && typeof item === 'object') {
            sanitizeInPlace(item);
          }
          return item;
        });
      } else if (val && typeof val === 'object') {
        sanitizeInPlace(val);
      }
    }
  };

  return (req, res, next) => {
    if (req.query) sanitizeInPlace(req.query);
    if (req.params) sanitizeInPlace(req.params);
    if (req.body && typeof req.body === 'object') sanitizeInPlace(req.body);
    next();
  };
}

/**
 * 4. AI Prompt & PII Sanitizer Utility
 * Defends against prompt injection and redacts Indian identity numbers (Aadhaar & phone).
 */
export function sanitizePromptInput(text) {
  if (typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Redact Indian mobile numbers (with optional +91 or 91 country code prefix)
  const phoneRegex = /(?:\+91\s?|91\s?)?[6-9]\d{9}\b/g;
  sanitized = sanitized.replace(phoneRegex, '[PHONE_REDACTED]');

  // 2. Redact 12-digit Indian Aadhaar numbers (UIDAI format: starts with 2-9)
  const aadhaarRegex = /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g;
  sanitized = sanitized.replace(aadhaarRegex, '[AADHAAR_REDACTED]');

  // 3. Neutralize common LLM prompt injection attack prefixes and system-override directives
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?prior\s+context/gi,
    /system\s+prompt\s*:/gi,
    /you\s+are\s+now\s+in\s+developer\s+mode/gi,
    /jailbreak/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[BLOCKED_PROMPT_DIRECTIVE]');
  }

  return sanitized;
}

/**
 * 5. Webhook HMAC-SHA256 Signature Verification
 * Constant-time comparison preventing timing attacks with replay tolerance.
 */
export function verifyWebhookSignature({
  secret,
  payload,
  signatureHeader,
  toleranceSeconds = 300,
}) {
  if (!secret || !payload || !signatureHeader) {
    return { valid: false, error: 'Missing secret, payload, or signature header' };
  }

  // Format: t=<timestamp>,v1=<signature>
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return { valid: false, error: 'Invalid signature header format; expected t=<ts>,v1=<sig>' };
  }

  // Check replay tolerance window
  const nowSeconds = Math.floor(Date.now() / 1000);
  const tsNum = parseInt(timestamp, 10);
  if (isNaN(tsNum) || Math.abs(nowSeconds - tsNum) > toleranceSeconds) {
    return { valid: false, error: 'Webhook timestamp outside allowed tolerance window (replay protection)' };
  }

  // Compute expected HMAC-SHA256 signature
  const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedPayload = `${timestamp}.${rawPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Constant-time buffer comparison to prevent timing side-channel attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: 'Signature length mismatch' };
  }

  const matches = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  return {
    valid: matches,
    error: matches ? null : 'Signature verification failed',
  };
}
