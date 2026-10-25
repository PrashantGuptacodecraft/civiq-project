/**
 * Civic Hotspot Analytics Express Router
 * Phase 46: Hotspot Analytics
 */

import { Router } from 'express';
import { hotspotService } from './hotspot.service.js';

export const hotspotRouter = Router();

/**
 * GET /analytics/hotspots
 * Detects spatial incident hotspots with configurable window size,
 * minimum incidents threshold, and time filters.
 */
hotspotRouter.get('/hotspots', async (req, res, next) => {
  try {
    const {
      windowSizeKm,
      minIncidents,
      timeWindowDays,
      categoryId,
      jurisdictionId,
    } = req.query;

    const result = await hotspotService.getHotspots({
      windowSizeKm: windowSizeKm ? parseFloat(windowSizeKm) : undefined,
      minIncidents: minIncidents ? parseInt(minIncidents, 10) : undefined,
      timeWindowDays: timeWindowDays ? parseInt(timeWindowDays, 10) : undefined,
      categoryId: categoryId || undefined,
      jurisdictionId: jurisdictionId || undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/hotspots/trends
 * Returns temporal trend dynamics, emerging hotspots, and category breakdowns.
 */
hotspotRouter.get('/hotspots/trends', async (req, res, next) => {
  try {
    const {
      windowSizeKm,
      minIncidents,
      timeWindowDays,
      categoryId,
      jurisdictionId,
    } = req.query;

    const result = await hotspotService.getHotspotTrends({
      windowSizeKm: windowSizeKm ? parseFloat(windowSizeKm) : undefined,
      minIncidents: minIncidents ? parseInt(minIncidents, 10) : undefined,
      timeWindowDays: timeWindowDays ? parseInt(timeWindowDays, 10) : undefined,
      categoryId: categoryId || undefined,
      jurisdictionId: jurisdictionId || undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/hotspots/:id
 * Retrieves detailed constituent incidents and metrics for a specific hotspot.
 */
hotspotRouter.get('/hotspots/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { windowSizeKm, minIncidents, timeWindowDays } = req.query;

    const hotspot = await hotspotService.getHotspotById(id, {
      windowSizeKm: windowSizeKm ? parseFloat(windowSizeKm) : undefined,
      minIncidents: minIncidents ? parseInt(minIncidents, 10) : undefined,
      timeWindowDays: timeWindowDays ? parseInt(timeWindowDays, 10) : undefined,
    });

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        error: `Hotspot with id '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      hotspot,
    });
  } catch (err) {
    next(err);
  }
});
