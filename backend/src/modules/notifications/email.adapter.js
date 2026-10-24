import { randomUUID } from 'crypto';
import { SendEmailParams, SendEmailResult, SentEmailRecord, IEmailAdapter } from './notification.types';

export class MemoryEmailAdapter {
  sentEmails = [];
  idempotencyIndex = new Map();

  async sendEmail(params) {
    const { to, subject, text, html, idempotencyKey } = params;

    if (!to || !subject || !text) {
      throw new Error('Email recipient, subject, and body text are required.');
    }

    // Strict idempotency check
    if (idempotencyKey && this.idempotencyIndex.has(idempotencyKey)) {
      const existing = this.idempotencyIndex.get(idempotencyKey)!;
      return {
        success: true,
        messageId: existing.messageId,
        isDuplicate: true,
      };
    }

    const messageId = `msg_${randomUUID()}`;
    const record = {
      to,
      subject,
      text,
      html,
      idempotencyKey,
      messageId,
      sentAt: new Date(),
    };

    this.sentEmails.push(record);
    if (idempotencyKey) {
      this.idempotencyIndex.set(idempotencyKey, record);
    }

    return {
      success: true,
      messageId,
      isDuplicate: false,
    };
  }

  getSentEmails() {
    return [...this.sentEmails];
  }

  clear() {
    this.sentEmails = [];
    this.idempotencyIndex.clear();
  }
}

let defaultEmailAdapter = new MemoryEmailAdapter();

export function getEmailAdapter() {
  return defaultEmailAdapter;
}

export function setEmailAdapter(adapter) {
  defaultEmailAdapter = adapter;
}