/**
 * Phase 46 Exit Checks: Hotspot Analytics Correctness Tests
 * Validates spatial clustering, temporal trends, category distribution,
 * synthetic fixtures, and mandatory non-causal analytical labeling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  haversineDistanceKm,
  clusterIncidents,
  buildHotspotProfile,
  hotspotService,
} from './hotspots/hotspot.service.js';
import { hotspotRouter } from './hotspots/hotspot.router.js';
import {
  DEFAULT_WINDOW_SIZE_KM,
  DEFAULT_MIN_INCIDENTS,
  ANALYTICAL_DISCLAIMER,
  HOTSPOT_INTENSITY_LEVELS,
  TREND_DIRECTIONS,
} from './hotspots/hotspot.types.js';
import { SYNTHETIC_HOTSPOT_ISSUES } from './hotspots/hotspot.fixtures.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
  },
}));

describe('Phase 46: Hotspot Analytics & Spatial Windowing Tests', () => {
  const referenceDate = new Date('2026-10-25T12:00:00Z');

  describe('1. Spatial Haversine Distance Calculation', () => {
    it('accurately computes distance between known coordinates', () => {
      // Distance between FC Road (18.5204, 73.8567) and Deccan Gymkhana (18.5208, 73.8561) ~ 78 meters
      const distKm = haversineDistanceKm(18.5204, 73.8567, 18.5208, 73.8561);
      expect(distKm).toBeGreaterThan(0.05);
      expect(distKm).toBeLessThan(0.12);
    });

    it('returns zero for identical coordinates', () => {
      const distKm = haversineDistanceKm(18.5204, 73.8567, 18.5204, 73.8567);
      expect(distKm).toBe(0);
    });
  });

  describe('2. Spatial Window Clustering Algorithm', () => {
    it('groups tightly located synthetic points into clusters and filters out isolated points', () => {
      const clusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, DEFAULT_MIN_INCIDENTS);

      // Should identify 3 distinct clusters (Shivaji Nagar, Kothrud, Chinchwad)
      expect(clusters.length).toBe(3);

      // Cluster 1 (Shivaji Nagar) should contain 6 issues
      const shivajiCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-001'));
      expect(shivajiCluster).toBeDefined();
      expect(shivajiCluster.length).toBe(6);

      // Cluster 2 (Kothrud) should contain 4 issues
      const kothrudCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-007'));
      expect(kothrudCluster).toBeDefined();
      expect(kothrudCluster.length).toBe(4);

      // Cluster 3 (Chinchwad) should contain 3 issues
      const chinchwadCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-011'));
      expect(chinchwadCluster).toBeDefined();
      expect(chinchwadCluster.length).toBe(3);

      // Isolated issues (iss-hs-014, iss-hs-015 in Hadapsar) must be filtered out
      const allClusteredIds = clusters.flat().map((it) => it.id);
      expect(allClusteredIds).not.toContain('iss-hs-014');
      expect(allClusteredIds).not.toContain('iss-hs-015');
    });

    it('respects configurable windowSizeKm', () => {
      // A tiny window size of 50 meters (0.05 km) should break clusters apart below minIncidents
      const tinyClusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, 0.05, 3);
      expect(tinyClusters.length).toBe(0);
    });

    it('respects configurable minIncidents threshold', () => {
      // With minIncidents = 5, only Shivaji Nagar cluster (6 items) qualifies
      const largeClusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, 5);
      expect(largeClusters.length).toBe(1);
      expect(largeClusters[0].length).toBe(6);
    });
  });

  describe('3. Hotspot Profile, Category Distribution & Severity Metrics', () => {
    it('correctly calculates centroid, radius, dominant category and severity', () => {
      const clusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, DEFAULT_MIN_INCIDENTS);
      const shivajiCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-001'));

      const profile = buildHotspotProfile(shivajiCluster, 0, {
        timeWindowDays: 30,
        referenceDate,
      });

      expect(profile.id).toBe('hotspot-1');
      expect(profile.incidentCount).toBe(6);
      expect(profile.primaryWard).toContain('Shivaji Nagar');

      // Centroid should be around 18.520x, 73.856x
      expect(profile.centroid.latitude).toBeCloseTo(18.5207, 2);
      expect(profile.centroid.longitude).toBeCloseTo(73.8568, 2);

      // Radius should be realistic (within 500m)
      expect(profile.radiusMeters).toBeGreaterThan(50);
      expect(profile.radiusMeters).toBeLessThan(500);

      // Dominant category should be roads_pothole (4 out of 6)
      expect(profile.dominantCategory).toBe('roads_pothole');
      const roadCat = profile.categoryBreakdown.find((cb) => cb.categoryId === 'roads_pothole');
      expect(roadCat).toBeDefined();
      expect(roadCat.count).toBe(4);
      expect(roadCat.percentage).toBeCloseTo(66.7, 1);

      // Dominant severity should be HIGH
      expect(profile.dominantSeverity).toBe('HIGH');
      expect(profile.severityBreakdown.HIGH).toBe(3);
      expect(profile.severityBreakdown.CRITICAL).toBe(1);

      // Intensity score should be HIGH or CRITICAL
      expect(profile.intensityScore).toBeGreaterThanOrEqual(60);
    });
  });

  describe('4. Temporal Trend Dynamics by Category & Time', () => {
    it('accurately detects INCREASING trend for Shivaji Nagar cluster', () => {
      const clusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, DEFAULT_MIN_INCIDENTS);
      const shivajiCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-001'));

      const profile = buildHotspotProfile(shivajiCluster, 0, {
        timeWindowDays: 7, // 7-day observation window
        referenceDate,
      });

      // 5 issues in last 7 days vs 0 in prior 7 days -> INCREASING
      expect(profile.trend.direction).toBe(TREND_DIRECTIONS.INCREASING);
      expect(profile.trend.percentageChange).toBeGreaterThan(0);
      expect(profile.trend.currentWindowCount).toBe(5);
    });

    it('accurately detects DECREASING trend for Kothrud cluster', () => {
      const clusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, DEFAULT_MIN_INCIDENTS);
      const kothrudCluster = clusters.find((c) => c.some((it) => it.id === 'iss-hs-007'));

      const profile = buildHotspotProfile(kothrudCluster, 1, {
        timeWindowDays: 14, // 14-day observation window
        referenceDate,
      });

      // 1 recent vs 3 prior in 14-28 days window -> DECREASING
      expect(profile.trend.direction).toBe(TREND_DIRECTIONS.DECREASING);
      expect(profile.trend.percentageChange).toBeLessThan(0);
    });
  });

  describe('5. Mandatory Non-Causal Analytical Labeling', () => {
    it('explicitly labels hotspot analytics as analytical, not causal proof', () => {
      const clusters = clusterIncidents(SYNTHETIC_HOTSPOT_ISSUES, DEFAULT_WINDOW_SIZE_KM, DEFAULT_MIN_INCIDENTS);
      const profile = buildHotspotProfile(clusters[0], 0, { referenceDate });

      expect(profile.isAnalyticalOnly).toBe(true);
      expect(profile.causalityProof).toBe(false);
      expect(profile.disclaimer).toBe(ANALYTICAL_DISCLAIMER);
      expect(profile.disclaimer).toContain('does not establish root causation');
      expect(profile.disclaimer).toContain('infrastructure failure attribution');
    });
  });

  describe('6. REST API Endpoints Integration', () => {
    const app = express();
    app.use(express.json());
    app.use('/analytics', hotspotRouter);

    it('GET /analytics/hotspots returns 200 with detected hotspots and disclaimer', async () => {
      const res = await request(app)
        .get('/analytics/hotspots')
        .query({ windowSizeKm: 0.5, minIncidents: 3, timeWindowDays: 30 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.hotspots).toBeInstanceOf(Array);
      expect(res.body.disclaimer).toBe(ANALYTICAL_DISCLAIMER);
      expect(res.body.isAnalyticalOnly).toBe(true);
      expect(res.body.causalityProof).toBe(false);

      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalHotspots).toBe(3);
      expect(res.body.summary.criticalIntensityHotspots).toBeDefined();
    });

    it('GET /analytics/hotspots filters by categoryId correctly', async () => {
      const res = await request(app)
        .get('/analytics/hotspots')
        .query({ categoryId: 'electricity_streetlight_out' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only Chinchwad has streetlight cluster
      expect(res.body.hotspots.length).toBe(1);
      expect(res.body.hotspots[0].dominantCategory).toBe('electricity_streetlight_out');
    });

    it('GET /analytics/hotspots/trends returns 200 with category trends and emerging hotspots', async () => {
      const res = await request(app).get('/analytics/hotspots/trends');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.categoryTrends).toBeInstanceOf(Array);
      expect(res.body.emergingHotspots).toBeInstanceOf(Array);
      expect(res.body.chronicHotspots).toBeInstanceOf(Array);
      expect(res.body.disclaimer).toBe(ANALYTICAL_DISCLAIMER);
    });

    it('GET /analytics/hotspots/:id returns 200 for existing hotspot and 404 for non-existent', async () => {
      const res = await request(app).get('/analytics/hotspots/hotspot-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hotspot.id).toBe('hotspot-1');
      expect(res.body.hotspot.incidents.length).toBeGreaterThan(0);

      const notFoundRes = await request(app).get('/analytics/hotspots/unknown-hotspot-999');
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.success).toBe(false);
    });
  });
});
