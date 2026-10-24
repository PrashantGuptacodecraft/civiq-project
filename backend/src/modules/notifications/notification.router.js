import { Router } from 'express';
import { prisma } from '@civiq/db';
import { createHash } from 'crypto';
import { notificationService } from './notification.service.js';
/**
 * Authentication middleware for notification endpoints.
 */
export async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    }
    else if (typeof req.headers['x-session-token'] === 'string') {
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
export const notificationRouter = Router();
/**
 * GET /notifications
 * Retrieve notification feed for authenticated user.
 */
notificationRouter.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly, channel, limit, offset } = req.query;
        const options = {
            unreadOnly: unreadOnly === 'true',
            channel: typeof channel === 'string' ? channel : undefined,
            limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
            offset: typeof offset === 'string' ? parseInt(offset, 10) : undefined,
        };
        const result = await notificationService.getUserNotifications(userId, options);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve notifications.',
        });
    }
});
/**
 * PATCH /notifications/:id/read
 * Mark an individual notification as read.
 */
notificationRouter.patch('/:id/read', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const rawId = req.params.id;
        const notificationId = typeof rawId === 'string' ? rawId : (Array.isArray(rawId) ? rawId[0] : '');
        if (!notificationId) {
            res.status(400).json({
                success: false,
                error: 'Notification ID is required.',
            });
            return;
        }
        const updated = await notificationService.markAsRead(notificationId, userId);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        const status = error.message?.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Failed to mark notification as read.',
        });
    }
});
/**
 * POST /notifications/read-all
 * Mark all notifications for the current user as read.
 */
notificationRouter.post('/read-all', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await notificationService.markAllAsRead(userId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to mark all notifications as read.',
        });
    }
});
/**
 * POST /notifications/events/status-change
 * Handle issue status change notification event.
 */
notificationRouter.post('/events/status-change', authenticateUser, async (req, res) => {
    try {
        const event = req.body;
        if (!event.issueId || !event.newStatus || !event.recipientUserId) {
            res.status(400).json({
                success: false,
                error: 'issueId, newStatus, and recipientUserId are required.',
            });
            return;
        }
        const result = await notificationService.handleIssueStatusChange(event);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to handle issue status change event.',
        });
    }
});
