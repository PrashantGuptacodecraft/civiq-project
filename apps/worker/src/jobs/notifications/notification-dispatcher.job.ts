import { prisma, NotificationChannel, NotificationStatus } from '@civiq/db';
import {
  IssueStatusChangeEvent,
  NotificationDispatchPayload,
  NotificationDispatchResult,
  IEmailAdapter,
  SendEmailParams,
  SendEmailResult,
} from '@civiq/contracts';
import { randomUUID } from 'crypto';

export class WorkerMemoryEmailAdapter implements IEmailAdapter {
  private sent: Array<SendEmailParams & { messageId: string; sentAt: Date }> = [];
  private idempotencyMap: Map<string, string> = new Map();

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const { to, subject, text, idempotencyKey } = params;
    if (!to || !subject || !text) {
      throw new Error('Email recipient, subject, and text are required.');
    }

    if (idempotencyKey && this.idempotencyMap.has(idempotencyKey)) {
      return {
        success: true,
        messageId: this.idempotencyMap.get(idempotencyKey)!,
        isDuplicate: true,
      };
    }

    const messageId = `msg_${randomUUID()}`;
    this.sent.push({ ...params, messageId, sentAt: new Date() });
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, messageId);
    }

    return {
      success: true,
      messageId,
      isDuplicate: false,
    };
  }

  getSent() {
    return [...this.sent];
  }

  clear() {
    this.sent = [];
    this.idempotencyMap.clear();
  }
}

export class NotificationDispatcherJob {
  private emailAdapter: IEmailAdapter;

  constructor(emailAdapter?: IEmailAdapter) {
    this.emailAdapter = emailAdapter ?? new WorkerMemoryEmailAdapter();
  }

  /**
   * Process a direct notification payload with strict idempotency verification.
   */
  async process(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult> {
    const { idempotencyKey, userId, issueId, channel, title, message, recipientEmail, metadata } = payload;

    if (!idempotencyKey) {
      throw new Error('idempotencyKey is required for notification dispatch.');
    }

    // 1. Check if already processed
    const existing = await prisma.notification.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return {
        idempotencyKey,
        delivered: true,
        channel: existing.channel as NotificationChannel,
        notificationId: existing.id,
        isDuplicate: true,
        deliveredAt: existing.createdAt.toISOString(),
      };
    }

    // 2. Deliver according to channel
    if (channel === 'EMAIL') {
      const targetEmail = recipientEmail;
      if (!targetEmail) {
        throw new Error(`Recipient email address missing for EMAIL notification: ${idempotencyKey}`);
      }

      const emailSend = await this.emailAdapter.sendEmail({
        to: targetEmail,
        subject: title,
        text: message,
        idempotencyKey,
      });

      const record = await prisma.notification.create({
        data: {
          userId,
          issueId: issueId ?? null,
          channel: NotificationChannel.EMAIL,
          title,
          message,
          status: emailSend.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          idempotencyKey,
          sentAt: emailSend.success ? new Date() : null,
          failedAt: !emailSend.success ? new Date() : null,
          metadata: {
            ...(metadata ?? {}),
            messageId: emailSend.messageId,
          },
        },
      });

      return {
        idempotencyKey,
        delivered: emailSend.success,
        channel: 'EMAIL',
        notificationId: record.id,
        isDuplicate: Boolean(emailSend.isDuplicate),
        deliveredAt: record.createdAt.toISOString(),
      };
    }

    // Default: IN_APP notification
    const inAppRecord = await prisma.notification.create({
      data: {
        userId,
        issueId: issueId ?? null,
        channel: NotificationChannel.IN_APP,
        title,
        message,
        status: NotificationStatus.SENT,
        idempotencyKey,
        sentAt: new Date(),
        metadata: metadata ?? {},
      },
    });

    return {
      idempotencyKey,
      delivered: true,
      channel: 'IN_APP',
      notificationId: inAppRecord.id,
      isDuplicate: false,
      deliveredAt: inAppRecord.createdAt.toISOString(),
    };
  }

  /**
   * Process a lifecycle status change event into in-app and email notifications.
   */
  async processStatusChange(event: IssueStatusChangeEvent): Promise<{
    inApp: NotificationDispatchResult;
    email?: NotificationDispatchResult | undefined;
  }> {
    const title = `Issue ${event.newStatus}: ${event.issueTitle}`;
    const message = `Issue "${event.issueTitle}" transitioned from ${event.previousStatus} to ${event.newStatus}.`;

    const inAppPayload: NotificationDispatchPayload = {
      idempotencyKey: `worker:issue:${event.issueId}:status:${event.newStatus}:in_app`,
      userId: event.recipientUserId,
      issueId: event.issueId,
      channel: 'IN_APP',
      title,
      message,
      metadata: event.metadata ?? {},
    };

    const inApp = await this.process(inAppPayload);

    let email: NotificationDispatchResult | undefined = undefined;
    if (event.recipientEmail) {
      const emailPayload: NotificationDispatchPayload = {
        idempotencyKey: `worker:issue:${event.issueId}:status:${event.newStatus}:email`,
        userId: event.recipientUserId,
        issueId: event.issueId,
        channel: 'EMAIL',
        title,
        message,
        recipientEmail: event.recipientEmail,
        metadata: event.metadata ?? {},
      };
      email = await this.process(emailPayload);
    }

    return { inApp, email };
  }
}
