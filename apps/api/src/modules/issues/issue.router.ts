import { Router, Request, Response, NextFunction } from 'express';
import { prisma, User } from '@civiq/db';
import { createHash } from 'crypto';
import { issueService } from './issue.service';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Authentication middleware for issue submission & protected routes.
 * Validates session token from Authorization: Bearer <token> or X-Session-Token.
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

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

export const issueRouter: Router = Router();

/**
 * POST /issues
 * Create a new civic issue. Requires authenticated user.
 */
issueRouter.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated.' });
      return;
    }

    const result = await issueService.createIssue({
      userId,
      data: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create issue.',
    });
  }
});

/**
 * GET /issues/:id
 * Fetch issue details by ID.
 */
issueRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const issueId = typeof rawId === 'string' ? rawId : (Array.isArray(rawId) ? rawId[0] : '');
    if (!issueId) {
      res.status(400).json({
        success: false,
        error: 'Issue ID is required.',
      });
      return;
    }

    const issue = await issueService.getIssueById(issueId);
    if (!issue) {
      res.status(404).json({
        success: false,
        error: 'Issue not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error.',
    });
  }
});

/**
 * GET /issues
 * List issues with optional query filters.
 */
issueRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, jurisdictionId, categoryId, status } = req.query;

    const filters: {
      userId?: string;
      jurisdictionId?: string;
      categoryId?: string;
      status?: any;
    } = {};

    if (typeof userId === 'string') filters.userId = userId;
    if (typeof jurisdictionId === 'string') filters.jurisdictionId = jurisdictionId;
    if (typeof categoryId === 'string') filters.categoryId = categoryId;
    if (typeof status === 'string') filters.status = status;

    const issues = await issueService.listIssues(filters);

    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error.',
    });
  }
});
