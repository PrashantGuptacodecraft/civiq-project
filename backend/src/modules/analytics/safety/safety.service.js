/**
 * Road-Safety Correlation Analytics Service
 * Phase 57: Add road-safety correlation analytics
 *
 * Correlates incident clusters with civic issue history, municipal asset defects,
 * and official accident data. Enforces strict non-causal framing and produces
 * "investigation recommended" safety hotspots for municipal engineers.
 */

import {
  SAFETY_CORRELATION_DISCLAIMER,
  INVESTIGATION_PRIORITY,
  CORRELATION_LEVELS,
  DEFAULT_CORRELATION_RADIUS_KM,
  DEFAULT_LOOKBACK_DAYS,
  INVESTIGATION_THRESHOLD_SCORE,
  INFRASTRUCTURE_FACTOR_WEIGHTS,
} from './safety.types.js';
import {
  SYNTHETIC_CIVIC_ISSUES_SAFETY,
  SYNTHETIC_OFFICIAL_ACCIDENT_DATA,
  SYNTHETIC_SAFETY_HOTSPOTS,
} from './safety.fixtures.js';
import { haversineDistanceKm } from '../hotspots/hotspot.service.js';
import { incidentService } from '../../incidents/incident.service.js';

export class SafetyCorrelationService {
  constructor(options = {}) {
    this.hotspots = new Map();
    this.civicIssues = options.civicIssues || [...SYNTHETIC_CIVIC_ISSUES_SAFETY];
    this.officialAccidents = options.officialAccidents || [...SYNTHETIC_OFFICIAL_ACCIDENT_DATA];
    this.init();
  }

  /**
   * Initializes store with synthetic baseline road-safety hotspots.
   */
  init() {
    this.hotspots.clear();
    for (const spot of SYNTHETIC_SAFETY_HOTSPOTS) {
      this.hotspots.set(spot.id, JSON.parse(JSON.stringify(spot)));
    }
  }

  /**
   * Resets service state for test isolation.
   */
  reset() {
    this.init();
  }

  /**
   * Determines correlation level label from numerical score [0..1].
   */
  getCorrelationLevel(score) {
    if (score >= 0.75) return CORRELATION_LEVELS.HIGH;
    if (score >= 0.50) return CORRELATION_LEVELS.MODERATE;
    if (score >= 0.25) return CORRELATION_LEVELS.LOW;
    return CORRELATION_LEVELS.NEGLIGIBLE;
  }

  /**
   * Determines investigation priority based on score, severity, and casualty metrics.
   */
  determineInvestigationPriority(score, metrics = {}) {
    if (score < INVESTIGATION_THRESHOLD_SCORE) {
      return INVESTIGATION_PRIORITY.NONE;
    }

    if (metrics.fatalitiesCount > 0 || metrics.injuredCount >= 3 || score >= 0.85) {
      return INVESTIGATION_PRIORITY.CRITICAL;
    }
    if (score >= 0.70 || metrics.severeCollisionsCount >= 1) {
      return INVESTIGATION_PRIORITY.HIGH;
    }
    if (score >= 0.60) {
      return INVESTIGATION_PRIORITY.MEDIUM;
    }
    return INVESTIGATION_PRIORITY.LOW;
  }

  /**
   * Generates actionable recommendations for municipal road safety engineers
   * without claiming definitive causality.
   */
  generateInvestigationRecommendations(corridorName, correlatedIssues = [], metrics = {}) {
    const focusAreas = [];

    const hasPotholes = correlatedIssues.some((i) => i.category?.includes('pothole') || i.category?.includes('surface'));
    const hasLighting = correlatedIssues.some((i) => i.category?.includes('lighting') || i.category?.includes('streetlight'));
    const hasDrainage = correlatedIssues.some((i) => i.category?.includes('drainage') || i.category?.includes('waterlogging'));
    const hasSignals = correlatedIssues.some((i) => i.category?.includes('signal'));
    const hasUtility = correlatedIssues.some((i) => i.category?.includes('wires') || i.category?.includes('utility'));

    if (hasPotholes) {
      focusAreas.push('Inspect carriageway wearing course, bridge expansion joint levels, and pothole patch durability.');
    }
    if (hasLighting) {
      focusAreas.push('Audit nighttime lux illumination levels against Indian Roads Congress (IRC) safety standards.');
    }
    if (hasDrainage) {
      focusAreas.push('Verify cross-fall drainage gradient and clear stormwater grates to prevent hydroplaning and water ponding.');
    }
    if (hasSignals) {
      focusAreas.push('Audit signal cycle timing, pedestrian countdown display synchronization, and sight-distance lines.');
    }
    if (hasUtility) {
      focusAreas.push('Coordinate utility corridor clearance and underground trenching inspection with power distribution authorities.');
    }

    if (focusAreas.length === 0) {
      focusAreas.push('Conduct comprehensive multi-disciplinary road safety audit (RSA) across corridor geometric layout.');
    }

    return {
      recommendedAction: `Schedule joint technical site inspection by Municipal Road Department and Traffic Police Safety Cell for ${corridorName}.`,
      suggestedRemediationFocus: focusAreas,
      estimatedUrgencyDays: metrics.fatalitiesCount > 0 ? 3 : metrics.injuredCount >= 2 ? 7 : 14,
    };
  }

  /**
   * Correlates an incident or cluster against surrounding civic issues and official data.
   */
  correlateLocation(lat, lon, options = {}) {
    const radiusKm = options.radiusKm || DEFAULT_CORRELATION_RADIUS_KM;
    const lookbackDays = options.lookbackDays || DEFAULT_LOOKBACK_DAYS;
    const referenceTime = options.referenceTime ? new Date(options.referenceTime) : new Date();

    // 1. Find co-located civic issues within radiusKm
    const nearbyIssues = [];
    for (const issue of this.civicIssues) {
      if (typeof issue.latitude !== 'number' || typeof issue.longitude !== 'number') continue;

      const distKm = haversineDistanceKm(lat, lon, issue.latitude, issue.longitude);
      if (distKm <= radiusKm) {
        // Temporal proximity check
        const reportedDate = new Date(issue.reportedAt || issue.createdAt || referenceTime);
        const diffDays = Math.abs((referenceTime.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= lookbackDays) {
          const distMeters = Math.round(distKm * 1000);
          const spatialWeight = Math.max(0, 1 - distKm / radiusKm);
          const temporalWeight = Math.max(0, 1 - diffDays / lookbackDays);

          let factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.GENERAL_DEFECT;
          const catUpper = (issue.category || '').toUpperCase();
          if (catUpper.includes('POTHOLE')) factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.ROADS_POTHOLE;
          else if (catUpper.includes('SURFACE')) factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.ROADS_SURFACE_DAMAGE;
          else if (catUpper.includes('LIGHTING') || catUpper.includes('STREETLIGHT')) factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.LIGHTING_STREETLIGHT_OUT;
          else if (catUpper.includes('DRAINAGE') || catUpper.includes('WATERLOGGING')) factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.DRAINAGE_WATERLOGGING;
          else if (catUpper.includes('SIGNAL')) factorMultiplier = INFRASTRUCTURE_FACTOR_WEIGHTS.TRAFFIC_SIGNAL_FAILURE;

          const matchScore = round(Math.min(1.0, (spatialWeight * 0.6 + temporalWeight * 0.4) * factorMultiplier), 3);

          nearbyIssues.push({
            issueId: issue.id,
            title: issue.title,
            category: issue.category,
            distanceMeters: distMeters,
            reportedAt: issue.reportedAt,
            status: issue.status,
            correlationScore: matchScore,
          });
        }
      }
    }

    // 2. Find nearby official accident records
    const nearbyOfficialAccidents = [];
    for (const acc of this.officialAccidents) {
      if (typeof acc.latitude !== 'number' || typeof acc.longitude !== 'number') continue;
      const distKm = haversineDistanceKm(lat, lon, acc.latitude, acc.longitude);
      if (distKm <= radiusKm) {
        nearbyOfficialAccidents.push({
          externalRecordId: acc.externalRecordId,
          sourceAgency: acc.sourceAgency,
          distanceMeters: Math.round(distKm * 1000),
          occurredAt: acc.occurredAt,
          severity: acc.severity,
          vehiclesInvolved: acc.vehiclesInvolved,
        });
      }
    }

    // 3. Compute Composite Correlation Score
    let compositeScore = 0.0;
    if (nearbyIssues.length > 0) {
      const avgIssueScore =
        nearbyIssues.reduce((sum, item) => sum + item.correlationScore, 0) / nearbyIssues.length;
      const countBonus = Math.min(0.20, (nearbyIssues.length - 1) * 0.08);
      const officialBonus = nearbyOfficialAccidents.length > 0 ? 0.15 : 0.0;
      compositeScore = round(Math.min(1.0, avgIssueScore + countBonus + officialBonus), 2);
    } else if (nearbyOfficialAccidents.length > 0) {
      compositeScore = 0.45;
    }

    const isInvestigationRecommended = compositeScore >= INVESTIGATION_THRESHOLD_SCORE && nearbyIssues.length > 0;
    const priority = this.determineInvestigationPriority(compositeScore, {
      injuredCount: nearbyOfficialAccidents.length > 0 ? 2 : 0,
    });

    return {
      coordinates: { latitude: lat, longitude: lon },
      radiusMeters: Math.round(radiusKm * 1000),
      compositeScore,
      correlationLevel: this.getCorrelationLevel(compositeScore),
      isInvestigationRecommended,
      investigationPriority: priority,
      disclaimer: SAFETY_CORRELATION_DISCLAIMER,
      correlatedIssuesCount: nearbyIssues.length,
      correlatedIssues: nearbyIssues,
      officialAccidentRecordsCount: nearbyOfficialAccidents.length,
      officialAccidentRecords: nearbyOfficialAccidents,
    };
  }

  /**
   * Retrieves all road-safety correlation hotspots matching query filters.
   */
  async listSafetyHotspots(query = {}) {
    const {
      jurisdictionId,
      corridorOrRoadName,
      investigationRecommendedOnly,
      minCorrelationScore,
      priority,
      limit = 50,
      offset = 0,
    } = query;

    let items = Array.from(this.hotspots.values());

    if (jurisdictionId) {
      items = items.filter(
        (h) => h.jurisdictionId && h.jurisdictionId.toLowerCase() === jurisdictionId.toLowerCase()
      );
    }

    if (corridorOrRoadName) {
      items = items.filter(
        (h) =>
          h.corridorOrRoadName &&
          h.corridorOrRoadName.toLowerCase().includes(corridorOrRoadName.toLowerCase())
      );
    }

    if (investigationRecommendedOnly !== undefined) {
      const isReq = investigationRecommendedOnly === true || investigationRecommendedOnly === 'true';
      items = items.filter((h) => h.isInvestigationRecommended === isReq);
    }

    if (minCorrelationScore !== undefined) {
      const minScore = parseFloat(minCorrelationScore);
      if (!isNaN(minScore)) {
        items = items.filter((h) => h.correlationScore >= minScore);
      }
    }

    if (priority) {
      items = items.filter((h) => h.investigationPriority === priority);
    }

    // Sort by correlation score descending
    items.sort((a, b) => b.correlationScore - a.correlationScore);

    const total = items.length;
    const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

    return {
      hotspots: paginated,
      total,
      count: paginated.length,
      offset: Number(offset),
      limit: Number(limit),
      disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    };
  }

  /**
   * Retrieves single safety hotspot by ID with detailed correlation breakdown.
   */
  async getSafetyHotspotById(id) {
    const hotspot = this.hotspots.get(id);
    if (!hotspot) {
      const err = new Error(`Road safety hotspot with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    return {
      ...JSON.parse(JSON.stringify(hotspot)),
      disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    };
  }

  /**
   * Returns aggregated road safety analytics summary.
   */
  async getSafetySummaryStats(query = {}) {
    const { jurisdictionId } = query;
    let items = Array.from(this.hotspots.values());

    if (jurisdictionId) {
      items = items.filter((h) => h.jurisdictionId === jurisdictionId);
    }

    const investigationRecommendedCount = items.filter((h) => h.isInvestigationRecommended).length;
    const criticalPriorityCount = items.filter(
      (h) => h.investigationPriority === INVESTIGATION_PRIORITY.CRITICAL
    ).length;
    const highPriorityCount = items.filter(
      (h) => h.investigationPriority === INVESTIGATION_PRIORITY.HIGH
    ).length;

    const corridors = {};
    for (const h of items) {
      if (h.corridorOrRoadName) {
        corridors[h.corridorOrRoadName] = (corridors[h.corridorOrRoadName] || 0) + 1;
      }
    }

    return {
      totalHotspots: items.length,
      investigationRecommendedCount,
      criticalPriorityCount,
      highPriorityCount,
      topCorridors: Object.entries(corridors).map(([corridor, count]) => ({ corridor, count })),
      disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    };
  }
}

function round(val, dec = 2) {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}

export const safetyCorrelationService = new SafetyCorrelationService();
