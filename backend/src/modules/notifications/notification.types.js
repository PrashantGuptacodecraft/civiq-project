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
} from '@civiq/shared-contracts';

export interface SentEmailRecord {
  to;
  subject;
  text;
  html?;
  idempotencyKey?;
  messageId;
  sentAt;
}