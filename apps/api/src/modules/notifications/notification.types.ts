import {
  IssueStatusChangeEvent,
  NotificationChannel,
  NotificationDispatchPayload,
  NotificationDispatchResult,
  NotificationStatus,
  UserNotificationItem,
  SendEmailParams,
  SendEmailResult,
  IEmailAdapter,
} from '@civiq/contracts';

export type {
  IssueStatusChangeEvent,
  NotificationChannel,
  NotificationDispatchPayload,
  NotificationDispatchResult,
  NotificationStatus,
  UserNotificationItem,
  SendEmailParams,
  SendEmailResult,
  IEmailAdapter,
};

export interface SentEmailRecord {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
  idempotencyKey?: string | undefined;
  messageId: string;
  sentAt: Date;
}
