/**
 * Spatial clustering utility for operational map markers.
 * Groups markers within spatial grid cells based on current zoom level.
 */

export function clusterMarkers(items, zoom = 1, options = {}) {
  if (!items || items.length === 0) return [];
  
  // Base grid size in degrees: at zoom 1 ~ 0.02 deg (~2km), at zoom 2 ~ 0.008 deg
  const baseGridSize = options.gridSize || 0.02;
  const gridSize = baseGridSize / Math.max(0.5, zoom);

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

  const result = [];
  let clusterId = 1;

  for (const [, cellItems] of grid.entries()) {
    if (cellItems.length === 1) {
      const item = cellItems[0];
      result.push({
        id: `point-${item.id}`,
        isCluster: false,
        issue: item,
        latitude: item.latitude,
        longitude: item.longitude,
        status: item.status,
        severity: item.severity,
        department: item.department,
        verificationStatus: item.verificationStatus,
      });
    } else {
      const count = cellItems.length;
      const avgLat = cellItems.reduce((acc, it) => acc + it.latitude, 0) / count;
      const avgLng = cellItems.reduce((acc, it) => acc + it.longitude, 0) / count;

      // Calculate dominant status
      const statusCounts = {};
      const severityCounts = {};
      for (const it of cellItems) {
        statusCounts[it.status] = (statusCounts[it.status] || 0) + 1;
        severityCounts[it.severity] = (severityCounts[it.severity] || 0) + 1;
      }

      const dominantStatus = Object.keys(statusCounts).reduce((a, b) =>
        statusCounts[a] >= statusCounts[b] ? a : b
      );

      // Critical priority takes precedence if any item is critical
      const dominantSeverity = severityCounts['CRITICAL']
        ? 'CRITICAL'
        : severityCounts['HIGH']
        ? 'HIGH'
        : Object.keys(severityCounts).reduce((a, b) =>
            severityCounts[a] >= severityCounts[b] ? a : b
          );

      result.push({
        id: `cluster-${clusterId++}`,
        isCluster: true,
        count,
        latitude: parseFloat(avgLat.toFixed(6)),
        longitude: parseFloat(avgLng.toFixed(6)),
        dominantStatus,
        dominantSeverity,
        issues: cellItems,
        issueIds: cellItems.map((it) => it.id),
      });
    }
  }

  return result;
}
