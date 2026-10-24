export interface IssueStatusChangeEvent {
  eventId;
  issueId;
  issueTitle;
  previousStatus;
  newStatus;
  changedById;
  recipientUserId;
  recipientEmail? | undefined;
  timestamp;
  metadata?, any> | undefined;
}

export interface NotificationDispatchPayload {
  idempotencyKey;
  userId;
  issueId?;
  channel;
  title;
  message;
  recipientEmail?;
  metadata?, any> | undefined;
}

export interface NotificationDispatchResult {
  idempotencyKey;
  delivered;
  channel;
  notificationId?;
  isDuplicate;
  deliveredAt;
}

export interface UserNotificationItem {
  id;
  userId;
  issueId? | undefined;
  channel;
  title;
  message;
  status;
  idempotencyKey;
  metadata?;
  readAt?;
  sentAt?;
  createdAt;
}

export interface SendEmailParams {
  to;
  subject;
  text;
  html?;
  idempotencyKey?;
}

export interface SendEmailResult {
  success;
  messageId;
  isDuplicate?;
}

export interface IEmailAdapter {
  sendEmail(params);
}