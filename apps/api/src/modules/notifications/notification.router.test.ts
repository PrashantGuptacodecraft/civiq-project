import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { notificationRouter } from './notification.router';
import { notificationService } from './notification.service';
import { prisma } from '@civiq/db';
import { createHash } from 'crypto';

vi.mock('@civiq/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('NotificationRouter - REST API Integration', () => {
  const app = express();
  app.use(express.json());
  app.use('/notifications', notificationRouter);

  const testToken = 'valid-test-session-token-abc';
  const tokenHash = createHash('sha256').update(testToken).digest('hex');

  const mockActiveUser = {
    id: 'user-auth-notif-1',
    email: 'tester@civiq.dev',
    role: 'CITIZEN',
    status: 'ACTIVE',
  };

  const mockSession = {
    id: 'sess-notif-1',
    userId: mockActiveUser.id,
    tokenHash,
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000),
    user: mockActiveUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
  });

  describe('Authentication Enforcement', () => {
    it('returns 401 when token is missing', async () => {
      const res = await request(app).get('/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Authentication required');
    });

    it('returns 401 when session token is expired or revoked', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      } as any);

      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('revoked, or expired');
    });
  });

  describe('GET /notifications', () => {
    it('fetches notifications with unread counts for authenticated user', async () => {
      const mockResult = {
        items: [
          {
            id: 'notif-1',
            userId: mockActiveUser.id,
            title: 'Issue Assigned',
            message: 'Your issue has been assigned',
            status: 'SENT',
            channel: 'IN_APP',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        unreadCount: 1,
      };

      vi.spyOn(notificationService, 'getUserNotifications').mockResolvedValue(mockResult as any);

      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.unreadCount).toBe(1);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('marks an individual notification as read', async () => {
      const mockUpdated = {
        id: 'notif-100',
        userId: mockActiveUser.id,
        status: 'READ',
        readAt: new Date().toISOString(),
      };

      vi.spyOn(notificationService, 'markAsRead').mockResolvedValue(mockUpdated as any);

      const res = await request(app)
        .patch('/notifications/notif-100/read')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READ');
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-100', mockActiveUser.id);
    });

    it('returns 404 when notification does not exist', async () => {
      vi.spyOn(notificationService, 'markAsRead').mockRejectedValue(
        new Error('Notification not found: "missing-id".')
      );

      const res = await request(app)
        .patch('/notifications/missing-id/read')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Notification not found');
    });
  });

  describe('POST /notifications/read-all', () => {
    it('marks all notifications as read for current user', async () => {
      vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValue({ count: 4 });

      const res = await request(app)
        .post('/notifications/read-all')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(4);
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(mockActiveUser.id);
    });
  });

  describe('POST /notifications/events/status-change', () => {
    it('dispatches status change notification event', async () => {
      const mockEvent = {
        eventId: 'evt-test-1',
        issueId: 'iss-test-1',
        issueTitle: 'Pothole on 1st Ave',
        previousStatus: 'SUBMITTED',
        newStatus: 'IN_PROGRESS',
        changedById: 'staff-1',
        recipientUserId: mockActiveUser.id,
        recipientEmail: 'tester@civiq.dev',
        timestamp: new Date().toISOString(),
      };

      vi.spyOn(notificationService, 'handleIssueStatusChange').mockResolvedValue({
        inApp: {
          idempotencyKey: 'issue:iss-test-1:status:IN_PROGRESS:in_app',
          delivered: true,
          channel: 'IN_APP',
          notificationId: 'notif-1',
          isDuplicate: false,
          deliveredAt: new Date().toISOString(),
        },
        email: {
          idempotencyKey: 'issue:iss-test-1:status:IN_PROGRESS:email',
          delivered: true,
          channel: 'EMAIL',
          notificationId: 'notif-2',
          isDuplicate: false,
          deliveredAt: new Date().toISOString(),
        },
      });

      const res = await request(app)
        .post('/notifications/events/status-change')
        .set('Authorization', `Bearer ${testToken}`)
        .send(mockEvent);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inApp.delivered).toBe(true);
      expect(res.body.data.email.delivered).toBe(true);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/notifications/events/status-change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          // missing issueId and recipientUserId
          newStatus: 'RESOLVED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });
  });
});
