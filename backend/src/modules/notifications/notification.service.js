import { prisma } from '@civiq/shared-db';
import {
  IssueStatusChangeEvent,
  NotificationChannel,
  NotificationDispatchResult,
  UserNotificationItem,
} from '@civiq/shared-contracts';
import { getEmailAdapter, MemoryEmailAdapter } from './email.adapter';

export class NotificationService {
  emailAdapter;

  constructor(emailAdapter?) {
    this.emailAdapter = emailAdapter ?? getEmailAdapter();
  }

  setEmailAdapter(adapter) {
    this.emailAdapter = adapter;
  }

  /**
   * Generates user-friendly notification copy based on issue status transitions.
   */
  generateNotificationContent(event): { title; message } {
    const titleText = event.issueTitle.trim();
    switch (event.newStatus) {
      case 'SUBMITTED':
        return {
          title: `Issue Submitted: ${titleText}`,
          message: `Your report "${titleText}" has been received and queued for review.`,
        };
      case 'ASSIGNED':
        return {
          title: `Issue Assigned: ${titleText}`,
          message: `Your report "${titleText}" has been assigned to the responsible department.`,
        };
      case 'IN_PROGRESS':
        return {
          title: `Work In Progress: ${titleText}`,
          message: `Field staff have commenced work to address "${titleText}".`,
        };
      case 'RESOLVED':
        return {
          title: `Issue Resolved: ${titleText}`,
          message: `Work on "${titleText}" has been marked . Please review and confirm.`,
        };
      case 'CLOSED':
        return {
          title: `Issue Closed: ${titleText}`,
          message: `Resolution on "${titleText}" has been verified and the issue is now closed.`,
        };
      case 'REOPENED':
        return {
          title: `Issue Reopened: ${titleText}`,
          message: `Issue "${titleText}" has been reopened for further investigation.`,
        };
      default:
        return {
          title: `Status Update: ${titleText}`,
          message: `Issue "${titleText}" status changed from ${event.previousStatus} to ${event.newStatus}.`,
        };
    }
  }

  /**
   * Dispatches lifecycle notification events (in-app and optional email).
   * Enforces strict idempotency per issue, status, and channel.
   */
  async handleIssueStatusChange(event) {
    const content = this.generateNotificationContent(event);

    // 1. Strict deterministic idempotency keys
    const explicitKey = event.metadata?.idempotencyKey  | undefined;
    const inAppKey = explicitKey
      ? `${explicitKey}:in_app`
      : `issue:${event.issueId}:status:${event.newStatus}:in_app`;

    const emailKey = explicitKey
      ? `${explicitKey}:email`
      : `issue:${event.issueId}:status:${event.newStatus}:email`;

    // 2. Handle In-App Notification
    let inAppResult;
    const existingInApp = await prisma.notification.findUnique({
      where: { idempotencyKey: inAppKey },
    });

    if (existingInApp) {
      inAppResult = {
        idempotencyKey: inAppKey,
        delivered: true,
        channel: 'IN_APP',
        notificationId: existingInApp.id,
        isDuplicate: true,
        deliveredAt: existingInApp.createdAt.toISOString(),
      };
    } else {
      const createdInApp = await prisma.notification.create({
        data: {
          userId: event.recipientUserId,
          issueId: event.issueId,
          channel: 'IN_APP',
          title: content.title,
          message: content.message,
          status: 'SENT',
          idempotencyKey: inAppKey,
          sentAt: new Date(),
          metadata: event.metadata ?? {},
        },
      });

      inAppResult = {
        idempotencyKey: inAppKey,
        delivered: true,
        channel: 'IN_APP',
        notificationId: createdInApp.id,
        isDuplicate: false,
        deliveredAt: createdInApp.createdAt.toISOString(),
      };
    }

    // 3. Handle Email Notification if recipient email is available
    let recipientEmail = event.recipientEmail;
    if (!recipientEmail) {
      const user = await prisma.user.findUnique({
        where: { id: event.recipientUserId },
        select: { email: true },
      });
      recipientEmail = user?.email ?? undefined;
    }

    let emailResult;

    if (recipientEmail) {
      const existingEmail = await prisma.notification.findUnique({
        where: { idempotencyKey: emailKey },
      });

      if (existingEmail) {
        emailResult = {
          idempotencyKey: emailKey,
          delivered: true,
          channel: 'EMAIL',
          notificationId: existingEmail.id,
          isDuplicate: true,
          deliveredAt: existingEmail.createdAt.toISOString(),
        };
      } else {
        const sendResult = await this.emailAdapter.sendEmail({
          to: recipientEmail,
          subject: content.title,
          text: content.message,
          idempotencyKey: emailKey,
        });

        const createdEmail = await prisma.notification.create({
          data: {
            userId: event.recipientUserId,
            issueId: event.issueId,
            channel: 'EMAIL',
            title: content.title,
            message: content.message,
            status: sendResult.success ? 'SENT' : 'FAILED',
            idempotencyKey: emailKey,
            sentAt: sendResult.success ? new Date() ,
            failedAt: !sendResult.success ? new Date() ,
            failureReason: !sendResult.success ? 'Email adapter failed to deliver' ,
            metadata: {
              ...(event.metadata ?? {}),
              messageId: sendResult.messageId,
            },
          },
        });

        emailResult = {
          idempotencyKey: emailKey,
          delivered: sendResult.success,
          channel: 'EMAIL',
          notificationId: createdEmail.id,
          isDuplicate(sendResult.isDuplicate),
          deliveredAt: createdEmail.createdAt.toISOString(),
        };
      }
    }

    return {
      inApp: inAppResult,
      email: emailResult,
    };
  }

  /**
   * Retrieve notification feed for a user with unread counter.
   */
  async getUserNotifications(
    userId,
    options?{
      unreadOnly?;
      channel?;
      limit?;
      offset?;
    }
  ) {
    const where = { userId };
    if (options?.unreadOnly) {
      where.readAt = null;
    }
    if (options?.channel) {
      where.channel = options.channel;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, readAt },
      }),
    ]);

    return {
      items: items [],
      total,
      unreadCount,
    };
  }

  /**
   * Mark an individual notification .
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error(`Notification not found: "${notificationId}".`);
    }

    if (notification.readAt) {
      return notification ;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return updated ;
  }

  /**
   * Mark all notifications for a user .
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }
}

export const notificationService = new NotificationService();