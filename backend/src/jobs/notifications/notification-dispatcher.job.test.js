import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationDispatcherJob, WorkerMemoryEmailAdapter } from './notification-dispatcher.job.js';
import { prisma } from '@civiq/db';
vi.mock('@civiq/db', () => ({
    prisma: {
        notification: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
    NotificationChannel: {
        IN_APP: 'IN_APP',
        EMAIL: 'EMAIL',
        SMS: 'SMS',
        PUSH: 'PUSH',
    },
    NotificationStatus: {
        PENDING: 'PENDING',
        SENT: 'SENT',
        FAILED: 'FAILED',
        READ: 'READ',
    },
}));
describe('NotificationDispatcherJob - Worker Background Delivery & Idempotency', () => {
    let emailAdapter;
    let job;
    beforeEach(() => {
        vi.clearAllMocks();
        emailAdapter = new WorkerMemoryEmailAdapter();
        job = new NotificationDispatcherJob(emailAdapter);
    });
    describe('Direct payload processing', () => {
        it('processes an IN_APP notification payload', async () => {
            vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
            const mockRecord = {
                id: 'notif-worker-1',
                userId: 'user-w1',
                issueId: 'iss-w1',
                channel: 'IN_APP',
                title: 'Title 1',
                message: 'Message 1',
                status: 'SENT',
                idempotencyKey: 'key-w1',
                createdAt: new Date(),
            };
            vi.mocked(prisma.notification.create).mockResolvedValue(mockRecord);
            const payload = {
                idempotencyKey: 'key-w1',
                userId: 'user-w1',
                issueId: 'iss-w1',
                channel: 'IN_APP',
                title: 'Title 1',
                message: 'Message 1',
            };
            const result = await job.process(payload);
            expect(result.delivered).toBe(true);
            expect(result.isDuplicate).toBe(false);
            expect(result.notificationId).toBe('notif-worker-1');
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    idempotencyKey: 'key-w1',
                    channel: 'IN_APP',
                }),
            });
        });
        it('processes an EMAIL notification payload via email adapter', async () => {
            vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
            const mockRecord = {
                id: 'notif-worker-email-1',
                userId: 'user-w1',
                issueId: 'iss-w1',
                channel: 'EMAIL',
                title: 'Email alert',
                message: 'Status alert',
                status: 'SENT',
                idempotencyKey: 'key-email-1',
                createdAt: new Date(),
            };
            vi.mocked(prisma.notification.create).mockResolvedValue(mockRecord);
            const payload = {
                idempotencyKey: 'key-email-1',
                userId: 'user-w1',
                issueId: 'iss-w1',
                channel: 'EMAIL',
                title: 'Email alert',
                message: 'Status alert',
                recipientEmail: 'target@civiq.dev',
            };
            const result = await job.process(payload);
            expect(result.delivered).toBe(true);
            expect(result.isDuplicate).toBe(false);
            expect(result.channel).toBe('EMAIL');
            const sentEmails = emailAdapter.getSent();
            expect(sentEmails).toHaveLength(1);
            expect(sentEmails[0].to).toBe('target@civiq.dev');
            expect(sentEmails[0].idempotencyKey).toBe('key-email-1');
        });
        it('enforces strict idempotency and skips duplicate dispatch', async () => {
            const existingRecord = {
                id: 'notif-existing-1',
                channel: 'IN_APP',
                createdAt: new Date('2026-10-14T08:00:00Z'),
            };
            vi.mocked(prisma.notification.findUnique).mockResolvedValue(existingRecord);
            const payload = {
                idempotencyKey: 'existing-key-99',
                userId: 'user-w1',
                channel: 'IN_APP',
                title: 'Repeat',
                message: 'Repeat message',
            };
            const result = await job.process(payload);
            expect(result.delivered).toBe(true);
            expect(result.isDuplicate).toBe(true);
            expect(result.notificationId).toBe('notif-existing-1');
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });
        it('throws error when EMAIL payload has no recipientEmail', async () => {
            vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
            const payload = {
                idempotencyKey: 'key-no-email',
                userId: 'user-w1',
                channel: 'EMAIL',
                title: 'Missing recipient',
                message: 'Body',
            };
            await expect(job.process(payload)).rejects.toThrow('Recipient email address missing');
        });
    });
    describe('processStatusChange', () => {
        it('processes lifecycle status change event into in-app and email channels', async () => {
            vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.notification.create)
                .mockResolvedValueOnce({
                id: 'notif-in-app-status',
                channel: 'IN_APP',
                createdAt: new Date(),
            })
                .mockResolvedValueOnce({
                id: 'notif-email-status',
                channel: 'EMAIL',
                createdAt: new Date(),
            });
            const event = {
                eventId: 'evt-w1',
                issueId: 'iss-w1',
                issueTitle: 'Water leakage',
                previousStatus: 'SUBMITTED',
                newStatus: 'RESOLVED',
                changedById: 'staff-w',
                recipientUserId: 'citizen-w',
                recipientEmail: 'citizen@civiq.dev',
                timestamp: new Date().toISOString(),
            };
            const res = await job.processStatusChange(event);
            expect(res.inApp.delivered).toBe(true);
            expect(res.inApp.channel).toBe('IN_APP');
            expect(res.email).toBeDefined();
            expect(res.email?.delivered).toBe(true);
            expect(res.email?.channel).toBe('EMAIL');
            expect(emailAdapter.getSent()).toHaveLength(1);
            expect(emailAdapter.getSent()[0].to).toBe('citizen@civiq.dev');
        });
    });
});
