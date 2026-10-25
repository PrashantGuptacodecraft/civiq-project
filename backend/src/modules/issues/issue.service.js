import { prisma, IssueStatus, VerificationStatus } from '@civiq/db';
import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/contracts';
import { notificationService } from '../notifications/notification.service.js';
export function getTaxonomyCategory(categoryId) {
    for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
        for (const cat of group.categories) {
            if (cat.id === categoryId) {
                return cat;
            }
        }
    }
    return null;
}
export class IssueService {
    /**
     * Create an issue with description, category, jurisdiction, location, and source.
     * Requires an authenticated, active user.
     */
    async createIssue(params) {
        const { userId, data } = params;
        if (!userId) {
            throw new Error('Authentication required for public issue submission.');
        }
        // 1. Verify user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found.');
        }
        if (user.status !== 'ACTIVE') {
            throw new Error('User account is inactive or suspended.');
        }
        // 2. Validate description
        const description = data.description ? data.description.trim() : '';
        if (description.length < 10) {
            throw new Error('Description must be at least 10 characters long.');
        }
        // 3. Validate category against versioned civic taxonomy
        if (!data.categoryId) {
            throw new Error('Category is required.');
        }
        const taxonomyCat = getTaxonomyCategory(data.categoryId);
        if (!taxonomyCat) {
            throw new Error(`Invalid category: "${data.categoryId}". Category must be registered in civic taxonomy.`);
        }
        // 4. Validate jurisdiction
        if (!data.jurisdictionId) {
            throw new Error('Jurisdiction is required.');
        }
        const jurisdiction = await prisma.jurisdiction.findUnique({
            where: { id: data.jurisdictionId },
        });
        if (!jurisdiction) {
            throw new Error(`Jurisdiction not found: "${data.jurisdictionId}".`);
        }
        // 5. Validate GPS location coordinates if provided
        let latitude = null;
        let longitude = null;
        if (data.latitude !== undefined || data.longitude !== undefined) {
            if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                throw new Error('Both latitude and longitude must be numbers if location is provided.');
            }
            if (data.latitude < -90 || data.latitude > 90) {
                throw new Error('Latitude must be between -90 and 90 degrees.');
            }
            if (data.longitude < -180 || data.longitude > 180) {
                throw new Error('Longitude must be between -180 and 180 degrees.');
            }
            latitude = data.latitude;
            longitude = data.longitude;
        }
        // 6. Source and Severity
        const source = (data.source && data.source.trim()) ? data.source.trim() : 'CITIZEN_WEB';
        const severity = data.severity ?? taxonomyCat.severity;
        // 7. Title (either provided or derived from category + summary)
        const title = (data.title && data.title.trim())
            ? data.title.trim()
            : `${taxonomyCat.name} - ${description.slice(0, 40).trim()}...`;
        // 8. Execute in transaction: Create issue and initial verification history record
        const result = await prisma.$transaction(async (tx) => {
            const issue = await tx.issue.create({
                data: {
                    title,
                    description,
                    categoryId: taxonomyCat.id,
                    jurisdictionId: jurisdiction.id,
                    latitude,
                    longitude,
                    address: data.address?.trim() ?? null,
                    state: data.state?.trim() ?? null,
                    district: data.district?.trim() ?? null,
                    city: data.city?.trim() ?? null,
                    source,
                    severity,
                    resolverVersion: data.resolverVersion ?? null,
                    resolverSource: data.resolverSource ?? null,
                    isBoundaryAmbiguous: data.isBoundaryAmbiguous ?? false,
                    manualJurisdictionConfirmed: data.manualJurisdictionConfirmed ?? false,
                    status: IssueStatus.SUBMITTED,
                    verificationStatus: VerificationStatus.PENDING,
                    reportedById: user.id,
                },
            });
            // Immutable submission audit via verification history
            await tx.verificationHistory.create({
                data: {
                    issueId: issue.id,
                    previousStatus: VerificationStatus.PENDING,
                    newStatus: VerificationStatus.PENDING,
                    changedById: user.id,
                    reason: 'Initial public submission',
                },
            });
            return issue;
        });
        try {
            await notificationService.handleIssueStatusChange({
                eventId: `evt_${result.id}_${result.status}`,
                issueId: result.id,
                issueTitle: result.title,
                previousStatus: 'DRAFT',
                newStatus: result.status,
                changedById: user.id,
                recipientUserId: user.id,
                ...(user.email ? { recipientEmail: user.email } : {}),
                timestamp: new Date().toISOString(),
            });
        }
        catch {
            // Non-blocking notification dispatch
        }
        return result;
    }
    /**
     * Update issue status and dispatch lifecycle notification event.
     */
    async updateStatus(params) {
        const { issueId, newStatus, changedById, reason } = params;
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!issue) {
            throw new Error(`Issue not found: "${issueId}".`);
        }
        const previousStatus = issue.status;
        if (previousStatus === newStatus) {
            return issue;
        }
        const updated = await prisma.$transaction(async (tx) => {
            const updatedIssue = await tx.issue.update({
                where: { id: issueId },
                data: { status: newStatus },
                include: {
                    reportedBy: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            });
            await tx.verificationHistory.create({
                data: {
                    issueId,
                    previousStatus: issue.verificationStatus,
                    newStatus: issue.verificationStatus,
                    changedById,
                    reason: reason ?? `Status changed from ${previousStatus} to ${newStatus}`,
                },
            });
            return updatedIssue;
        });
        try {
            await notificationService.handleIssueStatusChange({
                eventId: `evt_${issueId}_${newStatus}`,
                issueId,
                issueTitle: updated.title,
                previousStatus,
                newStatus,
                changedById,
                recipientUserId: updated.reportedById,
                ...(updated.reportedBy?.email ? { recipientEmail: updated.reportedBy.email } : {}),
                timestamp: new Date().toISOString(),
            });
        }
        catch {
            // Non-blocking notification dispatch
        }
        return updated;
    }
    /**
     * Fetch an issue by ID with reporter and history metadata
     */
    async getIssueById(issueId) {
        return prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                    },
                },
                jurisdiction: true,
                verificationHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    /**
     * List issues with optional filters
     */
    async listIssues(filters) {
        const where = { deletedAt: null };
        if (filters?.userId)
            where.reportedById = filters.userId;
        if (filters?.jurisdictionId)
            where.jurisdictionId = filters.jurisdictionId;
        if (filters?.categoryId)
            where.categoryId = filters.categoryId;
        if (filters?.status)
            where.status = filters.status;
        return prisma.issue.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get operational map data with status/priority/department/verification filters,
     * clustering, pagination, and role-based privacy protection.
     */
    async getOperationalMap(params = {}) {
        const {
            status,
            severity,
            department,
            verificationStatus,
            jurisdictionId,
            bbox,
            cluster = true,
            clusterGridSize = 0.02,
            page = 1,
            limit = 50,
            user = null,
        } = params;

        // Determine if requesting principal is an authorized official
        const isAuthorizedOfficial = Boolean(
            user &&
            user.role &&
            user.role !== 'CITIZEN' &&
            user.status === 'ACTIVE'
        );

        const where = { deletedAt: null };

        // Require non-null coordinates for operational map
        where.latitude = { not: null };
        where.longitude = { not: null };

        if (status) {
            where.status = Array.isArray(status) ? { in: status } : status;
        }
        if (severity) {
            where.severity = Array.isArray(severity) ? { in: severity } : severity;
        }
        if (verificationStatus) {
            where.verificationStatus = Array.isArray(verificationStatus)
                ? { in: verificationStatus }
                : verificationStatus;
        }
        if (jurisdictionId) {
            where.jurisdictionId = jurisdictionId;
        }
        if (bbox && typeof bbox.minLat === 'number') {
            where.latitude = {
                gte: bbox.minLat,
                lte: bbox.maxLat,
            };
            where.longitude = {
                gte: bbox.minLng,
                lte: bbox.maxLng,
            };
        }

        // Fetch issues with evidence and reporter details
        const allMatchingIssues = await prisma.issue.findMany({
            where,
            include: {
                evidence: true,
                jurisdiction: true,
                reportedBy: {
                    select: {
                        id: true,
                        email: isAuthorizedOfficial,
                        phone: isAuthorizedOfficial,
                        role: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter by department if specified
        let filteredIssues = allMatchingIssues;
        if (department && department !== 'ALL') {
            filteredIssues = allMatchingIssues.filter((issue) => {
                const cat = getTaxonomyCategory(issue.categoryId);
                const deptName = cat?.defaultDepartment || 'General Administration';
                return deptName.toLowerCase().includes(department.toLowerCase());
            });
        }

        // Apply privacy enforcement
        const sanitizedIssues = filteredIssues.map((issue) => {
            const cat = getTaxonomyCategory(issue.categoryId);
            const resolvedDepartment = cat?.defaultDepartment || 'General Administration';

            if (isAuthorizedOfficial) {
                return {
                    ...issue,
                    department: resolvedDepartment,
                    isRedacted: false,
                };
            }

            // Public View: Redact exact evidence & PII
            return {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                status: issue.status,
                severity: issue.severity,
                verificationStatus: issue.verificationStatus,
                latitude: issue.latitude,
                longitude: issue.longitude,
                address: issue.address,
                categoryId: issue.categoryId,
                jurisdictionId: issue.jurisdictionId,
                department: resolvedDepartment,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                isRedacted: true,
                evidenceCount: issue.evidence?.length || 0,
                evidence: (issue.evidence || []).map((e) => ({
                    id: e.id,
                    mimeType: e.mimeType,
                    sizeBytes: e.sizeBytes,
                    isRedacted: true,
                })),
                reportedBy: {
                    id: issue.reportedBy?.id,
                    role: issue.reportedBy?.role || 'CITIZEN',
                },
            };
        });

        // Pagination
        const total = sanitizedIssues.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const startIndex = (currentPage - 1) * limit;
        const paginatedItems = sanitizedIssues.slice(startIndex, startIndex + limit);

        // Clustering calculation
        let clusters = [];
        if (cluster && sanitizedIssues.length > 0) {
            clusters = calculateClusters(sanitizedIssues, clusterGridSize);
        }

        return {
            items: paginatedItems,
            clusters,
            total,
            page: currentPage,
            limit,
            totalPages,
            isPublicView: !isAuthorizedOfficial,
            isAuthorizedOfficial,
        };
    }
}

/**
 * Grid-based spatial clustering algorithm for operational map points.
 */
export function calculateClusters(items, gridSize = 0.02) {
    const grid = new Map();

    for (const item of items) {
        if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
            continue;
        }
        const gridX = Math.floor(item.longitude / gridSize);
        const gridY = Math.floor(item.latitude / gridSize);
        const key = `${gridX}:${gridY}`;

        if (!grid.has(key)) {
            grid.set(key, []);
        }
        grid.get(key).push(item);
    }

    const clusters = [];
    let clusterIdx = 1;

    for (const [key, cellItems] of grid.entries()) {
        if (cellItems.length === 1) {
            const single = cellItems[0];
            clusters.push({
                id: `point-${single.id}`,
                isCluster: false,
                issueId: single.id,
                latitude: single.latitude,
                longitude: single.longitude,
                status: single.status,
                severity: single.severity,
                department: single.department,
                verificationStatus: single.verificationStatus,
                title: single.title,
            });
        } else {
            const count = cellItems.length;
            const avgLat = cellItems.reduce((sum, it) => sum + it.latitude, 0) / count;
            const avgLng = cellItems.reduce((sum, it) => sum + it.longitude, 0) / count;

            const statusCounts = {};
            const severityCounts = {};
            for (const it of cellItems) {
                statusCounts[it.status] = (statusCounts[it.status] || 0) + 1;
                severityCounts[it.severity] = (severityCounts[it.severity] || 0) + 1;
            }

            const dominantStatus = Object.keys(statusCounts).reduce((a, b) =>
                statusCounts[a] >= statusCounts[b] ? a : b
            );

            const dominantSeverity = severityCounts['CRITICAL']
                ? 'CRITICAL'
                : Object.keys(severityCounts).reduce((a, b) =>
                      severityCounts[a] >= severityCounts[b] ? a : b
                  );

            clusters.push({
                id: `cluster-${clusterIdx++}`,
                isCluster: true,
                count,
                latitude: parseFloat(avgLat.toFixed(6)),
                longitude: parseFloat(avgLng.toFixed(6)),
                dominantStatus,
                dominantSeverity,
                issueIds: cellItems.map((it) => it.id),
                issues: cellItems.map((it) => ({
                    id: it.id,
                    title: it.title,
                    status: it.status,
                    severity: it.severity,
                    department: it.department,
                    verificationStatus: it.verificationStatus,
                })),
            });
        }
    }

    return clusters;
}
export const issueService = new IssueService();
