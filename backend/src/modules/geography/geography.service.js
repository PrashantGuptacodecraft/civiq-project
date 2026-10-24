import { prisma } from '@civiq/db';
import { CURRENT_RESOLVER_SOURCE, CURRENT_RESOLVER_VERSION, DEFAULT_AMBIGUITY_BUFFER_METERS, } from '@civiq/contracts';
import { BOUNDARY_FIXTURES } from './boundary-fixtures.js';
import { distanceToPolygonBoundaryMeters, isPointInBoundingBox, isPointInPolygon, } from './point-in-polygon.js';
export class GeographyService {
    resolverVersion = CURRENT_RESOLVER_VERSION;
    resolverSource = CURRENT_RESOLVER_SOURCE;
    /**
     * Resolves a coordinate point [lat, lng] to its administrative jurisdiction
     * with boundary buffer ambiguity detection and candidate scoring.
     */
    async resolvePointToJurisdiction(point, options) {
        const { latitude, longitude } = point;
        const ambiguityBuffer = options?.ambiguityBufferMeters ?? DEFAULT_AMBIGUITY_BUFFER_METERS;
        // 1. Validate coordinate boundaries
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Valid numeric latitude and longitude coordinates are required.');
        }
        if (latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees.');
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees.');
        }
        const coordPair = [longitude, latitude];
        // 2. Load all available boundary fixtures
        const fixtures = Object.values(BOUNDARY_FIXTURES);
        // 3. Check Point-in-Polygon for all boundaries
        const insideFixtures = [];
        const proximityFixtures = [];
        for (const fixture of fixtures) {
            // Fast Bounding Box Filter
            if (isPointInBoundingBox(coordPair, fixture.bbox)) {
                if (isPointInPolygon(coordPair, fixture.coordinates)) {
                    insideFixtures.push(fixture);
                }
            }
            // Check distance to boundary for local bodies and wards
            if (fixture.type === 'LOCAL_BODY' || fixture.type === 'WARD_VILLAGE') {
                const distance = distanceToPolygonBoundaryMeters(coordPair, fixture.coordinates);
                if (distance <= ambiguityBuffer * 2) {
                    proximityFixtures.push({ fixture, distance });
                }
            }
        }
        // If point does not even fall within country boundary
        if (insideFixtures.length === 0) {
            return {
                matchedJurisdiction: null,
                resolverVersion: this.resolverVersion,
                resolverSource: this.resolverSource,
                confidence: 0,
                isAmbiguous: false,
                ambiguityReason: 'Point coordinates do not fall within any registered administrative boundary.',
                candidateJurisdictions: [],
                requiresManualConfirmation: true,
                point: { latitude, longitude },
                resolvedAt: new Date().toISOString(),
            };
        }
        // Sort matching fixtures by granularity: WARD_VILLAGE > LOCAL_BODY > DISTRICT > STATE_UT > COUNTRY
        const levelRank = {
            WARD_VILLAGE: 5,
            BLOCK: 4,
            LOCAL_BODY: 3,
            DISTRICT: 2,
            STATE_UT: 1,
            COUNTRY: 0,
        };
        insideFixtures.sort((a, b) => levelRank[b.type] - levelRank[a.type]);
        const mostGranular = insideFixtures[0];
        if (!mostGranular) {
            return {
                matchedJurisdiction: null,
                resolverVersion: this.resolverVersion,
                resolverSource: this.resolverSource,
                confidence: 0,
                isAmbiguous: false,
                ambiguityReason: 'Point coordinates do not fall within any registered administrative boundary.',
                candidateJurisdictions: [],
                requiresManualConfirmation: true,
                point: { latitude, longitude },
                resolvedAt: new Date().toISOString(),
            };
        }
        // Build hierarchy path from granular match up to Country
        const hierarchyPath = [];
        let currentFixture = mostGranular;
        while (currentFixture) {
            hierarchyPath.unshift({
                id: currentFixture.id,
                name: currentFixture.name,
                type: currentFixture.type,
                lgdCode: currentFixture.lgdCode,
            });
            if (currentFixture.parentId) {
                currentFixture = fixtures.find((f) => f.id === currentFixture.parentId);
            }
            else {
                break;
            }
        }
        // 4. Boundary Ambiguity Analysis
        // Check if point is close to the boundary of the primary local body or has adjacent competitors
        const primaryLocalBody = mostGranular.type === 'LOCAL_BODY'
            ? mostGranular
            : insideFixtures.find((f) => f.type === 'LOCAL_BODY') ?? mostGranular;
        const primaryDistance = distanceToPolygonBoundaryMeters(coordPair, primaryLocalBody.coordinates);
        const candidateJurisdictions = [];
        // Find neighboring local bodies within proximity buffer
        const adjacentCompetitors = proximityFixtures.filter((p) => p.fixture.type === 'LOCAL_BODY' &&
            p.fixture.id !== primaryLocalBody.id &&
            p.distance <= ambiguityBuffer);
        const isBoundaryAmbiguous = primaryDistance <= ambiguityBuffer && (adjacentCompetitors.length > 0 || primaryDistance < 50);
        let ambiguityReason = null;
        if (isBoundaryAmbiguous) {
            const competitorNames = adjacentCompetitors.map((c) => c.fixture.name).join(', ');
            ambiguityReason = competitorNames
                ? `Point is within ${Math.round(primaryDistance)}m of boundary between ${primaryLocalBody.name} and ${competitorNames}.`
                : `Point is within ${Math.round(primaryDistance)}m of jurisdiction boundary border zone.`;
            // Add primary candidate
            candidateJurisdictions.push({
                id: mostGranular.id,
                name: mostGranular.name,
                type: mostGranular.type,
                lgdCode: mostGranular.lgdCode,
                confidence: Math.max(0.5, parseFloat((0.95 - (ambiguityBuffer - primaryDistance) / 200).toFixed(2))),
                distanceToBoundaryMeters: Math.round(primaryDistance),
                isContestedOrAdjacent: false,
            });
            // Add adjacent competitors
            for (const comp of adjacentCompetitors) {
                candidateJurisdictions.push({
                    id: comp.fixture.id,
                    name: comp.fixture.name,
                    type: comp.fixture.type,
                    lgdCode: comp.fixture.lgdCode,
                    confidence: parseFloat((0.45 + Math.max(0, (ambiguityBuffer - comp.distance) / 250)).toFixed(2)),
                    distanceToBoundaryMeters: Math.round(comp.distance),
                    isContestedOrAdjacent: true,
                });
            }
        }
        else {
            candidateJurisdictions.push({
                id: mostGranular.id,
                name: mostGranular.name,
                type: mostGranular.type,
                lgdCode: mostGranular.lgdCode,
                confidence: 0.98,
                distanceToBoundaryMeters: Math.round(primaryDistance),
                isContestedOrAdjacent: false,
            });
        }
        return {
            matchedJurisdiction: {
                id: mostGranular.id,
                name: mostGranular.name,
                type: mostGranular.type,
                lgdCode: mostGranular.lgdCode,
                hierarchyPath,
            },
            resolverVersion: this.resolverVersion,
            resolverSource: this.resolverSource,
            confidence: isBoundaryAmbiguous ? (candidateJurisdictions[0]?.confidence ?? 0.5) : 0.98,
            isAmbiguous: isBoundaryAmbiguous,
            ambiguityReason,
            candidateJurisdictions,
            requiresManualConfirmation: isBoundaryAmbiguous,
            point: { latitude, longitude },
            resolvedAt: new Date().toISOString(),
        };
    }
    /**
     * Records a manual jurisdiction correction for an ambiguous or disputed point.
     * If an issueId is provided, updates the Issue record and adds an audit trail.
     */
    async recordManualCorrection(payload) {
        const { issueId, point, selectedJurisdictionId, reason, userId } = payload;
        if (!selectedJurisdictionId) {
            throw new Error('A selected jurisdiction ID is required for manual correction.');
        }
        // Verify selected jurisdiction exists in fixtures or DB
        const fixture = BOUNDARY_FIXTURES[selectedJurisdictionId];
        let jurisdictionName = fixture?.name;
        if (!jurisdictionName) {
            const dbJurisdiction = await prisma.jurisdiction.findUnique({
                where: { id: selectedJurisdictionId },
            });
            if (!dbJurisdiction) {
                throw new Error(`Jurisdiction not found: "${selectedJurisdictionId}".`);
            }
            jurisdictionName = dbJurisdiction.name;
        }
        // If an issueId is supplied, update the Issue record
        if (issueId) {
            const existingIssue = await prisma.issue.findUnique({
                where: { id: issueId },
            });
            if (!existingIssue) {
                throw new Error(`Issue not found: "${issueId}".`);
            }
            await prisma.$transaction(async (tx) => {
                await tx.issue.update({
                    where: { id: issueId },
                    data: {
                        jurisdictionId: selectedJurisdictionId,
                        manualJurisdictionConfirmed: true,
                        isBoundaryAmbiguous: false,
                        resolverVersion: this.resolverVersion,
                        resolverSource: this.resolverSource,
                        latitude: point.latitude,
                        longitude: point.longitude,
                    },
                });
                // Add audit history
                await tx.verificationHistory.create({
                    data: {
                        issueId,
                        previousStatus: existingIssue.verificationStatus,
                        newStatus: existingIssue.verificationStatus,
                        changedById: userId ?? 'SYSTEM_GEO_RESOLVER',
                        reason: `Manual jurisdiction override: ${jurisdictionName} (${selectedJurisdictionId}). Reason: ${reason ?? 'User confirmed boundary authority'}`,
                    },
                });
            });
        }
        const result = {
            success: true,
            jurisdictionId: selectedJurisdictionId,
            jurisdictionName,
            resolverVersion: this.resolverVersion,
            resolverSource: this.resolverSource,
            manualJurisdictionConfirmed: true,
            recordedAt: new Date().toISOString(),
        };
        if (issueId !== undefined) {
            result.issueId = issueId;
        }
        return result;
    }
    /**
     * Retrieves polygon boundary data for a given jurisdiction.
     */
    async getJurisdictionBoundary(jurisdictionId) {
        // 1. Check database for persisted boundary
        const dbBoundary = await prisma.jurisdictionBoundary.findUnique({
            where: { jurisdictionId },
        });
        if (dbBoundary) {
            return {
                id: dbBoundary.id,
                jurisdictionId: dbBoundary.jurisdictionId,
                boundaryType: dbBoundary.boundaryType,
                coordinates: JSON.parse(dbBoundary.coordinatesJson),
                bbox: {
                    minLat: dbBoundary.minLat,
                    maxLat: dbBoundary.maxLat,
                    minLng: dbBoundary.minLng,
                    maxLng: dbBoundary.maxLng,
                },
                bufferMeters: dbBoundary.bufferMeters,
                source: dbBoundary.source,
                version: dbBoundary.version,
            };
        }
        // 2. Fallback to boundary fixtures
        const fixture = BOUNDARY_FIXTURES[jurisdictionId];
        if (fixture) {
            return {
                id: fixture.id,
                jurisdictionId: fixture.id,
                boundaryType: 'Polygon',
                coordinates: fixture.coordinates,
                bbox: fixture.bbox,
                bufferMeters: DEFAULT_AMBIGUITY_BUFFER_METERS,
                source: this.resolverSource,
                version: this.resolverVersion,
            };
        }
        return null;
    }
    /**
     * Retrieves registered jurisdictions list with optional filtering.
     */
    async getJurisdictions(query) {
        const where = { deletedAt: null };
        if (query?.parentId)
            where.parentId = query.parentId;
        if (query?.type)
            where.type = query.type;
        const list = await prisma.jurisdiction.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        if (list.length > 0) {
            return list;
        }
        // Fixture fallback for testing / unseeded environment
        return Object.values(BOUNDARY_FIXTURES).map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            lgdCode: f.lgdCode,
            parentId: f.parentId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            version: 0,
        }));
    }
}
export const geographyService = new GeographyService();
