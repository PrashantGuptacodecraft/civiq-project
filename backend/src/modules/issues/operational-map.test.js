import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { issueRouter } from './issue.router.js';
import { issueService, calculateClusters } from './issue.service.js';
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
        issue: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        verificationHistory: {
            create: vi.fn(),
        },
    },
    IssueStatus: {
        SUBMITTED: 'SUBMITTED',
        IN_PROGRESS: 'IN_PROGRESS',
        RESOLVED: 'RESOLVED',
        CLOSED: 'CLOSED',
    },
    VerificationStatus: {
        PENDING: 'PENDING',
        IN_REVIEW: 'IN_REVIEW',
        VERIFIED: 'VERIFIED',
    },
    IssueSeverity: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL',
    },
}));

describe('Phase 44: Operational Map API & Privacy Enforcement', () => {
    const app = express();
    app.use(express.json());
    app.use('/issues', issueRouter);

    const testOfficialToken = 'official-test-token-44';
    const officialTokenHash = createHash('sha256').update(testOfficialToken).digest('hex');

    const testCitizenToken = 'citizen-test-token-44';
    const citizenTokenHash = createHash('sha256').update(testCitizenToken).digest('hex');

    const mockOfficialUser = {
        id: 'user-supervisor-01',
        email: 'supervisor@pune-gov.in',
        phone: '+919876543210',
        role: 'FIELD_SUPERVISOR',
        status: 'ACTIVE',
    };

    const mockCitizenUser = {
        id: 'user-citizen-01',
        email: 'citizen@example.com',
        phone: '+919999988888',
        role: 'CITIZEN',
        status: 'ACTIVE',
    };

    const sampleIssues = [
        {
            id: 'issue-101',
            title: 'Critical Open Manhole near Swargate',
            description: 'Uncovered manhole posing severe hazard to motorists',
            status: 'SUBMITTED',
            severity: 'CRITICAL',
            verificationStatus: 'VERIFIED',
            categoryId: 'sanitation_open_manhole',
            latitude: 18.5015,
            longitude: 73.8580,
            address: 'Swargate Chowk, Pune',
            jurisdictionId: 'mh-pune-pmc',
            createdAt: new Date('2026-10-25T08:00:00Z'),
            updatedAt: new Date('2026-10-25T08:00:00Z'),
            reportedBy: {
                id: 'citizen-reporter-1',
                email: 'reporter1@civiq.org',
                phone: '+919800000001',
                role: 'CITIZEN',
                status: 'ACTIVE',
            },
            evidence: [
                {
                    id: 'ev-1',
                    storageKey: 'secure/evidence/2026/ev-101.jpg',
                    fileHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                    mimeType: 'image/jpeg',
                    sizeBytes: 2048500,
                    captureLatitude: 18.50151,
                    captureLongitude: 73.85802,
                },
            ],
        },
        {
            id: 'issue-102',
            title: 'Overflowing Sewage near Swargate Bus Stand',
            description: 'Drain blocked causing foul water leakage',
            status: 'IN_PROGRESS',
            severity: 'HIGH',
            verificationStatus: 'IN_REVIEW',
            categoryId: 'sanitation_blocked_drain',
            latitude: 18.5020,
            longitude: 73.8585,
            address: 'Swargate Bus Stand, Pune',
            jurisdictionId: 'mh-pune-pmc',
            createdAt: new Date('2026-10-25T08:30:00Z'),
            updatedAt: new Date('2026-10-25T08:30:00Z'),
            reportedBy: {
                id: 'citizen-reporter-2',
                email: 'reporter2@civiq.org',
                phone: '+919800000002',
                role: 'CITIZEN',
                status: 'ACTIVE',
            },
            evidence: [
                {
                    id: 'ev-2',
                    storageKey: 'secure/evidence/2026/ev-102.jpg',
                    fileHash: 'sha256:a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
                    mimeType: 'image/jpeg',
                    sizeBytes: 1532000,
                },
            ],
        },
        {
            id: 'issue-103',
            title: 'Broken Streetlight in Shivaji Nagar',
            description: 'Streetlight pole dark for 3 days',
            status: 'ASSIGNED',
            severity: 'MEDIUM',
            verificationStatus: 'PENDING',
            categoryId: 'roads_streetlighting',
            latitude: 18.5314,
            longitude: 73.8446,
            address: 'Shivaji Nagar, Pune',
            jurisdictionId: 'mh-pune-pmc',
            createdAt: new Date('2026-10-25T09:00:00Z'),
            updatedAt: new Date('2026-10-25T09:00:00Z'),
            reportedBy: {
                id: 'citizen-reporter-3',
                email: 'reporter3@civiq.org',
                phone: '+919800000003',
                role: 'CITIZEN',
                status: 'ACTIVE',
            },
            evidence: [],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.issue.findMany).mockResolvedValue([...sampleIssues]);
        vi.mocked(prisma.session.findUnique).mockImplementation(async ({ where }) => {
            if (where.tokenHash === officialTokenHash) {
                return {
                    id: 'session-official',
                    tokenHash: officialTokenHash,
                    isRevoked: false,
                    expiresAt: new Date(Date.now() + 86400000),
                    user: mockOfficialUser,
                };
            }
            if (where.tokenHash === citizenTokenHash) {
                return {
                    id: 'session-citizen',
                    tokenHash: citizenTokenHash,
                    isRevoked: false,
                    expiresAt: new Date(Date.now() + 86400000),
                    user: mockCitizenUser,
                };
            }
            return null;
        });
    });

    describe('Spatial Clustering Algorithm', () => {
        it('clusters close issues and resolves dominant severity and status', () => {
            const clusters = calculateClusters(sampleIssues, 0.02);

            // issue-101 (18.5015, 73.8580) and issue-102 (18.5020, 73.8585) fall in same grid cell
            const cluster = clusters.find((c) => c.isCluster);
            expect(cluster).toBeDefined();
            expect(cluster.count).toBe(2);
            expect(cluster.dominantSeverity).toBe('CRITICAL'); // Critical takes precedence
            expect(cluster.issueIds).toContain('issue-101');
            expect(cluster.issueIds).toContain('issue-102');

            // issue-103 is far away in Shivaji Nagar and should be an isolated point
            const single = clusters.find((c) => !c.isCluster && c.issueId === 'issue-103');
            expect(single).toBeDefined();
            expect(single.title).toContain('Broken Streetlight');
        });
    });

    describe('Public View & Privacy Redaction', () => {
        it('redacts exact evidence and citizen PII when accessed anonymously', async () => {
            const res = await request(app).get('/issues/operational-map');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isPublicView).toBe(true);
            expect(res.body.data.isAuthorizedOfficial).toBe(false);

            const items = res.body.data.items;
            expect(items.length).toBe(3);

            // Check evidence is sanitized: no storageKey, no fileHash
            const itemWithEvidence = items.find((i) => i.id === 'issue-101');
            expect(itemWithEvidence.isRedacted).toBe(true);
            expect(itemWithEvidence.evidence[0].storageKey).toBeUndefined();
            expect(itemWithEvidence.evidence[0].fileHash).toBeUndefined();
            expect(itemWithEvidence.evidence[0].captureLatitude).toBeUndefined();

            // Check citizen PII is sanitized: no phone, no email
            expect(itemWithEvidence.reportedBy.phone).toBeUndefined();
            expect(itemWithEvidence.reportedBy.email).toBeUndefined();
        });

        it('redacts exact evidence when accessed by a CITIZEN role user', async () => {
            const res = await request(app)
                .get('/issues/operational-map')
                .set('Authorization', `Bearer ${testCitizenToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isPublicView).toBe(true);
            expect(res.body.data.isAuthorizedOfficial).toBe(false);

            const item = res.body.data.items[0];
            expect(item.isRedacted).toBe(true);
            expect(item.evidence[0]?.storageKey).toBeUndefined();
        });
    });

    describe('Authorized Official Role Access', () => {
        it('provides exact forensic evidence and full metadata to authorized supervisors', async () => {
            const res = await request(app)
                .get('/issues/operational-map')
                .set('Authorization', `Bearer ${testOfficialToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isPublicView).toBe(false);
            expect(res.body.data.isAuthorizedOfficial).toBe(true);

            const itemWithEvidence = res.body.data.items.find((i) => i.id === 'issue-101');
            expect(itemWithEvidence.isRedacted).toBe(false);
            expect(itemWithEvidence.evidence[0].storageKey).toBe('secure/evidence/2026/ev-101.jpg');
            expect(itemWithEvidence.evidence[0].fileHash).toContain('sha256:');
            expect(itemWithEvidence.reportedBy.email).toBe('reporter1@civiq.org');
            expect(itemWithEvidence.reportedBy.phone).toBe('+919800000001');
        });
    });

    describe('Filtering and Pagination', () => {
        it('filters by department correctly', async () => {
            const res = await request(app)
                .get('/issues/operational-map?department=Sewerage');

            expect(res.status).toBe(200);
            // Swargate open manhole and blocked drain belong to Sewerage & Drainage Department
            expect(res.body.data.items.length).toBe(2);
            expect(res.body.data.items.every((i) => i.department.includes('Sewerage'))).toBe(true);
        });

        it('respects pagination parameters', async () => {
            const res = await request(app)
                .get('/issues/operational-map?page=1&limit=2');

            expect(res.status).toBe(200);
            expect(res.body.data.page).toBe(1);
            expect(res.body.data.limit).toBe(2);
            expect(res.body.data.total).toBe(3);
            expect(res.body.data.totalPages).toBe(2);
            expect(res.body.data.items.length).toBe(2);
        });
    });
});
