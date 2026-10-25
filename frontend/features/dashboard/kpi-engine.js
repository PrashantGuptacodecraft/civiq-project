/**
 * Pure KPI Calculation & Aggregation Engine for Command Dashboard.
 */

export function computeDashboardKpis(issues = [], options = {}) {
  const { department = 'ALL', ward = 'ALL', timeRange = '30d' } = options;

  // Filter by time window
  const now = new Date();
  let timeThreshold = new Date();
  if (timeRange === '24h') {
    timeThreshold.setHours(now.getHours() - 24);
  } else if (timeRange === '7d') {
    timeThreshold.setDate(now.getDate() - 7);
  } else if (timeRange === '30d') {
    timeThreshold.setDate(now.getDate() - 30);
  } else {
    timeThreshold = new Date(0); // All time
  }

  // Filter issues
  const filtered = issues.filter((issue) => {
    // Time filter
    if (new Date(issue.createdAt) < timeThreshold) {
      return false;
    }
    // Department filter
    if (department !== 'ALL' && issue.department !== department) {
      return false;
    }
    // Ward / Jurisdiction filter
    if (ward !== 'ALL') {
      const matchJurisdiction = issue.jurisdictionId === ward;
      const matchWard = issue.wardId === ward || issue.address?.toLowerCase().includes(ward.toLowerCase());
      if (!matchJurisdiction && !matchWard) {
        return false;
      }
    }
    return true;
  });

  const total = filtered.length;

  // Enriched metrics per issue
  const nowMs = Date.now();
  const enriched = filtered.map((issue) => {
    const slaDays = issue.slaDays || 3;
    const slaMs = slaDays * 24 * 60 * 60 * 1000;
    const createdMs = new Date(issue.createdAt).getTime();
    const updatedMs = new Date(issue.updatedAt || issue.createdAt).getTime();

    const isOpen = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(issue.status);
    const isResolved = ['RESOLVED', 'CLOSED'].includes(issue.status);

    const elapsedMs = isResolved ? updatedMs - createdMs : nowMs - createdMs;
    const isSlaBreached = elapsedMs > slaMs;
    const resolutionHours = isResolved ? Math.max(0.5, (updatedMs - createdMs) / (1000 * 60 * 60)) : null;

    return {
      ...issue,
      isOpen,
      isResolved,
      isSlaBreached,
      resolutionHours,
    };
  });

  // 1. Open Issues
  const openCount = enriched.filter((i) => i.isOpen).length;
  const openRate = total > 0 ? Number(((openCount / total) * 100).toFixed(1)) : 0;

  // 2. Verified Issues
  const verifiedCount = enriched.filter((i) => i.verificationStatus === 'VERIFIED').length;
  const verificationRate = total > 0 ? Number(((verifiedCount / total) * 100).toFixed(1)) : 0;

  // 3. SLA Breached Issues
  const slaBreachedCount = enriched.filter((i) => i.isSlaBreached).length;
  const slaBreachedRate = total > 0 ? Number(((slaBreachedCount / total) * 100).toFixed(1)) : 0;
  const slaComplianceRate = total > 0 ? Number((100 - slaBreachedRate).toFixed(1)) : 100;

  // 4. Average Resolution Time (in hours)
  const resolvedList = enriched.filter((i) => i.resolutionHours !== null);
  const averageResolutionHours =
    resolvedList.length > 0
      ? Number((resolvedList.reduce((acc, i) => acc + i.resolutionHours, 0) / resolvedList.length).toFixed(1))
      : 0;

  // 5. Reopened Rate
  const reopenedCount = enriched.filter((i) => i.status === 'REOPENED').length;
  const totalResolutionEvents = resolvedList.length + reopenedCount;
  const reopenRate =
    totalResolutionEvents > 0
      ? Number(((reopenedCount / totalResolutionEvents) * 100).toFixed(1))
      : 0;

  // 6. Duplicate Rate
  const duplicateCount = enriched.filter((i) => i.verificationStatus === 'DUPLICATE').length;
  const duplicateRate = total > 0 ? Number(((duplicateCount / total) * 100).toFixed(1)) : 0;

  // Group by Department
  const deptMap = new Map();
  for (const item of enriched) {
    const dName = item.department || 'General Administration';
    if (!deptMap.has(dName)) {
      deptMap.set(dName, {
        departmentName: dName,
        total: 0,
        open: 0,
        verified: 0,
        slaBreached: 0,
        reopened: 0,
        duplicate: 0,
        resHoursTotal: 0,
        resolvedCount: 0,
      });
    }
    const d = deptMap.get(dName);
    d.total += 1;
    if (item.isOpen) d.open += 1;
    if (item.verificationStatus === 'VERIFIED') d.verified += 1;
    if (item.isSlaBreached) d.slaBreached += 1;
    if (item.status === 'REOPENED') d.reopened += 1;
    if (item.verificationStatus === 'DUPLICATE') d.duplicate += 1;
    if (item.resolutionHours !== null) {
      d.resHoursTotal += item.resolutionHours;
      d.resolvedCount += 1;
    }
  }

  const byDepartment = Array.from(deptMap.values()).map((d) => ({
    departmentName: d.departmentName,
    totalIssues: d.total,
    openCount: d.open,
    openRate: d.total > 0 ? Number(((d.open / d.total) * 100).toFixed(1)) : 0,
    verifiedCount: d.verified,
    verificationRate: d.total > 0 ? Number(((d.verified / d.total) * 100).toFixed(1)) : 0,
    slaBreachedCount: d.slaBreached,
    slaComplianceRate: d.total > 0 ? Number(((1 - d.slaBreached / d.total) * 100).toFixed(1)) : 100,
    averageResolutionHours: d.resolvedCount > 0 ? Number((d.resHoursTotal / d.resolvedCount).toFixed(1)) : 0,
    reopenedCount: d.reopened,
    reopenRate: (d.resolvedCount + d.reopened) > 0 ? Number(((d.reopened / (d.resolvedCount + d.reopened)) * 100).toFixed(1)) : 0,
    duplicateCount: d.duplicate,
    duplicateRate: d.total > 0 ? Number(((d.duplicate / d.total) * 100).toFixed(1)) : 0,
  }));

  // Group by Ward
  const wardMap = new Map();
  for (const item of enriched) {
    const wKey = item.wardId || item.jurisdictionId || 'unassigned';
    const wName = item.wardName || item.jurisdictionName || wKey;
    if (!wardMap.has(wKey)) {
      wardMap.set(wKey, {
        wardId: wKey,
        wardName: wName,
        totalIssues: 0,
        openCount: 0,
        slaBreachedCount: 0,
        criticalCount: 0,
      });
    }
    const w = wardMap.get(wKey);
    w.totalIssues += 1;
    if (item.isOpen) w.openCount += 1;
    if (item.isSlaBreached) w.slaBreachedCount += 1;
    if (item.severity === 'CRITICAL') w.criticalCount += 1;
  }

  const byWard = Array.from(wardMap.values()).map((w) => ({
    ...w,
    slaComplianceRate: w.totalIssues > 0 ? Number(((1 - w.slaBreachedCount / w.totalIssues) * 100).toFixed(1)) : 100,
  }));

  return {
    totalIssues: total,
    kpis: {
      open: {
        count: openCount,
        rate: openRate,
        label: 'Open Issues',
        sublabel: `${openRate}% of all registered issues`,
      },
      verified: {
        count: verifiedCount,
        rate: verificationRate,
        label: 'Verified Issues',
        sublabel: `${verificationRate}% verified by field / AI`,
      },
      slaBreached: {
        count: slaBreachedCount,
        complianceRate: slaComplianceRate,
        breachedRate: slaBreachedRate,
        label: 'SLA Breached',
        sublabel: `${slaComplianceRate}% on-time compliance`,
      },
      averageResolution: {
        hours: averageResolutionHours,
        days: Number((averageResolutionHours / 24).toFixed(1)),
        label: 'Avg Resolution Time',
        sublabel: `${averageResolutionHours} hours (${Number((averageResolutionHours / 24).toFixed(1))} days)`,
      },
      reopened: {
        count: reopenedCount,
        rate: reopenRate,
        label: 'Reopened Rate',
        sublabel: `${reopenRate}% citizen dissatisfaction reopens`,
      },
      duplicate: {
        count: duplicateCount,
        rate: duplicateRate,
        label: 'Duplicate Rate',
        sublabel: `${duplicateRate}% merged or redundant reports`,
      },
    },
    byDepartment,
    byWard,
    enrichedIssues: enriched,
  };
}

/**
 * Filter drill-down issues for a selected KPI metric.
 */
export function filterDrillDownIssues(enrichedIssues = [], metricKey) {
  if (!metricKey || metricKey === 'ALL') {
    return enrichedIssues;
  }

  switch (metricKey) {
    case 'open':
      return enrichedIssues.filter((i) => i.isOpen);
    case 'verified':
      return enrichedIssues.filter((i) => i.verificationStatus === 'VERIFIED');
    case 'sla_breached':
      return enrichedIssues.filter((i) => i.isSlaBreached);
    case 'avg_resolution':
      return enrichedIssues.filter((i) => i.isResolved);
    case 'reopened':
      return enrichedIssues.filter((i) => i.status === 'REOPENED');
    case 'duplicate':
      return enrichedIssues.filter((i) => i.verificationStatus === 'DUPLICATE');
    default:
      return enrichedIssues;
  }
}
