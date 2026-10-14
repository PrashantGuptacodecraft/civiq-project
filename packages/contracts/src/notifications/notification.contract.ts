export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface IssueStatusChangeEvent {
  eventId: string;
  issueId: string;
  issueTitle: string;
  previousStatus: string;
  newStatus: string;
  changedById: string;
  recipientUserId: string;
  recipientEmail?: string | null | undefined;
  timestamp: string;
  metadata?: Record<string, any> | undefined;
}

export interface NotificationDispatchPayload {
  idempotencyKey: string;
  userId: string;
  issueId?: string | undefined;
  channel: NotificationChannel;
  title: string;
  message: string;
  recipientEmail?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface NotificationDispatchResult {
  idempotencyKey: string;
  delivered: boolean;
  channel: NotificationChannel;
  notificationId?: string | undefined;
  isDuplicate: boolean;
  deliveredAt: string;
}

export interface UserNotificationItem {
  id: string;
  userId: string;
  issueId?: string | null | undefined;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  idempotencyKey: string;
  metadata?: any;
  readAt?: Date | null | undefined;
  sentAt?: Date | null | undefined;
  createdAt: Date;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
  idempotencyKey?: string | undefined;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  isDuplicate?: boolean | undefined;
}

export interface IEmailAdapter {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
