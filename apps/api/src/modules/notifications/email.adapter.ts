import { randomUUID } from 'crypto';
import { SendEmailParams, SendEmailResult, SentEmailRecord, IEmailAdapter } from './notification.types';

export class MemoryEmailAdapter implements IEmailAdapter {
  private sentEmails: SentEmailRecord[] = [];
  private idempotencyIndex: Map<string, SentEmailRecord> = new Map();

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
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
    const record: SentEmailRecord = {
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

  getSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
    this.idempotencyIndex.clear();
  }
}

let defaultEmailAdapter: MemoryEmailAdapter = new MemoryEmailAdapter();

export function getEmailAdapter(): MemoryEmailAdapter {
  return defaultEmailAdapter;
}

export function setEmailAdapter(adapter: MemoryEmailAdapter): void {
  defaultEmailAdapter = adapter;
}
