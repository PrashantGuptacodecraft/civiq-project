/**
 * Recurring Issue Intelligence Engine
 * Phase 47: Recurring Issue Analytics
 *
 * Links issues to municipal assets, detects repeated failure patterns across
 * asset/category/location/time, and generates actionable maintenance-review candidates.
 */

import { prisma } from '@civiq/db';
import {
  RECURRENCE_THRESHOLDS,
  MAINTENANCE_URGENCY,
  ASSET_TYPES,
  RECURRENCE_DISCLAIMER,
} from './recurrence.types.js';
import {
  SYNTHETIC_ASSET_REGISTRY,
  SYNTHETIC_RECURRING_ISSUES,
} from './recurrence.fixtures.js';
import { haversineDistanceKm } from '../hotspots/hotspot.service.js';

export class RecurrenceService {
  constructor(assetRegistry = SYNTHETIC_ASSET_REGISTRY) {
    this.assetRegistry = assetRegistry;
  }

  /**
   * Links issues to known physical assets in the registry via explicit assetId,
   * spatial proximity to registered assets, or inferred localized cluster keys.
   */
  linkIssuesToAssets(issues) {
    return issues.map((issue) => {
      // 1. Direct link if issue has assetId matching registry
      if (issue.assetId) {
        const found = this.assetRegistry.find((a) => a.assetId === issue.assetId);
        if (found) {
          return {
            ...issue,
            linkedAsset: found,
            assetId: found.assetId,
            assetName: found.name,
            assetType: found.assetType,
            assetDepartment: found.department,
            isInferredAsset: false,
          };
        }
      }

      // 2. Spatial proximity match against known assets in registry (< 50m)
      if (typeof issue.latitude === 'number' && typeof issue.longitude === 'number') {
        for (const asset of this.assetRegistry) {
          const distKm = haversineDistanceKm(
            issue.latitude,
            issue.longitude,
            asset.latitude,
            asset.longitude
          );
          if (distKm * 1000 <= RECURRENCE_THRESHOLDS.PROXIMITY_RADIUS_METERS_DEFAULT) {
            return {
              ...issue,
              linkedAsset: asset,
              assetId: asset.assetId,
              assetName: asset.name,
              assetType: asset.assetType,
              assetDepartment: asset.department,
              isInferredAsset: true,
              proximityMeters: Math.round(distKm * 1000),
            };
          }
        }

        // 3. Inferred asset for localized unlinked cluster (grouped by category and micro-location)
        const latKey = issue.latitude.toFixed(3);
        const lonKey = issue.longitude.toFixed(3);
        const catKey = (issue.categoryId || 'general').toUpperCase();
        const inferredId = `INF-${catKey}-${latKey}-${lonKey}`;

        return {
          ...issue,
          assetId: inferredId,
          assetName: `Localized ${catKey.replace(/_/g, ' ')} Infrastructure (${latKey}, ${lonKey})`,
          assetType: this.inferAssetType(issue.categoryId),
          assetDepartment: this.inferDepartment(issue.categoryId),
          isInferredAsset: true,
        };
      }

      return {
        ...issue,
        assetId: `UNLINKED-${issue.id}`,
        assetName: 'Unlinked Incident',
        assetType: ASSET_TYPES.GENERAL_ASSET,
        assetDepartment: 'General Operations',
        isInferredAsset: true,
      };
    });
  }

  inferAssetType(categoryId = '') {
    if (categoryId.includes('road') || categoryId.includes('pothole')) return ASSET_TYPES.ROAD_SEGMENT;
    if (categoryId.includes('electric') || categoryId.includes('streetlight')) return ASSET_TYPES.ELECTRICAL_INFRA;
    if (categoryId.includes('water')) return ASSET_TYPES.WATER_NETWORK;
    if (categoryId.includes('drain')) return ASSET_TYPES.DRAINAGE_CULVERT;
    if (categoryId.includes('sanitat') || categoryId.includes('garbage')) return ASSET_TYPES.SANITATION_FACILITY;
    return ASSET_TYPES.GENERAL_ASSET;
  }

  inferDepartment(categoryId = '') {
    if (categoryId.includes('road')) return 'Roads & Public Works';
    if (categoryId.includes('electric')) return 'Electrical & Power Supply';
    if (categoryId.includes('water')) return 'Water Supply & Sewage';
    if (categoryId.includes('drain')) return 'Stormwater Drainage';
    if (categoryId.includes('sanitat')) return 'Solid Waste Management';
    return 'Municipal Engineering';
  }

  /**
   * Generates actionable maintenance recommendations based on domain failure patterns.
   */
  generateRecommendation(assetType, failureCount, mtbfDays, recentSeverity) {
    if (assetType === ASSET_TYPES.ROAD_SEGMENT) {
      if (failureCount >= 3 && mtbfDays <= 25) {
        return 'Subsurface structural investigation recommended: Rapid consecutive pavement failures indicate sub-base moisture saturation or drainage cavity collapse rather than superficial wear.';
      }
      return 'Comprehensive milling and asphalt overlay recommended: Surface patching is failing to sustain traffic volume.';
    }

    if (assetType === ASSET_TYPES.ELECTRICAL_INFRA) {
      if (recentSeverity === 'CRITICAL' || failureCount >= 3) {
        return 'Transformer load audit and breaker overhaul required: Repeated outages under peak evening demand indicate phase unbalance or defective insulation.';
      }
      return 'Feeder line insulation inspection and component re-torque recommended.';
    }

    if (assetType === ASSET_TYPES.WATER_NETWORK) {
      if (failureCount >= 3) {
        return 'Pipe segment replacement required: Recurrent joint blowouts indicate pipe fatigue or hydraulic surge hammering requiring pressure reduction valve inspection.';
      }
      return 'Gasket replacement and joint clamp recalibration recommended.';
    }

    if (assetType === ASSET_TYPES.DRAINAGE_CULVERT) {
      return 'Internal CCTV robotic culvert survey recommended: Recurrent overflows point to downstream conduit collapse or internal sediment calcification.';
    }

    return 'On-site technical evaluation recommended to determine root cause and prevent ongoing recurrence.';
  }

  /**
   * Detects repeated failures by asset, category, location, and time.
   * Generates scored maintenance-review candidates.
   */
  async getMaintenanceReviewCandidates(options = {}) {
    const {
      minFailures = RECURRENCE_THRESHOLDS.MIN_FAILURES_DEFAULT,
      observationWindowDays = RECURRENCE_THRESHOLDS.OBSERVATION_WINDOW_DAYS_DEFAULT,
      assetType,
      department,
      urgency,
      referenceDate = new Date(),
    } = options;

    let rawIssues = [];

    // Try fetching from database if available
    try {
      const windowMs = observationWindowDays * 24 * 60 * 60 * 1000;
      const since = new Date(new Date(referenceDate).getTime() - windowMs);

      rawIssues = await prisma.issue.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: since },
        },
        include: { jurisdiction: true },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      // Fallback to synthetic recurring issues
    }

    if (!rawIssues || rawIssues.length === 0) {
      const windowMs = observationWindowDays * 24 * 60 * 60 * 1000;
      const refTime = new Date(referenceDate).getTime();
      rawIssues = SYNTHETIC_RECURRING_ISSUES.filter(
        (it) => refTime - new Date(it.createdAt).getTime() <= windowMs
      );
    }

    // 1. Link issues to physical or inferred assets
    const linkedIssues = this.linkIssuesToAssets(rawIssues);

    // 2. Group by assetId
    const assetGroups = new Map();
    for (const issue of linkedIssues) {
      const key = issue.assetId;
      if (!assetGroups.has(key)) {
        assetGroups.set(key, []);
      }
      assetGroups.get(key).push(issue);
    }

    // 3. Analyze recurrence for each asset group
    const candidates = [];

    for (const [assetId, groupIssues] of assetGroups.entries()) {
      // Filter out isolated single occurrences
      if (groupIssues.length < minFailures) continue;

      // Sort timeline chronologically
      groupIssues.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const firstFailure = groupIssues[0];
      const lastFailure = groupIssues[groupIssues.length - 1];
      const count = groupIssues.length;

      const firstTime = new Date(firstFailure.createdAt).getTime();
      const lastTime = new Date(lastFailure.createdAt).getTime();
      const spanDays = Math.max(1, Math.round((lastTime - firstTime) / (24 * 60 * 60 * 1000)));

      // Compute intervals between consecutive failures
      const intervalsDays = [];
      for (let i = 1; i < count; i++) {
        const diff = Math.max(
          1,
          Math.round(
            (new Date(groupIssues[i].createdAt).getTime() - new Date(groupIssues[i - 1].createdAt).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        );
        intervalsDays.push(diff);
      }

      const avgMtbfDays =
        intervalsDays.length > 0
          ? Number((intervalsDays.reduce((a, b) => a + b, 0) / intervalsDays.length).toFixed(1))
          : spanDays;

      // Dominant category & severity counts
      const severityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      let severityScoreTotal = 0;
      let hasCritical = false;

      for (const it of groupIssues) {
        const sev = (it.severity || 'MEDIUM').toUpperCase();
        severityScoreTotal += severityWeights[sev] || 2;
        if (sev === 'CRITICAL') hasCritical = true;
      }

      const avgSeverity = severityScoreTotal / count;
      const dominantCategory = firstFailure.categoryId || 'general';
      const aType = firstFailure.assetType || ASSET_TYPES.GENERAL_ASSET;
      const aDept = firstFailure.assetDepartment || 'Municipal Operations';
      const aName = firstFailure.assetName || assetId;

      // Score recurrence urgency (0 to 100)
      // High count + low MTBF + high severity = highest score
      const frequencyComponent = Math.min(40, count * 10);
      const mtbfComponent = Math.max(0, 30 - avgMtbfDays);
      const severityComponent = Math.min(30, avgSeverity * 7.5);
      const recurrenceScore = Math.min(100, Math.round(frequencyComponent + mtbfComponent + severityComponent));

      // Determine Urgency Level
      let urgencyLevel = MAINTENANCE_URGENCY.MONITORING;
      if (recurrenceScore >= 70 || (count >= 3 && hasCritical)) {
        urgencyLevel = MAINTENANCE_URGENCY.URGENT_MAINTENANCE;
      } else if (recurrenceScore >= 45) {
        urgencyLevel = MAINTENANCE_URGENCY.SCHEDULED_REVIEW;
      }

      // Generate Domain Action Recommendation
      const recommendation = this.generateRecommendation(
        aType,
        count,
        avgMtbfDays,
        lastFailure.severity
      );

      // Construct timeline items
      const failureTimeline = groupIssues.map((it) => ({
        issueId: it.id,
        title: it.title,
        severity: it.severity,
        status: it.status,
        createdAt: it.createdAt,
        address: it.address || '',
      }));

      // Candidate profile
      const candidate = {
        candidateId: `rev-${assetId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        assetId,
        assetName: aName,
        assetType: aType,
        department: aDept,
        ward: firstFailure.ward || (firstFailure.jurisdiction && firstFailure.jurisdiction.name) || 'City Central',
        failureCount: count,
        timeSpanDays: spanDays,
        meanTimeBetweenFailuresDays: avgMtbfDays,
        recurrenceScore,
        urgency: urgencyLevel,
        dominantCategory,
        recommendation,
        failureTimeline,
        coordinates: {
          latitude: lastFailure.latitude,
          longitude: lastFailure.longitude,
        },
        isAnalyticalObservation: true,
        causalityProof: false,
        disclaimer: RECURRENCE_DISCLAIMER,
      };

      candidates.push(candidate);
    }

    // Sort by recurrence score descending
    candidates.sort((a, b) => b.recurrenceScore - a.recurrenceScore);

    // Apply optional query filters
    let filtered = candidates;
    if (assetType && assetType !== 'ALL') {
      filtered = filtered.filter((c) => c.assetType === assetType);
    }
    if (department && department !== 'ALL') {
      filtered = filtered.filter((c) => c.department === department);
    }
    if (urgency && urgency !== 'ALL') {
      filtered = filtered.filter((c) => c.urgency === urgency);
    }

    const summary = {
      totalCandidates: filtered.length,
      urgentMaintenanceCount: filtered.filter((c) => c.urgency === MAINTENANCE_URGENCY.URGENT_MAINTENANCE).length,
      scheduledReviewCount: filtered.filter((c) => c.urgency === MAINTENANCE_URGENCY.SCHEDULED_REVIEW).length,
      monitoringCount: filtered.filter((c) => c.urgency === MAINTENANCE_URGENCY.MONITORING).length,
      totalLinkedFailures: filtered.reduce((acc, c) => acc + c.failureCount, 0),
      parameters: {
        minFailures: Number(minFailures),
        observationWindowDays: Number(observationWindowDays),
      },
    };

    return {
      success: true,
      count: filtered.length,
      candidates: filtered,
      summary,
      disclaimer: RECURRENCE_DISCLAIMER,
      isAnalyticalObservation: true,
      causalityProof: false,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves full recurrence timeline and asset profile for a specific asset ID.
   */
  async getAssetRecurrence(assetId, options = {}) {
    const { candidates } = await this.getMaintenanceReviewCandidates(options);
    const found = candidates.find((c) => c.assetId === assetId || c.candidateId === assetId);
    if (!found) return null;
    return found;
  }
}

export const recurrenceService = new RecurrenceService();
