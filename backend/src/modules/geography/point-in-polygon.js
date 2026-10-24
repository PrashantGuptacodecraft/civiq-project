import { BoundingBox, CoordinatePair, PolygonCoordinates } from '@civiq/shared-contracts';

/**
 * Checks if a point [longitude, latitude] falls within a bounding box.
 */
export function isPointInBoundingBox(point: [number, number], bbox) {
  const [lng, lat] = point;
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

/**
 * Ray-casting algorithm to test whether a point [longitude, latitude]
 * lies inside a polygon (with optional holes).
 * Coordinates are [longitude, latitude].
 */
export function isPointInPolygon(point: [number, number], coordinates) {
  if (!coordinates || coordinates.length === 0) return false;

  const [x, y] = point; // x = lng, y = lat

  // Check outer ring (must be inside)
  const outerRing = coordinates[0];
  if (!outerRing || !isPointInRing(x, y, outerRing)) {
    return false;
  }

  // Check interior holes (must NOT be inside any hole)
  for (let i = 1; i < coordinates.length; i++) {
    const hole = coordinates[i];
    if (hole && isPointInRing(x, y, hole)) {
      return false; // Point is inside a hole
    }
  }

  return true;
}

function isPointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ptI = ring[i];
    const ptJ = ring[j];
    if (!ptI || !ptJ) continue;

    const xi = ptI[0];
    const yi = ptI[1];
    const xj = ptJ[0];
    const yj = ptJ[1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates minimum distance in meters from a point [lng, lat]
 * to any segment of a polygon's boundary rings.
 */
export function distanceToPolygonBoundaryMeters(
  point: [number, number],
  coordinates
) {
  if (!coordinates || coordinates.length === 0) return Infinity;

  let minDistance = Infinity;

  for (const ring of coordinates) {
    if (!ring) continue;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p1 = ring[i];
      const p2 = ring[j];
      if (!p1 || !p2) continue;
      const dist = distanceToSegmentMeters(point, p1, p2);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }
  }

  return minDistance;
}

/**
 * Calculates distance from point P to line segment AB in meters.
 */
function distanceToSegmentMeters(
  p: [number, number],
  a: [number, number],
  b: [number, number]
) {
  const [px, py] = p; // lng, lat
  const [ax, ay] = a;
  const [bx, by] = b;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return haversineDistanceMeters(p, a);
  }

  // Project point onto segment, clamp t between 0 and 1
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const closestPoint: [number, number] = [ax + t * dx, ay + t * dy];

  return haversineDistanceMeters(p, closestPoint);
}