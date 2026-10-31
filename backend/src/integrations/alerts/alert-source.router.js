/**
 * Disaster Alert Ingestion REST Router
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - POST /alerts/ingest (Ingest CAP XML, CAP JSON, RSS alert with source signature)
 * - GET  /alerts (List ingested alerts with filter)
 * - GET  /alerts/:id (Retrieve alert by internal ID)
 * - GET  /alerts/external/:authority/:externalId (Retrieve by authority and external ID)
 * - POST /alerts/poll (Trigger feed poll across adapters)
 * - GET  /alerts/adapters (List registered alert source adapters)
 */

import { Router } from 'express';
import { alertIngestionService } from './alert-ingestion.service.js';
import { alertAdapterRegistry } from './alert-adapter-registry.js';
import { DISASTER_STATUTORY_DISCLAIMER, INGESTION_STATUS } from './alert-adapter.types.js';

export const alertRouter = Router();

/**
 * POST /alerts/ingest
 * Ingests an official emergency alert payload with idempotency and provenance checks.
 */
alertRouter.post('/ingest', async (req, res) => {
  try {
    const signature =
      req.headers['x-alert-signature'] ||
      req.body.signature ||
      null;

    const sourceAuthority =
      req.headers['x-alert-authority'] ||
      req.body.sourceAuthority ||
      req.body.authority ||
      null;

    // Payload can be inside req.body.payload, req.body.xmlPayload, or the req.body itself
    const rawPayload = req.body.payload || req.body.xmlPayload || req.body;

    const options = {
      sourceAuthority,
      signature,
      secretKey: req.body.secretKey,
      format: req.body.format,
      feedUrl: req.body.feedUrl,
      allowUnsigned: req.body.allowUnsigned !== false,
      correlateWithDisasters: req.body.correlateWithDisasters !== false,
    };

    const outcome = await alertIngestionService.ingestAlert(rawPayload, options);

    // Return 200 for idempotent duplicate, 201 for fresh ingestion
    const statusCode = outcome.status === INGESTION_STATUS.ALREADY_INGESTED ? 200 : 201;

    res.status(statusCode).json(outcome);
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      status: err.status || 'FAILED',
      error: err.message,
      verificationStatus: err.verificationStatus || null,
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
    });
  }
});

/**
 * GET /alerts
 * Lists ingested alerts with optional query filters.
 */
alertRouter.get('/', async (req, res) => {
  try {
    const alerts = await alertIngestionService.listAlerts(req.query);

    res.json({
      success: true,
      count: alerts.length,
      alerts,
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
 * GET /alerts/adapters
 * Lists all registered alerting source adapters.
 */
alertRouter.get('/adapters', (req, res) => {
  try {
    const adapters = alertAdapterRegistry.listAdapters();
    res.json({
      success: true,
      count: adapters.length,
      adapters,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /alerts/poll
 * Triggers on-demand polling cycle across registered alerting adapters.
 */
alertRouter.post('/poll', async (req, res) => {
  try {
    const adapterIds = Array.isArray(req.body?.adapterIds) ? req.body.adapterIds : [];
    const outcome = await alertIngestionService.pollAdapters(adapterIds);

    res.json(outcome);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /alerts/external/:authority/:externalId
 * Retrieves an alert by statutory authority and external identifier.
 */
alertRouter.get('/external/:authority/:externalId', async (req, res) => {
  try {
    const { authority, externalId } = req.params;
    const alert = await alertIngestionService.getAlertByExternalId(authority, externalId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Official alert '${externalId}' from authority '${authority}' not found.`,
      });
    }

    res.json({
      success: true,
      alert,
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
 * GET /alerts/:id
 * Retrieves a single ingested alert by internal ID.
 */
alertRouter.get('/:id', async (req, res) => {
  try {
    const alert = await alertIngestionService.getAlertById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Ingested alert '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      alert,
      disclaimer: DISASTER_STATUTORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});
