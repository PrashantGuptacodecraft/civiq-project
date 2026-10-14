import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification.service';
import { MemoryEmailAdapter } from './email.adapter';
import { prisma } from '@civiq/db';
import { IssueStatusChangeEvent } from '@civiq/contracts';

vi.mock('@civiq/db', () => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('NotificationService - Lifecycle & Idempotency', () => {
  let emailAdapter: MemoryEmailAdapter;
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailAdapter = new MemoryEmailAdapter();
    service = new NotificationService(emailAdapter);
  });

  describe('Content Generation', () => {
    it('generates accurate message copy for various issue statuses', () => {
      const statuses = [
        { status: 'SUBMITTED', titleSub: 'Issue Submitted' },
        { status: 'ASSIGNED', titleSub: 'Issue Assigned' },
        { status: 'IN_PROGRESS', titleSub: 'Work In Progress' },
        { status: 'RESOLVED', titleSub: 'Issue Resolved' },
        { status: 'CLOSED', titleSub: 'Issue Closed' },
        { status: 'REOPENED', titleSub: 'Issue Reopened' },
      ];

      for (const { status, titleSub } of statuses) {
        const content = service.generateNotificationContent({
          eventId: 'evt-1',
          issueId: 'issue-1',
          issueTitle: 'Pothole on Main St',
          previousStatus: 'DRAFT',
          newStatus: status,
          changedById: 'admin-1',
          recipientUserId: 'user-1',
          timestamp: new Date().toISOString(),
        });

        expect(content.title).toContain(titleSub);
        expect(content.title).toContain('Pothole on Main St');
        expect(content.message).toContain('Pothole on Main St');
      }
    });
  });

  describe('handleIssueStatusChange', () => {
    const mockEvent: IssueStatusChangeEvent = {
      eventId: 'evt-status-123',
      issueId: 'issue-456',
      issueTitle: 'Broken streetlight',
      previousStatus: 'SUBMITTED',
      newStatus: 'IN_PROGRESS',
      changedById: 'staff-1',
      recipientUserId: 'citizen-99',
      recipientEmail: 'citizen@example.com',
      timestamp: new Date().toISOString(),
    };

    it('creates in-app and delivers email notification for new status change', async () => {
      // Prisma: no existing record found
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);

      const createdInApp = {
        id: 'notif-in-app-1',
        userId: 'citizen-99',
        issueId: 'issue-456',
        channel: 'IN_APP',
        title: 'Work In Progress: Broken streetlight',
        message: 'Field staff have commenced work to address "Broken streetlight".',
        status: 'SENT',
        idempotencyKey: 'issue:issue-456:status:IN_PROGRESS:in_app',
        createdAt: new Date(),
      };

      const createdEmail = {
        id: 'notif-email-1',
        userId: 'citizen-99',
        issueId: 'issue-456',
        channel: 'EMAIL',
        title: 'Work In Progress: Broken streetlight',
        message: 'Field staff have commenced work to address "Broken streetlight".',
        status: 'SENT',
        idempotencyKey: 'issue:issue-456:status:IN_PROGRESS:email',
        createdAt: new Date(),
      };

      vi.mocked(prisma.notification.create)
        .mockResolvedValueOnce(createdInApp as any)
        .mockResolvedValueOnce(createdEmail as any);

      const result = await service.handleIssueStatusChange(mockEvent);

      expect(result.inApp.delivered).toBe(true);
      expect(result.inApp.isDuplicate).toBe(false);
      expect(result.inApp.notificationId).toBe('notif-in-app-1');

      expect(result.email).toBeDefined();
      expect(result.email?.delivered).toBe(true);
      expect(result.email?.isDuplicate).toBe(false);

      // Verify email was sent via adapter
      const sent = emailAdapter.getSentEmails();
      expect(sent).toHaveLength(1);
      expect(sent[0]!.to).toBe('citizen@example.com');
      expect(sent[0]!.subject).toContain('Broken streetlight');
    });

    it('enforces strict idempotency and deduplicates repeated status change events', async () => {
      const existingInApp = {
        id: 'existing-in-app-1',
        userId: 'citizen-99',
        issueId: 'issue-456',
        channel: 'IN_APP',
        title: 'Work In Progress: Broken streetlight',
        status: 'SENT',
        idempotencyKey: 'issue:issue-456:status:IN_PROGRESS:in_app',
        createdAt: new Date('2026-10-14T10:00:00Z'),
      };

      const existingEmail = {
        id: 'existing-email-1',
        userId: 'citizen-99',
        issueId: 'issue-456',
        channel: 'EMAIL',
        title: 'Work In Progress: Broken streetlight',
        status: 'SENT',
        idempotencyKey: 'issue:issue-456:status:IN_PROGRESS:email',
        createdAt: new Date('2026-10-14T10:00:00Z'),
      };

      // Both already exist in database
      vi.mocked(prisma.notification.findUnique)
        .mockResolvedValueOnce(existingInApp as any)
        .mockResolvedValueOnce(existingEmail as any);

      const result = await service.handleIssueStatusChange(mockEvent);

      // Assert duplicate detection
      expect(result.inApp.isDuplicate).toBe(true);
      expect(result.inApp.notificationId).toBe('existing-in-app-1');
      expect(result.email?.isDuplicate).toBe(true);
      expect(result.email?.notificationId).toBe('existing-email-1');

      // Verify NO new DB create was invoked
      expect(prisma.notification.create).not.toHaveBeenCalled();

      // Verify NO duplicate email was sent
      expect(emailAdapter.getSentEmails()).toHaveLength(0);
    });

    it('resolves user email from database when event recipientEmail is not provided', async () => {
      const eventWithoutEmail: IssueStatusChangeEvent = {
        ...mockEvent,
        recipientEmail: undefined,
      };

      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'citizen-99',
        email: 'fallback@example.com',
      } as any);

      vi.mocked(prisma.notification.create)
        .mockResolvedValueOnce({
          id: 'notif-1',
          createdAt: new Date(),
        } as any)
        .mockResolvedValueOnce({
          id: 'notif-2',
          createdAt: new Date(),
        } as any);

      const result = await service.handleIssueStatusChange(eventWithoutEmail);

      expect(result.email).toBeDefined();
      expect(result.email?.delivered).toBe(true);
      expect(emailAdapter.getSentEmails()[0]!.to).toBe('fallback@example.com');
    });
  });

  describe('getUserNotifications', () => {
    it('returns notifications with count and unread count', async () => {
      const mockList = [
        {
          id: 'notif-1',
          userId: 'user-1',
          channel: 'IN_APP',
          title: 'Update 1',
          message: 'Message 1',
          status: 'SENT',
          readAt: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockList as any);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.getUserNotifications('user-1', { unreadOnly: true });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
        })
      );
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('marks a single notification as read', async () => {
      const existing = {
        id: 'notif-1',
        userId: 'user-1',
        status: 'SENT',
        readAt: null,
      };

      vi.mocked(prisma.notification.findFirst).mockResolvedValue(existing as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...existing,
        status: 'READ',
        readAt: new Date(),
      } as any);

      const updated = await service.markAsRead('notif-1', 'user-1');

      expect(updated.status).toBe('READ');
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({ status: 'READ' }),
        })
      );
    });

    it('marks all unread notifications as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const res = await service.markAllAsRead('user-1');

      expect(res.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
          data: expect.objectContaining({ status: 'READ' }),
        })
      );
    });
  });
});
