/**
 * Geospatial Candidate Suggestion Engine & Distance Calculations
 * Phase 50: Link Issues to Assets
 */

import { CATEGORY_ASSET_TYPE_AFFINITY } from './asset-link.types.js';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    return Infinity;
  }

  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Computes shortest distance from a GPS point to an asset, accounting for point
 * locations and GeoJSON LineString geometry segments (e.g. road corridors, pipelines).
 * @param {{ latitude: number, longitude: number }} point
 * @param {object} asset
 * @returns {number} Shortest distance in meters
 */
export function computeAssetDistance(point, asset) {
  if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
    return Infinity;
  }

  let minDistance = Infinity;

  // 1. Direct centroid / point coordinates
  if (typeof asset.latitude === 'number' && typeof asset.longitude === 'number') {
    minDistance = haversineDistanceMeters(
      point.latitude,
      point.longitude,
      asset.latitude,
      asset.longitude
    );
  }

  // 2. LineString geometry (e.g. road centerline or pipeline corridor)
  if (
    asset.geometryJson &&
    asset.geometryJson.type === 'LineString' &&
    Array.isArray(asset.geometryJson.coordinates)
  ) {
    for (const coord of asset.geometryJson.coordinates) {
      // GeoJSON standard: [longitude, latitude]
      const lon = coord[0];
      const lat = coord[1];
      const d = haversineDistanceMeters(point.latitude, point.longitude, lat, lon);
      if (d < minDistance) {
        minDistance = d;
      }
    }
  }

  return minDistance;
}

/**
 * Calculates candidate match confidence score and explainable reasons.
 * Combines physical proximity decay with civic category asset affinity and department alignment.
 *
 * @param {number} distanceMeters
 * @param {object} asset
 * @param {{ categoryId?: string, department?: string }} issueContext
 * @returns {{ confidence: number, matchReasons: string[] }}
 */
export function calculateCandidateConfidence(distanceMeters, asset, issueContext = {}) {
  const matchReasons = [];

  // 1. Base proximity score
  let baseScore = 0.40;
  if (distanceMeters <= 15) {
    baseScore = 0.90;
    matchReasons.push(`Immediate proximity: ~${Math.round(distanceMeters)}m from reported issue location`);
  } else if (distanceMeters <= 50) {
    baseScore = 0.80;
    matchReasons.push(`Close proximity: ~${Math.round(distanceMeters)}m from reported issue location`);
  } else if (distanceMeters <= 100) {
    baseScore = 0.70;
    matchReasons.push(`Nearby infrastructure: ~${Math.round(distanceMeters)}m from reported issue location`);
  } else if (distanceMeters <= 250) {
    baseScore = 0.55;
    matchReasons.push(`Within 250m vicinity (~${Math.round(distanceMeters)}m)`);
  } else if (distanceMeters <= 500) {
    baseScore = 0.40;
    matchReasons.push(`Within 500m radius (~${Math.round(distanceMeters)}m)`);
  } else {
    // Linear decay beyond 500m up to 2000m
    const excess = distanceMeters - 500;
    baseScore = Math.max(0.05, 0.40 * (1 - excess / 1500));
    matchReasons.push(`Extended distance: ~${Math.round(distanceMeters)}m`);
  }

  // 2. Category to Asset Type Affinity Bonus
  let affinityBonus = 0;
  const categoryId = issueContext.categoryId;
  if (categoryId && CATEGORY_ASSET_TYPE_AFFINITY[categoryId]) {
    const compatibleTypes = CATEGORY_ASSET_TYPE_AFFINITY[categoryId];
    if (compatibleTypes.includes(asset.assetType)) {
      affinityBonus = 0.15;
      matchReasons.push(
        `High category affinity: issue category '${categoryId}' corresponds to asset type '${asset.assetType}'`
      );
    }
  }

  // 3. Department Ownership Alignment Bonus
  let deptBonus = 0;
  if (
    issueContext.department &&
    asset.department &&
    issueContext.department.toLowerCase() === asset.department.toLowerCase()
  ) {
    deptBonus = 0.05;
    matchReasons.push(`Department alignment: asset is owned by '${asset.department}'`);
  }

  // 4. Asset Condition & Lifecycle status context
  if (asset.lifecycleStatus && asset.lifecycleStatus !== 'OPERATIONAL') {
    matchReasons.push(
      `Asset currently flagged as ${asset.lifecycleStatus} (condition score: ${asset.conditionScore})`
    );
  }

  // Combine and clamp between 0.05 and 0.99
  const totalConfidence = Math.min(0.99, Math.max(0.05, baseScore + affinityBonus + deptBonus));

  return {
    confidence: Number(totalConfidence.toFixed(2)),
    matchReasons,
  };
}

/**
 * Searches the asset registry for nearest maintainable asset candidates.
 *
 * @param {{ latitude: number, longitude: number, categoryId?: string, department?: string, jurisdictionId?: string }} target
 * @param {Array<object>} assets
 * @param {object} [options]
 * @param {number} [options.maxRadiusMeters=500]
 * @param {number} [options.limit=5]
 * @param {boolean} [options.filterByJurisdiction=false]
 * @returns {Array<object>} Ranked candidate suggestions
 */
export function findNearestAssetCandidates(target, assets, options = {}) {
  const { maxRadiusMeters = 500, limit = 5, filterByJurisdiction = false } = options;

  if (!target || typeof target.latitude !== 'number' || typeof target.longitude !== 'number') {
    return [];
  }

  const point = { latitude: target.latitude, longitude: target.longitude };
  const candidates = [];

  for (const asset of assets) {
    // Exclude decommissioned or deleted assets
    if (asset.deletedAt || asset.lifecycleStatus === 'DECOMMISSIONED') {
      continue;
    }

    if (filterByJurisdiction && target.jurisdictionId && asset.jurisdictionId !== target.jurisdictionId) {
      continue;
    }

    const distanceMeters = computeAssetDistance(point, asset);

    if (distanceMeters <= maxRadiusMeters) {
      const { confidence, matchReasons } = calculateCandidateConfidence(
        distanceMeters,
        asset,
        target
      );

      candidates.push({
        assetId: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        assetType: asset.assetType,
        department: asset.department,
        jurisdictionId: asset.jurisdictionId,
        ward: asset.ward,
        distanceMeters: Math.round(distanceMeters),
        confidence,
        matchReasons,
        lifecycleStatus: asset.lifecycleStatus,
        conditionScore: asset.conditionScore,
      });
    }
  }

  // Sort primarily by confidence DESC, then by distanceMeters ASC
  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.distanceMeters - b.distanceMeters;
  });

  // Limit and assign rank (1-indexed)
  return candidates.slice(0, limit).map((cand, idx) => ({
    rank: idx + 1,
    ...cand,
  }));
}
