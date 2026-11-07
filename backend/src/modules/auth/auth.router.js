/**
 * CivIQ Auth Router
 * Mounts all authentication HTTP endpoints under /auth
 *
 * Routes:
 *   POST /auth/otp/send        — Send OTP to phone
 *   POST /auth/otp/verify      — Verify OTP → session token
 *   POST /auth/password/register — Register with email+password (citizen)
 *   POST /auth/password/login  — Login with email+password → session token
 *   GET  /auth/me              — Fetch current user (requires Bearer token)
 *   POST /auth/logout          — Revoke current session
 */

import { Router } from 'express';
import { otpService } from './otp/otp.service.js';
import { passwordAuthService } from './password/password.service.js';
import { sessionService } from './session/session.service.js';
import { prisma } from '@civiq/db';
import { createRateLimiter } from '../../middleware/security.middleware.js';

export const authRouter = Router();

// Tight rate-limit for auth endpoints — 10 attempts per minute per IP
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractBearerToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

async function resolveSession(token) {
  if (!token) return null;
  const tokenHash = sessionService.hashString(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    return null;
  }
  return session;
}

// ─── OTP Routes ───────────────────────────────────────────────────────────────

/**
 * POST /auth/otp/send
 * Body: { phone: "+919876543210" }
 */
authRouter.post('/otp/send', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone is required.' });
    }

    // Basic Indian phone validation
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number. Use +91XXXXXXXXXX format.' });
    }

    const result = await otpService.requestOtp(phone.trim());
    if (!result.success) {
      return res.status(429).json({
        error: result.error,
        retryAfter: result.retryAfter,
      });
    }

    // In dev mode, log OTP to server console only (never to client)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP sent to ${phone} — check OtpChallenge table or sms logs`);
    }

    return res.status(200).json({ success: true, message: 'OTP sent.' });
  } catch (err) {
    console.error('[auth/otp/send]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/otp/verify
 * Body: { phone: "+919876543210", otp: "123456" }
 * Returns: { token, user: { id, phone, role, name } }
 */
authRouter.post('/otp/verify', authLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'phone and otp are required.' });
    }

    const result = await otpService.verifyOtp(phone.trim(), String(otp).trim());
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Fetch the user to return role info
    const user = await prisma.user.findUnique({
      where: { phone: phone.trim() },
      include: { profile: true },
    });

    return res.status(200).json({
      token: result.sessionToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.profile?.displayName || user.name || null,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[auth/otp/verify]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Password Routes ───────────────────────────────────────────────────────────

/**
 * POST /auth/password/register
 * Body: { email, password, name? }
 * Creates a CITIZEN account
 */
authRouter.post('/password/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const result = await passwordAuthService.register(email, password);
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    // Upsert UserProfile displayName if provided
    if (name) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (user) {
        await prisma.userProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, displayName: name },
          update: { displayName: name },
        });
      }
    }

    return res.status(201).json({ success: true, message: 'Account created. Please login.' });
  } catch (err) {
    console.error('[auth/password/register]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/password/login
 * Body: { email, password }
 * Returns: { token, user: { id, email, role, name } }
 */
authRouter.post('/password/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const result = await passwordAuthService.login(email, password);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    return res.status(200).json({
      token: result.sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.displayName || user.name || null,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[auth/password/login]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Session Routes ────────────────────────────────────────────────────────────

/**
 * GET /auth/me
 * Returns current user based on Bearer token
 */
authRouter.get('/me', async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const session = await resolveSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { user } = session;
    return res.status(200).json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.profile?.displayName || user.name || null,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/logout
 * Revokes the session associated with the Bearer token
 */
authRouter.post('/logout', async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(400).json({ error: 'No token provided.' });
    }

    const session = await resolveSession(token);
    if (!session) {
      return res.status(200).json({ success: true }); // idempotent — already invalid
    }

    await sessionService.revokeSession(session.id, session.userId);
    return res.status(200).json({ success: true, message: 'Logged out.' });
  } catch (err) {
    console.error('[auth/logout]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
