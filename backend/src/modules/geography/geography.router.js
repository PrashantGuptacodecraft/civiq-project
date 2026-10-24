import { Router, Request, Response } from 'express';
import { geographyService } from './geography.service';

export const geographyRouter = Router();

/**
 * POST /geography/resolve
 * Resolves GPS/map point to administrative jurisdiction with ambiguity buffer checking.
 */
geographyRouter.post('/resolve', async (req, res) => {
  try {
    const { latitude, longitude, ambiguityBufferMeters } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: latitude and longitude are required.',
      });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: 'Invalid coordinates: latitude and longitude must be numbers.',
      });
      return;
    }

    const options: { ambiguityBufferMeters? } = {};
    if (ambiguityBufferMeters !== undefined) {
      options.ambiguityBufferMeters = Number(ambiguityBufferMeters);
    }

    const result = await geographyService.resolvePointToJurisdiction(
      { latitude: lat, longitude: lng },
      options
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to resolve point to jurisdiction.',
    });
  }
});

/**
 * GET /geography/jurisdictions
 * Returns list of registered jurisdictions.
 */
geographyRouter.get('/jurisdictions', async (req, res) => {
  try {
    const query: { parentId?; type? } = {};
    if (typeof req.query.parentId === 'string') {
      query.parentId = req.query.parentId;
    }
    if (typeof req.query.type === 'string') {
      query.type = req.query.type;
    }

    const list = await geographyService.getJurisdictions(query);

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve jurisdictions.',
    });
  }
});

/**
 * GET /geography/jurisdictions/:id/boundary
 * Returns polygon boundaries and bounding box for a jurisdiction.
 */
geographyRouter.get('/jurisdictions/:id/boundary', async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Jurisdiction ID is required.',
      });
      return;
    }

    const boundary = await geographyService.getJurisdictionBoundary(id);

    if (!boundary) {
      res.status(404).json({
        success: false,
        error: `Boundary not found for jurisdiction: "${id}".`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: boundary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve jurisdiction boundary.',
    });
  }
});

/**
 * POST /geography/correct
 * Records manual correction for an ambiguous or contested jurisdiction.
 */
geographyRouter.post('/correct', async (req, res) => {
  try {
    const { issueId, point, originalJurisdictionId, selectedJurisdictionId, reason, userId } = req.body;

    if (!selectedJurisdictionId || !point || point.latitude === undefined || point.longitude === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: point and selectedJurisdictionId are required.',
      });
      return;
    }

    const result = await geographyService.recordManualCorrection({
      issueId,
      point: {
        latitude(point.latitude),
        longitude(point.longitude),
      },
      originalJurisdictionId,
      selectedJurisdictionId,
      reason,
      userId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to record manual jurisdiction correction.',
    });
  }
});