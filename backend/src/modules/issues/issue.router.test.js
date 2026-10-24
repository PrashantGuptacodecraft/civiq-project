import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { issueRouter } from './issue.router.js';
import { prisma } from '@civiq/db';
import { createHash } from 'crypto';
vi.mock('@civiq/db', () => ({
    prisma: {
        session: {
            findUnique: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        jurisdiction: {
            findUnique: vi.fn(),
        },
        issue: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        verificationHistory: {
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    },
    IssueStatus: {
        SUBMITTED: 'SUBMITTED',
    },
    VerificationStatus: {
        PENDING: 'PENDING',
    },
    IssueSeverity: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
    },
}));
describe('IssueRouter - API Integration Tests', () => {
    const app = express();
    app.use(express.json());
    app.use('/issues', issueRouter);
    const testToken = 'valid-test-session-token-xyz';
    const tokenHash = createHash('sha256').update(testToken).digest('hex');
    const mockActiveUser = {
        id: 'user-auth-123',
        email: 'citizen@civiq.dev',
        role: 'CITIZEN',
        status: 'ACTIVE',
    };
    const mockSession = {
        id: 'session-123',
        userId: mockActiveUser.id,
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        user: mockActiveUser,
    };
    const mockJurisdiction = {
        id: 'mh-pune',
        name: 'Pune',
        type: 'DISTRICT',
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Authentication Enforcement', () => {
        it('returns 401 when Authorization header is missing', async () => {
            const res = await request(app)
                .post('/issues')
                .send({
                description: 'A deep pothole on MG Road near the signal',
                categoryId: 'roads_pothole',
                jurisdictionId: 'mh-pune',
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Bearer token missing');
        });
        it('returns 401 when session token is invalid or expired', async () => {
            vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
            const res = await request(app)
                .post('/issues')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                description: 'A deep pothole on MG Road near the signal',
                categoryId: 'roads_pothole',
                jurisdictionId: 'mh-pune',
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid, revoked, or expired session token');
        });
        it('returns 403 when user is suspended', async () => {
            vi.mocked(prisma.session.findUnique).mockResolvedValue({
                ...mockSession,
                user: { ...mockActiveUser, status: 'SUSPENDED' },
            });
            const res = await request(app)
                .post('/issues')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                description: 'A deep pothole on MG Road near the signal',
                categoryId: 'roads_pothole',
                jurisdictionId: 'mh-pune',
            });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('suspended');
        });
    });
    describe('POST /issues - Creation API', () => {
        it('returns 400 when input validation fails (e.g. invalid category)', async () => {
            vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);
            const res = await request(app)
                .post('/issues')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                description: 'A deep pothole on MG Road near the signal',
                categoryId: 'non_existent_category',
                jurisdictionId: 'mh-pune',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid category');
        });
        it('returns 201 and immutable issue ID upon successful submission', async () => {
            vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);
            vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(mockJurisdiction);
            const createdIssue = {
                id: 'issue-cuid-999',
                title: 'Broken streetlight on Main Ave',
                description: 'Streetlight has been flickering and completely off for 3 days',
                categoryId: 'roads_streetlighting',
                jurisdictionId: 'mh-pune',
                latitude: 18.5204,
                longitude: 73.8567,
                address: 'Main Ave, Pune',
                state: 'Maharashtra',
                district: 'Pune',
                city: 'Pune',
                source: 'CITIZEN_WEB',
                severity: 'MEDIUM',
                status: 'SUBMITTED',
                verificationStatus: 'PENDING',
                reportedById: mockActiveUser.id,
                version: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            vi.mocked(prisma.issue.create).mockResolvedValue(createdIssue);
            vi.mocked(prisma.verificationHistory.create).mockResolvedValue({ id: 'vh-100' });
            const res = await request(app)
                .post('/issues')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                title: 'Broken streetlight on Main Ave',
                description: 'Streetlight has been flickering and completely off for 3 days',
                categoryId: 'roads_streetlighting',
                jurisdictionId: 'mh-pune',
                latitude: 18.5204,
                longitude: 73.8567,
                address: 'Main Ave, Pune',
                state: 'Maharashtra',
                district: 'Pune',
                city: 'Pune',
                source: 'CITIZEN_WEB',
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe('issue-cuid-999');
            expect(res.body.data.status).toBe('SUBMITTED');
            expect(res.body.data.verificationStatus).toBe('PENDING');
            expect(res.body.data.categoryId).toBe('roads_streetlighting');
            expect(res.body.data.jurisdictionId).toBe('mh-pune');
            expect(res.body.data.source).toBe('CITIZEN_WEB');
        });
    });
    describe('GET /issues/:id - Fetch Issue API', () => {
        it('returns 200 with issue data when found', async () => {
            const mockIssue = {
                id: 'issue-cuid-999',
                title: 'Broken streetlight',
                status: 'SUBMITTED',
                verificationStatus: 'PENDING',
            };
            vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue);
            const res = await request(app).get('/issues/issue-cuid-999');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe('issue-cuid-999');
        });
        it('returns 404 when issue is not found', async () => {
            vi.mocked(prisma.issue.findUnique).mockResolvedValue(null);
            const res = await request(app).get('/issues/non-existent-id');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Issue not found');
        });
    });
    describe('GET /issues - List Issues API', () => {
        it('returns 200 with list of issues', async () => {
            vi.mocked(prisma.issue.findMany).mockResolvedValue([
                { id: 'iss-1', title: 'Issue 1' },
                { id: 'iss-2', title: 'Issue 2' },
            ]);
            const res = await request(app).get('/issues?jurisdictionId=mh-pune');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });
    });
});
