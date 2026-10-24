import { Router, Request, Response, NextFunction } from 'express';
import { prisma, User } from '@civiq/shared-db';
import { createHash } from 'crypto';
import { mediaService } from './media.service';

export interface AuthenticatedRequest extends Request {
  user?;
}

/**
 * Authentication middleware validating session tokens.
 */
export async function authenticateUser(
  req,
  res,
  next
) {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.headers['x-session-token'] === 'string') {
    token = req.headers['x-session-token'].trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Bearer token missing.',
    });
    return;
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    res.status(401).json({
      success: false,
      error: 'Invalid, revoked, or expired session token.',
    });
    return;
  }

  if (session.user.status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      error: 'User account is inactive or suspended.',
    });
    return;
  }

  req.user = session.user;
  next();
}

export const mediaRouter = Router();

/**
 * POST /media/signed-upload
 * Generates a signed upload ticket for an authenticated user.
 */
mediaRouter.post('/signed-upload', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated.' });
      return;
    }

    const { filename, mimeType, sizeBytes, issueId } = req.body;

    if (!filename || !mimeType || sizeBytes === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required upload parameters: filename, mimeType, sizeBytes.',
      });
      return;
    }

    const ticket = await mediaService.generateSignedUploadUrl({
      userId,
      filename,
      mimeType,
      sizeBytes(sizeBytes),
      issueId,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate signed upload URL.',
    });
  }
});

/**
 * POST /media/upload
 * Process uploaded media content (supports base64 payload or raw buffer with token).
 */
mediaRouter.post('/upload', async (req, res) => {
  try {
    const { evidenceId, base64Content, uploadedById } = req.body;

    if (!evidenceId || !base64Content) {
      res.status(400).json({
        success: false,
        error: 'Missing evidenceId or base64Content in upload payload.',
      });
      return;
    }

    const buffer = Buffer.from(base64Content, 'base64');

    const result = await mediaService.processUpload({
      evidenceId,
      buffer,
      uploadedById: uploadedById ?? 'anonymous',
    });

    if (!result.isClean) {
      res.status(422).json({
        success: false,
        error: `Content quarantined: ${result.quarantineReason}`,
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to process media upload.',
    });
  }
});

/**
 * GET /media/:id/signed-download
 * Requests a signed download URL for an authorized user.
 */
mediaRouter.get('/:id/signed-download', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated.' });
      return;
    }

    const evidenceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!evidenceId) {
      res.status(400).json({ success: false, error: 'Evidence ID is required.' });
      return;
    }

    const ticket = await mediaService.generateSignedDownloadUrl({
      userId,
      evidenceId,
    });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    const isAuthError = error.message.includes('Unauthorized') || error.message.includes('Access denied');
    res.status(isAuthError ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to generate signed download URL.',
    });
  }
});

/**
 * GET /media/download
 * Validates signed token and streams media with strict security headers.
 */
mediaRouter.get('/download', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token ;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Missing signed download token.',
      });
      return;
    }

    const { data, contentType } = await mediaService.retrieveMediaByToken(token);

    // Apply strict media security headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'private, no-transform, max-age=300');

    res.status(200).send(data);
  } catch (error) {
    res.status(403).json({
      success: false,
      error: error.message || 'Access denied to media.',
    });
  }
});

/**
 * POST /media/:id/quarantine
 * Manually quarantines a media item with reason.
 */
mediaRouter.post('/:id/quarantine', authenticateUser, async (req, res) => {
  try {
    const evidenceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    if (!evidenceId) {
      res.status(400).json({ success: false, error: 'Evidence ID is required.' });
      return;
    }

    await mediaService.quarantineMedia({
      evidenceId,
      reason: reason ?? 'Manually quarantined by authorized review',
      actorId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: `Media ${evidenceId} quarantined successfully.`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to quarantine media.',
    });
  }
});