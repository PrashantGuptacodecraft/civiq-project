/**
 * Road-Safety Correlation Analytics Express Router
 * Phase 57: Add road-safety correlation analytics
 */

import { Router } from 'express';
import { safetyCorrelationService } from './safety.service.js';

export const safetyRouter = Router();

/**
 * GET /analytics/safety/summary
 * Returns aggregated road-safety summary statistics and mandatory disclaimer.
 */
safetyRouter.get('/safety/summary', async (req, res) => {
  try {
    const summary = await safetyCorrelationService.getSafetySummaryStats(req.query);
    res.json({
      success: true,
      ...summary,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /analytics/safety/correlate
 * On-demand correlation analysis for a specific geographic coordinate point or corridor.
 */
safetyRouter.get('/safety/correlate', async (req, res) => {
  try {
    const { latitude, longitude, radiusKm, lookbackDays } = req.query;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric latitude and longitude query parameters are required.',
      });
    }

    const result = safetyCorrelationService.correlateLocation(lat, lon, {
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      lookbackDays: lookbackDays ? parseInt(lookbackDays, 10) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /analytics/safety/hotspots
 * Lists correlated road safety hotspots with non-causal disclaimer and filtering.
 */
safetyRouter.get('/safety/hotspots', async (req, res) => {
  try {
    const result = await safetyCorrelationService.listSafetyHotspots(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /analytics/safety/hotspots/:id
 * Retrieves detailed safety hotspot by ID with engineering investigation recommendations.
 */
safetyRouter.get('/safety/hotspots/:id', async (req, res) => {
  try {
    const hotspot = await safetyCorrelationService.getSafetyHotspotById(req.params.id);
    res.json({
      success: true,
      hotspot,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});
