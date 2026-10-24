import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeographyService } from './geography.service.js';
import { prisma } from '@civiq/db';
import { CURRENT_RESOLVER_SOURCE, CURRENT_RESOLVER_VERSION } from '@civiq/contracts';
vi.mock('@civiq/db', () => ({
    prisma: {
        jurisdiction: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        jurisdictionBoundary: {
            findUnique: vi.fn(),
        },
        issue: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        verificationHistory: {
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    },
    JurisdictionType: {
        COUNTRY: 'COUNTRY',
        STATE_UT: 'STATE_UT',
        DISTRICT: 'DISTRICT',
        LOCAL_BODY: 'LOCAL_BODY',
        BLOCK: 'BLOCK',
        WARD_VILLAGE: 'WARD_VILLAGE',
    },
}));
describe('GeographyService - Geospatial Jurisdiction Resolution', () => {
    let service;
    beforeEach(() => {
        vi.clearAllMocks();
        service = new GeographyService();
    });
    describe('Point-in-Polygon Hierarchy Resolution', () => {
        it('resolves coordinates inside Aundh-Baner Ward to full administrative hierarchy', async () => {
            // 18.555 N, 73.805 E is inside Aundh-Baner Ward (PMC, Pune, Maharashtra, India)
            const point = { latitude: 18.555, longitude: 73.805 };
            const result = await service.resolvePointToJurisdiction(point);
            expect(result.matchedJurisdiction).not.toBeNull();
            expect(result.matchedJurisdiction?.id).toBe('mh-pune-pmc-aundh');
            expect(result.matchedJurisdiction?.name).toBe('Aundh-Baner Ward');
            expect(result.matchedJurisdiction?.type).toBe('WARD_VILLAGE');
            // Verify hierarchy path up to country
            const pathIds = result.matchedJurisdiction?.hierarchyPath.map((h) => h.id);
            expect(pathIds).toEqual(['ind', 'mh', 'mh-pune', 'mh-pune-pmc', 'mh-pune-pmc-aundh']);
            // Resolver metadata
            expect(result.resolverVersion).toBe(CURRENT_RESOLVER_VERSION);
            expect(result.resolverSource).toBe(CURRENT_RESOLVER_SOURCE);
            expect(result.confidence).toBeGreaterThan(0.9);
            expect(result.isAmbiguous).toBe(false);
            expect(result.requiresManualConfirmation).toBe(false);
        });
        it('resolves coordinates inside Kothrud Ward to PMC hierarchy', async () => {
            // 18.500 N, 73.810 E is inside Kothrud-Bavdhan Ward
            const point = { latitude: 18.500, longitude: 73.810 };
            const result = await service.resolvePointToJurisdiction(point);
            expect(result.matchedJurisdiction?.id).toBe('mh-pune-pmc-kothrud');
            expect(result.matchedJurisdiction?.name).toBe('Kothrud-Bavdhan Ward');
            expect(result.isAmbiguous).toBe(false);
        });
        it('resolves coordinates inside PCMC to Pimpri-Chinchwad Municipal Corporation', async () => {
            // 18.620 N, 73.820 E is well inside PCMC
            const point = { latitude: 18.620, longitude: 73.820 };
            const result = await service.resolvePointToJurisdiction(point);
            expect(result.matchedJurisdiction?.id).toBe('mh-pune-pcmc');
            expect(result.matchedJurisdiction?.name).toBe('Pimpri-Chinchwad Municipal Corporation');
            expect(result.isAmbiguous).toBe(false);
        });
        it('resolves coordinates in Mumbai BMC to Brihanmumbai Municipal Corporation', async () => {
            // 19.076 N, 72.877 E is inside Mumbai BMC
            const point = { latitude: 19.076, longitude: 72.877 };
            const result = await service.resolvePointToJurisdiction(point);
            expect(result.matchedJurisdiction?.id).toBe('mh-mumbai-bmc');
            expect(result.matchedJurisdiction?.name).toBe('Brihanmumbai Municipal Corporation');
            expect(result.isAmbiguous).toBe(false);
        });
    });
    describe('Ambiguous Boundary Detection & Candidates', () => {
        it('detects boundary ambiguity for points within the border buffer between PMC and PCMC', async () => {
            // Latitude 18.57502 is right on the dividing line (18.575) between PMC and PCMC
            // Within ~20 meters of the boundary, less than DEFAULT_AMBIGUITY_BUFFER_METERS (75m)
            const borderPoint = { latitude: 18.57502, longitude: 73.805 };
            const result = await service.resolvePointToJurisdiction(borderPoint);
            expect(result.isAmbiguous).toBe(true);
            expect(result.requiresManualConfirmation).toBe(true);
            expect(result.ambiguityReason).toContain('boundary');
            expect(result.candidateJurisdictions.length).toBeGreaterThanOrEqual(2);
            // Verify that both PMC / Aundh and PCMC appear in the candidates list
            const candidateIds = result.candidateJurisdictions.map((c) => c.id);
            expect(candidateIds.some((id) => id.includes('pmc'))).toBe(true);
            expect(candidateIds.some((id) => id.includes('pcmc'))).toBe(true);
            const adjacentCand = result.candidateJurisdictions.find((c) => c.isContestedOrAdjacent);
            expect(adjacentCand).toBeDefined();
            expect(adjacentCand?.distanceToBoundaryMeters).toBeLessThanOrEqual(75);
        });
    });
    describe('Out of Bounds and Error Handling', () => {
        it('returns null matched jurisdiction for coordinates completely outside India', async () => {
            const oceanPoint = { latitude: 0.0, longitude: 80.0 };
            const result = await service.resolvePointToJurisdiction(oceanPoint);
            expect(result.matchedJurisdiction).toBeNull();
            expect(result.confidence).toBe(0);
            expect(result.requiresManualConfirmation).toBe(true);
            expect(result.candidateJurisdictions).toEqual([]);
        });
        it('throws error for invalid latitude values', async () => {
            await expect(service.resolvePointToJurisdiction({ latitude: 95.0, longitude: 73.0 })).rejects.toThrow('Latitude must be between -90 and 90 degrees.');
        });
        it('throws error for invalid longitude values', async () => {
            await expect(service.resolvePointToJurisdiction({ latitude: 18.5, longitude: 200.0 })).rejects.toThrow('Longitude must be between -180 and 180 degrees.');
        });
        it('throws error for NaN coordinates', async () => {
            await expect(service.resolvePointToJurisdiction({ latitude: NaN, longitude: 73.0 })).rejects.toThrow('Valid numeric latitude and longitude coordinates are required.');
        });
    });
    describe('Manual Jurisdiction Correction', () => {
        it('successfully confirms and audits manual jurisdiction correction for an issue', async () => {
            const mockIssue = {
                id: 'issue-border-1',
                title: 'Road crack near bridge',
                jurisdictionId: 'mh-pune-pmc',
                verificationStatus: 'PENDING',
            };
            vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue);
            vi.mocked(prisma.issue.update).mockResolvedValue({ ...mockIssue, jurisdictionId: 'mh-pune-pcmc' });
            vi.mocked(prisma.verificationHistory.create).mockResolvedValue({ id: 'vh-1' });
            const correction = await service.recordManualCorrection({
                issueId: 'issue-border-1',
                point: { latitude: 18.57502, longitude: 73.805 },
                originalJurisdictionId: 'mh-pune-pmc',
                selectedJurisdictionId: 'mh-pune-pcmc',
                reason: 'Bridge is maintained under PCMC municipal jurisdiction',
                userId: 'citizen-user-1',
            });
            expect(correction.success).toBe(true);
            expect(correction.jurisdictionId).toBe('mh-pune-pcmc');
            expect(correction.manualJurisdictionConfirmed).toBe(true);
            expect(correction.resolverVersion).toBe(CURRENT_RESOLVER_VERSION);
            expect(correction.resolverSource).toBe(CURRENT_RESOLVER_SOURCE);
            // Verify Prisma issue update
            expect(prisma.issue.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'issue-border-1' },
                data: expect.objectContaining({
                    jurisdictionId: 'mh-pune-pcmc',
                    manualJurisdictionConfirmed: true,
                    isBoundaryAmbiguous: false,
                }),
            }));
            // Verify audit history creation
            expect(prisma.verificationHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    issueId: 'issue-border-1',
                    changedById: 'citizen-user-1',
                    reason: expect.stringContaining('Bridge is maintained under PCMC'),
                }),
            }));
        });
        it('records manual correction without issueId for pre-submission confirmation', async () => {
            const correction = await service.recordManualCorrection({
                point: { latitude: 18.575, longitude: 73.805 },
                selectedJurisdictionId: 'mh-pune-pmc',
                reason: 'Citizen verified location is under PMC',
            });
            expect(correction.success).toBe(true);
            expect(correction.jurisdictionId).toBe('mh-pune-pmc');
            expect(correction.manualJurisdictionConfirmed).toBe(true);
            expect(prisma.issue.update).not.toHaveBeenCalled();
        });
        it('throws error when selected jurisdiction is missing', async () => {
            await expect(service.recordManualCorrection({
                point: { latitude: 18.5, longitude: 73.8 },
                selectedJurisdictionId: '',
            })).rejects.toThrow('A selected jurisdiction ID is required');
        });
    });
    describe('Boundary and Jurisdiction Queries', () => {
        it('retrieves boundary coordinates and bbox for a known jurisdiction', async () => {
            vi.mocked(prisma.jurisdictionBoundary.findUnique).mockResolvedValue(null);
            const boundary = await service.getJurisdictionBoundary('mh-pune-pmc');
            expect(boundary).not.toBeNull();
            expect(boundary?.jurisdictionId).toBe('mh-pune-pmc');
            expect(boundary?.bbox.minLat).toBe(18.44);
            expect(boundary?.coordinates.length).toBeGreaterThan(0);
        });
        it('returns null boundary for an unregistered jurisdiction', async () => {
            vi.mocked(prisma.jurisdictionBoundary.findUnique).mockResolvedValue(null);
            const boundary = await service.getJurisdictionBoundary('unknown-jurisdiction');
            expect(boundary).toBeNull();
        });
        it('retrieves jurisdiction list with fixture fallback', async () => {
            vi.mocked(prisma.jurisdiction.findMany).mockResolvedValue([]);
            const jurisdictions = await service.getJurisdictions();
            expect(jurisdictions.length).toBeGreaterThan(0);
            expect(jurisdictions.some((j) => j.id === 'mh-pune-pmc')).toBe(true);
        });
    });
});
