/**
 * Phase 57 Exit Checks: Road-Safety Correlation Analytics Tests
 * Validates correlation correctness, non-causal disclaimer enforcement,
 * "investigation recommended" hotspot generation, and REST API endpoints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import {
  safetyCorrelationService,
  SAFETY_CORRELATION_DISCLAIMER,
  INVESTIGATION_PRIORITY,
  CORRELATION_LEVELS,
  DEFAULT_CORRELATION_RADIUS_KM,
  INVESTIGATION_THRESHOLD_SCORE,
} from './index.js';

describe('Phase 57: Road-Safety Correlation Analytics', () => {
  beforeEach(() => {
    safetyCorrelationService.reset();
  });

  describe('1. Spatial and Temporal Correlation Correctness', () => {
    it('correlates nearby civic issues within 250m radius and lookback window', () => {
      // Coordinates near Paud Road Flyover Ramp: 18.5074, 73.8077
      const result = safetyCorrelationService.correlateLocation(18.5074, 73.8077, {
        radiusKm: 0.25, // 250m
        lookbackDays: 90,
      });

      expect(result.coordinates.latitude).toBe(18.5074);
      expect(result.coordinates.longitude).toBe(73.8077);
      expect(result.correlatedIssuesCount).toBeGreaterThanOrEqual(3);
      expect(result.compositeScore).toBeGreaterThanOrEqual(0.70);
      expect(result.isInvestigationRecommended).toBe(true);

      const issueTitles = result.correlatedIssues.map((i) => i.title);
      expect(issueTitles.some((t) => t.includes('potholes'))).toBe(true);
      expect(issueTitles.some((t) => t.includes('Streetlights'))).toBe(true);
    });

    it('excludes civic issues located far outside the spatial correlation radius', () => {
      // Remote location in Pune University / Pashan without nearby issues
      const result = safetyCorrelationService.correlateLocation(18.5500, 73.8100, {
        radiusKm: 0.15, // 150m
      });

      expect(result.correlatedIssuesCount).toBe(0);
      expect(result.compositeScore).toBeLessThan(0.40);
      expect(result.isInvestigationRecommended).toBe(false);
      expect(result.investigationPriority).toBe(INVESTIGATION_PRIORITY.NONE);
    });

    it('respects temporal lookback window filter and ignores outdated historical defects', () => {
      const tightLookbackResult = safetyCorrelationService.correlateLocation(18.5204, 73.8567, {
        lookbackDays: 5, // Only past 5 days
        referenceTime: '2026-10-29T10:00:00Z',
      });

      const wideLookbackResult = safetyCorrelationService.correlateLocation(18.5204, 73.8567, {
        lookbackDays: 60, // Past 60 days
        referenceTime: '2026-10-29T10:00:00Z',
      });

      expect(wideLookbackResult.correlatedIssuesCount).toBeGreaterThanOrEqual(
        tightLookbackResult.correlatedIssuesCount
      );
    });
  });

  describe('2. Mandatory Non-Causal Framing & Disclaimers', () => {
    it('attaches mandatory non-causal disclaimer to on-demand correlation analysis', () => {
      const result = safetyCorrelationService.correlateLocation(18.5074, 73.8077);
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer).toBe(SAFETY_CORRELATION_DISCLAIMER);
      expect(result.disclaimer).toContain('Statistical spatial-temporal correlation only');
      expect(result.disclaimer).toContain('NOT causal proof');
    });

    it('ensures all listed safety hotspots explicitly include the non-causal disclaimer', async () => {
      const list = await safetyCorrelationService.listSafetyHotspots();
      expect(list.disclaimer).toBe(SAFETY_CORRELATION_DISCLAIMER);
      for (const spot of list.hotspots) {
        expect(spot.disclaimer).toBe(SAFETY_CORRELATION_DISCLAIMER);
      }
    });

    it('labels observations as spatial-temporal association rather than cause', async () => {
      const hotspot = await safetyCorrelationService.getSafetyHotspotById('safe-spot-pune-001');
      expect(hotspot.observationSummary).toBeDefined();
      expect(hotspot.observationSummary).toContain('statistical concentration');
      expect(hotspot.observationSummary).not.toMatch(/\bcaused by\b/i);
    });
  });

  describe('3. "Investigation Recommended" Hotspot Logic & Engineering Recommendations', () => {
    it('produces "Investigation Recommended" status when correlation score meets threshold', async () => {
      const criticalHotspot = await safetyCorrelationService.getSafetyHotspotById('safe-spot-pune-001');

      expect(criticalHotspot.correlationScore).toBeGreaterThanOrEqual(INVESTIGATION_THRESHOLD_SCORE);
      expect(criticalHotspot.isInvestigationRecommended).toBe(true);
      expect(criticalHotspot.investigationPriority).toBe(INVESTIGATION_PRIORITY.CRITICAL);
      expect(criticalHotspot.investigationRecommendation).toBeDefined();
      expect(criticalHotspot.investigationRecommendation.recommendedAction).toContain('inspection');
      expect(criticalHotspot.investigationRecommendation.suggestedRemediationFocus.length).toBeGreaterThan(0);
    });

    it('does NOT recommend investigation for isolated control incidents with low correlation', async () => {
      const controlHotspot = await safetyCorrelationService.getSafetyHotspotById('safe-spot-pune-004');

      expect(controlHotspot.correlationScore).toBeLessThan(INVESTIGATION_THRESHOLD_SCORE);
      expect(controlHotspot.isInvestigationRecommended).toBe(false);
      expect(controlHotspot.investigationPriority).toBe(INVESTIGATION_PRIORITY.NONE);
      expect(controlHotspot.investigationRecommendation).toBeNull();
    });

    it('recommends focus areas matching specific correlated defect types (potholes, lighting, signals)', () => {
      const issues = [
        { category: 'roads_pothole' },
        { category: 'lighting_streetlight_out' },
      ];
      const rec = safetyCorrelationService.generateInvestigationRecommendations('Paud Road', issues, {
        fatalitiesCount: 0,
        injuredCount: 2,
      });

      expect(rec.suggestedRemediationFocus.some((f) => f.includes('pothole') || f.includes('wearing course'))).toBe(true);
      expect(rec.suggestedRemediationFocus.some((f) => f.includes('lighting') || f.includes('lux'))).toBe(true);
      expect(rec.estimatedUrgencyDays).toBe(7);
    });
  });

  describe('4. REST API Endpoints Integration', () => {
    it('GET /analytics/safety/hotspots lists road safety hotspots with disclaimer and pagination', async () => {
      const res = await request(app).get('/analytics/safety/hotspots');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hotspots.length).toBeGreaterThanOrEqual(4);
      expect(res.body.disclaimer).toContain('Statistical spatial-temporal correlation only');
    });

    it('GET /analytics/safety/hotspots filters by investigationRecommendedOnly=true', async () => {
      const res = await request(app).get('/analytics/safety/hotspots?investigationRecommendedOnly=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hotspots.length).toBeGreaterThanOrEqual(2);
      expect(res.body.hotspots.every((h) => h.isInvestigationRecommended === true)).toBe(true);
    });

    it('GET /analytics/safety/hotspots filters by corridorOrRoadName', async () => {
      const res = await request(app).get('/analytics/safety/hotspots?corridorOrRoadName=Paud');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hotspots.length).toBeGreaterThanOrEqual(1);
      expect(res.body.hotspots[0].corridorOrRoadName).toBe('Paud Road');
    });

    it('GET /analytics/safety/hotspots/:id returns single detailed hotspot', async () => {
      const res = await request(app).get('/analytics/safety/hotspots/safe-spot-pune-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.hotspot.id).toBe('safe-spot-pune-001');
      expect(res.body.hotspot.isInvestigationRecommended).toBe(true);
      expect(res.body.hotspot.disclaimer).toBeDefined();
    });

    it('GET /analytics/safety/hotspots/:id returns 404 for unknown hotspot ID', async () => {
      const res = await request(app).get('/analytics/safety/hotspots/non-existent-hotspot');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('GET /analytics/safety/correlate performs on-demand point correlation', async () => {
      const res = await request(app).get('/analytics/safety/correlate?latitude=18.5074&longitude=73.8077');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.compositeScore).toBeGreaterThanOrEqual(0.60);
      expect(res.body.isInvestigationRecommended).toBe(true);
      expect(res.body.disclaimer).toContain('Statistical spatial-temporal correlation only');
    });

    it('GET /analytics/safety/correlate returns 400 when coordinates are missing or invalid', async () => {
      const res = await request(app).get('/analytics/safety/correlate?latitude=abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Valid numeric latitude and longitude');
    });

    it('GET /analytics/safety/summary returns aggregate metrics and non-causal disclaimer', async () => {
      const res = await request(app).get('/analytics/safety/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalHotspots).toBeGreaterThanOrEqual(4);
      expect(res.body.investigationRecommendedCount).toBeGreaterThanOrEqual(3);
      expect(res.body.criticalPriorityCount).toBeGreaterThanOrEqual(1);
      expect(res.body.topCorridors.length).toBeGreaterThanOrEqual(2);
      expect(res.body.disclaimer).toContain('Statistical spatial-temporal correlation only');
    });
  });
});
