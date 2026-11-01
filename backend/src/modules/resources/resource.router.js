/**
 * Disaster Resource & Shelter REST Router
 * Phase 64: Build resource and shelter registry
 *
 * Implements:
 * - POST /resources (Create verified resource record)
 * - GET  /resources (List resources with filtering & jurisdiction scoping)
 * - GET  /resources/nearby (Find nearest available shelters to citizen GPS)
 * - GET  /resources/summary (Aggregated resource metrics)
 * - GET  /resources/:id (Get single resource details & capacity history)
 * - PATCH /resources/:id/capacity (Update capacity with source & timestamp)
 */

import { Router } from 'express';
import { resourceService } from './resource.service.js';
import { DISASTER_RESOURCE_DISCLAIMER } from './resource.types.js';

export const resourceRouter = Router();

function extractUserContext(req) {
  return {
    id: req.headers['x-user-id'] || 'usr-anon',
    role: req.headers['x-user-role'] || 'CITIZEN',
    jurisdictionId: req.headers['x-jurisdiction-id'] || null,
    organizationName: req.headers['x-org-name'] || null,
  };
}

/**
 * POST /resources
 * Registers a new verified disaster resource or shelter record.
 */
resourceRouter.post('/', async (req, res) => {
  try {
    const userContext = extractUserContext(req);
    const resource = await resourceService.createResource(req.body, userContext);

    res.status(201).json({
      success: true,
      resource,
      disclaimer: DISASTER_RESOURCE_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /resources/nearby
 * Searches for nearest resources (e.g. shelters) around a citizen's GPS coordinates.
 */
resourceRouter.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters lat and lng must be valid numbers.',
      });
    }

    const options = {
      resourceType: req.query.resourceType,
      hasAvailableCapacity: req.query.hasAvailableCapacity,
      maxDistanceKm: req.query.maxDistanceKm,
    };

    const resources = await resourceService.findNearbyResources(lat, lng, options);

    res.json({
      success: true,
      count: resources.length,
      resources,
      disclaimer: DISASTER_RESOURCE_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /resources/summary
 * Retrieves high-level resource and shelter availability summary.
 */
resourceRouter.get('/summary', async (req, res) => {
  try {
    const jurisdictionId = req.query.jurisdictionId || null;
    const summary = await resourceService.getResourceSummary(jurisdictionId);

    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /resources
 * Lists resources with filtering and jurisdiction scoping.
 */
resourceRouter.get('/', async (req, res) => {
  try {
    const userContext = extractUserContext(req);
    const resources = await resourceService.listResources(req.query, userContext);

    res.json({
      success: true,
      count: resources.length,
      resources,
      disclaimer: DISASTER_RESOURCE_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /resources/:id
 * Retrieves a single resource record with complete capacity audit history.
 */
resourceRouter.get('/:id', async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: `Resource with ID '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      resource,
      disclaimer: DISASTER_RESOURCE_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /resources/:id/capacity
 * Updates current occupancy / capacity with mandatory source and timestamping.
 */
resourceRouter.patch('/:id/capacity', async (req, res) => {
  try {
    const userContext = extractUserContext(req);
    const resource = await resourceService.updateResourceCapacity(
      req.params.id,
      req.body,
      userContext
    );

    res.json({
      success: true,
      resource,
      disclaimer: DISASTER_RESOURCE_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});
