/**
 * Geospatial Polygon & Spatial Utilities for Disaster Boundaries
 * Phase 61: Build disaster event model
 */

import { BOUNDARY_GEOMETRY_TYPE } from './disaster.types.js';

/**
 * Validates a GeoJSON Polygon or MultiPolygon geometry object.
 * Format:
 * {
 *   type: 'Polygon',
 *   coordinates: [ [ [lng, lat], [lng, lat], ... [lng, lat] ] ]
 * }
 */
export function validatePolygonGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    throw new Error('Geometry must be an object.');
  }

  if (
    geometry.type !== BOUNDARY_GEOMETRY_TYPE.POLYGON &&
    geometry.type !== BOUNDARY_GEOMETRY_TYPE.MULTI_POLYGON
  ) {
    throw new Error(
      `Unsupported geometry type '${geometry.type}'. Must be 'Polygon' or 'MultiPolygon'.`
    );
  }

  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    throw new Error('Geometry coordinates must be a non-empty array.');
  }

  if (geometry.type === BOUNDARY_GEOMETRY_TYPE.POLYGON) {
    const linearRing = geometry.coordinates[0];
    if (!Array.isArray(linearRing) || linearRing.length < 4) {
      throw new Error(
        'Polygon outer ring must contain at least 4 coordinate pairs (closed linear ring).'
      );
    }

    // Verify first and last point are identical (closed ring)
    const first = linearRing[0];
    const last = linearRing[linearRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new Error('Polygon linear ring must be closed (first and last coordinates must match).');
    }

    for (const pt of linearRing) {
      if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
        throw new Error('Coordinate pairs must be [longitude, latitude] numeric tuples.');
      }
    }
  }

  return true;
}

/**
 * Computes bounding box [minLng, minLat, maxLng, maxLat] for a GeoJSON Polygon or MultiPolygon.
 */
export function computeBoundingBox(geometry) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function updateBounds(coords) {
    for (const pt of coords) {
      if (Array.isArray(pt[0])) {
        updateBounds(pt);
      } else {
        const [lng, lat] = pt;
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  updateBounds(geometry.coordinates);

  return {
    minLongitude: minLng,
    minLatitude: minLat,
    maxLongitude: maxLng,
    maxLatitude: maxLat,
  };
}

/**
 * Computes centroid [longitude, latitude] for a GeoJSON Polygon.
 */
export function computeCentroid(geometry) {
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  function collectPoints(coords) {
    for (const pt of coords) {
      if (Array.isArray(pt[0])) {
        collectPoints(pt);
      } else {
        sumLng += pt[0];
        sumLat += pt[1];
        count += 1;
      }
    }
  }

  collectPoints(geometry.coordinates);

  if (count === 0) return { longitude: 0, latitude: 0 };
  return {
    longitude: Number((sumLng / count).toFixed(6)),
    latitude: Number((sumLat / count).toFixed(6)),
  };
}

/**
 * Ray-casting algorithm to test whether a [latitude, longitude] point is inside a single Polygon ring.
 * point: { latitude, longitude }
 * ring: [ [lng, lat], [lng, lat], ... ]
 */
function pointInRing(point, ring) {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Evaluates whether a geographic point { latitude, longitude } falls inside a GeoJSON Polygon / MultiPolygon.
 */
export function isPointInPolygon(point, geometry) {
  if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
    return false;
  }

  if (!geometry || !geometry.coordinates) return false;

  if (geometry.type === BOUNDARY_GEOMETRY_TYPE.POLYGON) {
    const outerRing = geometry.coordinates[0];
    return pointInRing(point, outerRing);
  }

  if (geometry.type === BOUNDARY_GEOMETRY_TYPE.MULTI_POLYGON) {
    for (const polygon of geometry.coordinates) {
      const outerRing = polygon[0];
      if (pointInRing(point, outerRing)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if two bounding boxes overlap.
 */
export function doBoundingBoxesOverlap(boxA, boxB) {
  return !(
    boxA.maxLongitude < boxB.minLongitude ||
    boxA.minLongitude > boxB.maxLongitude ||
    boxA.maxLatitude < boxB.minLatitude ||
    boxA.minLatitude > boxB.maxLatitude
  );
}
