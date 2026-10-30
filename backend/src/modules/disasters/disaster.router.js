/**
 * Disaster Event Model Express Router
 * Phase 61: Build disaster event model
 */

import { Router } from 'express';
import { disasterService } from './disaster.service.js';
import { DISASTER_STATUTORY_DISCLAIMER } from './disaster.types.js';

export const disasterRouter = Router();

// ─────────────────────────────────────────────────────────────
// Disaster Listing & Spatial / Concurrent Queries
// ─────────────────────────────────────────────────────────────

/**
 * GET /disasters
 * Lists disaster events with filtering.
 */
disasterRouter.get('/', async (req, res) => {
  try {
    const disasters = await disasterService.listDisasters(req.query);
    res.json({
      success: true,
      count: disasters.length,
      disasters,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /disasters/concurrent
 * Retrieves all currently active concurrent disasters and their spatial overlap matrix.
 */
disasterRouter.get('/concurrent', async (req, res) => {
  try {
    const report = await disasterService.findConcurrentDisasters(req.query);
    res.json({
      success: true,
      ...report,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /disasters/at-point
 * Evaluates whether a geographic point falls inside any active disaster polygon.
 * Supports detecting multiple concurrent disasters at the citizen's location.
 */
disasterRouter.get('/at-point', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.query.latitude);
    const lng = parseFloat(req.query.lng || req.query.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: "Valid query parameters 'latitude' and 'longitude' (or 'lat' and 'lng') are required.",
      });
    }

    const result = await disasterService.findDisastersAtPoint(lat, lng, req.query);
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
 * GET /disasters/:id
 * Retrieves disaster event details by ID.
 */
disasterRouter.get('/:id', async (req, res) => {
  try {
    const disaster = await disasterService.getDisasterById(req.params.id);
    if (!disaster) {
      return res.status(404).json({
        success: false,
        error: `Disaster event '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      disaster,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /disasters/:id/situation-report
 * Retrieves consolidated situational report for an incident.
 */
disasterRouter.get('/:id/situation-report', async (req, res) => {
  try {
    const sitrep = await disasterService.getSituationalReport(req.params.id);
    res.json({
      success: true,
      sitrep,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /disasters/:id/signals
 * Retrieves official and user signals recorded for a disaster.
 */
disasterRouter.get('/:id/signals', async (req, res) => {
  try {
    const signals = await disasterService.getDisasterSignals(req.params.id, req.query);
    res.json({
      success: true,
      disasterId: req.params.id,
      count: signals.length,
      signals,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /disasters
 * Creates a new disaster event.
 */
disasterRouter.post('/', async (req, res) => {
  try {
    const actor = req.body.actor || {
      id: req.headers['x-user-id'] || 'system',
      role: req.headers['x-user-role'] || 'DISASTER_COORDINATOR',
    };

    const disaster = await disasterService.createDisaster(req.body, { actor });
    res.status(201).json({
      success: true,
      disaster,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /disasters/:id/state
 * Transitions disaster lifecycle state.
 */
disasterRouter.patch('/:id/state', async (req, res) => {
  try {
    const actor = req.body.actor || {
      id: req.headers['x-user-id'] || 'coordinator-1',
      role: req.headers['x-user-role'] || 'DISASTER_COORDINATOR',
    };

    const disaster = await disasterService.updateLifecycleState(
      req.params.id,
      req.body.lifecycleState || req.body.state,
      { actor, notes: req.body.notes }
    );

    res.json({
      success: true,
      disaster,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /disasters/:id/polygon
 * Updates the affected polygon boundary for a disaster.
 */
disasterRouter.patch('/:id/polygon', async (req, res) => {
  try {
    const actor = req.body.actor || {
      id: req.headers['x-user-id'] || 'coordinator-1',
      role: req.headers['x-user-role'] || 'DISASTER_COORDINATOR',
    };

    const disaster = await disasterService.updateAffectedPolygon(
      req.params.id,
      req.body.affectedPolygon || req.body.polygon,
      req.body.reason,
      actor
    );

    res.json({
      success: true,
      disaster,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /disasters/:id/official-alerts
 * Links an external statutory authority alert reference.
 */
disasterRouter.post('/:id/official-alerts', async (req, res) => {
  try {
    const alertRef = await disasterService.attachOfficialAlertReference(req.params.id, req.body);
    res.status(201).json({
      success: true,
      disasterId: req.params.id,
      alertReference: alertRef,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /disasters/:id/signals
 * Ingests an official or citizen/sensor signal with provenance.
 */
disasterRouter.post('/:id/signals', async (req, res) => {
  try {
    const signal = await disasterService.recordSignal(req.params.id, req.body);
    res.status(201).json({
      success: true,
      disasterId: req.params.id,
      signal,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});
