import { prisma } from '@civiq/db';
import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/contracts';

export const DATA_SOURCE_LABEL = 'OFFICIAL_LGD_PMC_PCMC_REPLICA';
export const PIPELINE_VERSION = 'civiq-analytics-v1.0.0';

/**
 * Resolves category taxonomy metadata (department and SLA in days).
 */
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

export class DashboardService {
  /**
   * Aggregate authority command dashboard KPIs, department/ward breakdowns,
   * data freshness, and source labeling.
   */
  async getCommandKpis(filters = {}) {
    const { department, jurisdictionId, timeRange = '30d' } = filters;

    const where = { deletedAt: null };

    if (jurisdictionId && jurisdictionId !== 'ALL') {
      where.jurisdictionId = jurisdictionId;
    }

    // Time window filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let since = new Date();
      if (timeRange === '24h') {
        since.setHours(now.getHours() - 24);
      } else if (timeRange === '7d') {
        since.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        since.setDate(now.getDate() - 30);
      }
      where.createdAt = { gte: since };
    }

    // Fetch issues with verification history and jurisdiction details
    const issues = await prisma.issue.findMany({
      where,
      include: {
        jurisdiction: true,
        verificationHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map each issue to its department and calculate SLA status
    const nowMs = Date.now();
    const enrichedIssues = issues.map((issue) => {
      const taxonomyCat = getTaxonomyCategory(issue.categoryId);
      const departmentName = taxonomyCat?.defaultDepartment || 'General Administration';
      const slaDays = taxonomyCat?.slaDays || 3;
      const slaMs = slaDays * 24 * 60 * 60 * 1000;
      const createdMs = new Date(issue.createdAt).getTime();
      const updatedMs = new Date(issue.updatedAt).getTime();

      const isOpen = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(issue.status);
      const isResolved = ['RESOLVED', 'CLOSED'].includes(issue.status);

      // SLA Breached: If open and now > created + SLA, OR if resolved and resolved time > created + SLA
      const elapsedMs = isResolved ? updatedMs - createdMs : nowMs - createdMs;
      const isSlaBreached = elapsedMs > slaMs;

      // Resolution time in hours
      const resolutionHours = isResolved ? Math.max(0.5, (updatedMs - createdMs) / (1000 * 60 * 60)) : null;

      const isReopened = issue.status === 'REOPENED';
      const isDuplicate = issue.verificationStatus === 'DUPLICATE';
      const isVerified = issue.verificationStatus === 'VERIFIED';

      return {
        ...issue,
        departmentName,
        isOpen,
        isResolved,
        isSlaBreached,
        resolutionHours,
        isReopened,
        isDuplicate,
        isVerified,
      };
    });

    // Apply department filter if specified
    const filteredIssues = department && department !== 'ALL'
      ? enrichedIssues.filter((i) => i.departmentName.toLowerCase().includes(department.toLowerCase()))
      : enrichedIssues;

    const totalIssues = filteredIssues.length;

    // 1. Open Issues KPI
    const openCount = filteredIssues.filter((i) => i.isOpen).length;
    const openRate = totalIssues > 0 ? Number(((openCount / totalIssues) * 100).toFixed(1)) : 0;

    // 2. Verified Issues KPI
    const verifiedCount = filteredIssues.filter((i) => i.isVerified).length;
    const verificationRate = totalIssues > 0 ? Number(((verifiedCount / totalIssues) * 100).toFixed(1)) : 0;

    // 3. SLA Breached KPI
    const slaBreachedCount = filteredIssues.filter((i) => i.isSlaBreached).length;
    const slaBreachedRate = totalIssues > 0 ? Number(((slaBreachedCount / totalIssues) * 100).toFixed(1)) : 0;
    const slaComplianceRate = totalIssues > 0 ? Number((100 - slaBreachedRate).toFixed(1)) : 100;

    // 4. Average Resolution Time (in hours)
    const resolvedIssues = filteredIssues.filter((i) => i.resolutionHours !== null);
    const averageResolutionHours = resolvedIssues.length > 0
      ? Number((resolvedIssues.reduce((sum, i) => sum + i.resolutionHours, 0) / resolvedIssues.length).toFixed(1))
      : 0;

    // 5. Reopened Rate KPI
    const reopenedCount = filteredIssues.filter((i) => i.isReopened).length;
    const resolutionCandidates = resolvedIssues.length + reopenedCount;
    const reopenRate = resolutionCandidates > 0
      ? Number(((reopenedCount / resolutionCandidates) * 100).toFixed(1))
      : 0;

    // 6. Duplicate Rate KPI
    const duplicateCount = filteredIssues.filter((i) => i.isDuplicate).length;
    const duplicateRate = totalIssues > 0
      ? Number(((duplicateCount / totalIssues) * 100).toFixed(1))
      : 0;

    // Department Breakdown
    const deptMap = new Map();
    for (const item of filteredIssues) {
      const dName = item.departmentName;
      if (!deptMap.has(dName)) {
        deptMap.set(dName, {
          departmentName: dName,
          total: 0,
          open: 0,
          verified: 0,
          slaBreached: 0,
          reopened: 0,
          duplicate: 0,
          resolutionHoursTotal: 0,
          resolvedCount: 0,
        });
      }
      const entry = deptMap.get(dName);
      entry.total += 1;
      if (item.isOpen) entry.open += 1;
      if (item.isVerified) entry.verified += 1;
      if (item.isSlaBreached) entry.slaBreached += 1;
      if (item.isReopened) entry.reopened += 1;
      if (item.isDuplicate) entry.duplicate += 1;
      if (item.resolutionHours !== null) {
        entry.resolutionHoursTotal += item.resolutionHours;
        entry.resolvedCount += 1;
      }
    }

    const byDepartment = Array.from(deptMap.values()).map((dept) => ({
      departmentName: dept.departmentName,
      totalIssues: dept.total,
      openCount: dept.open,
      verifiedCount: dept.verified,
      verificationRate: dept.total > 0 ? Number(((dept.verified / dept.total) * 100).toFixed(1)) : 0,
      slaBreachedCount: dept.slaBreached,
      slaComplianceRate: dept.total > 0 ? Number(((1 - dept.slaBreached / dept.total) * 100).toFixed(1)) : 100,
      averageResolutionHours: dept.resolvedCount > 0 ? Number((dept.resolutionHoursTotal / dept.resolvedCount).toFixed(1)) : 0,
      reopenedCount: dept.reopened,
      reopenRate: (dept.resolvedCount + dept.reopened) > 0 ? Number(((dept.reopened / (dept.resolvedCount + dept.reopened)) * 100).toFixed(1)) : 0,
      duplicateCount: dept.duplicate,
      duplicateRate: dept.total > 0 ? Number(((dept.duplicate / dept.total) * 100).toFixed(1)) : 0,
    }));

    // Ward / Jurisdiction Breakdown
    const wardMap = new Map();
    for (const item of filteredIssues) {
      const wId = item.jurisdictionId || 'unassigned';
      const wName = item.jurisdiction?.name || (wId === 'mh-pune-pmc' ? 'PMC Pune' : wId === 'mh-pune-pcmc' ? 'PCMC Pimpri' : wId);
      if (!wardMap.has(wId)) {
        wardMap.set(wId, {
          jurisdictionId: wId,
          wardName: wName,
          totalIssues: 0,
          openCount: 0,
          slaBreachedCount: 0,
          criticalCount: 0,
        });
      }
      const entry = wardMap.get(wId);
      entry.totalIssues += 1;
      if (item.isOpen) entry.openCount += 1;
      if (item.isSlaBreached) entry.slaBreachedCount += 1;
      if (item.severity === 'CRITICAL') entry.criticalCount += 1;
    }

    const byWard = Array.from(wardMap.values());

    return {
      kpis: {
        totalIssues,
        openCount,
        openRate,
        verifiedCount,
        verificationRate,
        slaBreachedCount,
        slaBreachedRate,
        slaComplianceRate,
        averageResolutionHours,
        reopenedCount,
        reopenRate,
        duplicateCount,
        duplicateRate,
      },
      byDepartment,
      byWard,
      drillDownIssues: filteredIssues.slice(0, 50).map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        department: i.departmentName,
        jurisdiction: i.jurisdiction?.name || i.jurisdictionId,
        verificationStatus: i.verificationStatus,
        isSlaBreached: i.isSlaBreached,
        createdAt: i.createdAt,
      })),
      metadata: {
        dataFreshness: new Date().toISOString(),
        sourceLabel: DATA_SOURCE_LABEL,
        pipelineVersion: PIPELINE_VERSION,
        timeRange,
        activeFilters: {
          department: department || 'ALL',
          jurisdictionId: jurisdictionId || 'ALL',
        },
      },
    };
  }
}

export const dashboardService = new DashboardService();
