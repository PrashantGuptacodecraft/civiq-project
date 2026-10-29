/**
 * Official Incident Source Adapter Express Router
 * Phase 58: Add official-source incident adapter contract
 */

import { Router } from 'express';
import { incidentAdapterRegistry } from './adapter-registry.js';
import { OFFICIAL_ADAPTER_DISCLAIMER } from './incident-adapter.types.js';

export const incidentSourceRouter = Router();

/**
 * GET /integrations/incident-source/adapters
 * Lists all registered official accident data adapters and their live status.
 */
incidentSourceRouter.get('/adapters', (req, res) => {
  try {
    const adapters = incidentAdapterRegistry.listAdapters();
    res.json({
      success: true,
      adapters,
      defaultAdapter: 'MOCK_SANDBOX',
      disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /integrations/incident-source/records
 * Queries normalized official accident records from the designated or default adapter.
 */
incidentSourceRouter.get('/records', async (req, res) => {
  try {
    const adapterName = req.query.adapter || 'mock-sandbox';
    const adapter = incidentAdapterRegistry.getAdapter(adapterName);

    const records = await adapter.fetchAccidents(req.query);

    res.json({
      success: true,
      sourceName: adapter.sourceName,
      isLiveIntegration: adapter.isLiveIntegration,
      isMockOrSandbox: adapter.isMockOrSandbox,
      count: records.length,
      records,
      disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /integrations/incident-source/records/:externalId
 * Retrieves single normalized official accident record by external ID.
 */
incidentSourceRouter.get('/records/:externalId', async (req, res) => {
  try {
    const adapterName = req.query.adapter || 'mock-sandbox';
    const adapter = incidentAdapterRegistry.getAdapter(adapterName);

    const record = await adapter.fetchAccidentById(req.params.externalId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Official accident record with external ID '${req.params.externalId}' not found.`,
      });
    }

    res.json({
      success: true,
      record,
      disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /integrations/incident-source/sync
 * Executes incremental cursor-based synchronization against an accident source feed.
 */
incidentSourceRouter.post('/sync', async (req, res) => {
  try {
    const adapterName = req.body?.adapter || req.query.adapter || 'mock-sandbox';
    const cursor = req.body?.cursor || req.query.cursor || null;
    const batchSize = req.body?.batchSize || 10;

    const adapter = incidentAdapterRegistry.getAdapter(adapterName);
    const result = await adapter.sync(cursor, { batchSize });

    res.json({
      ...result,
      disclaimer: OFFICIAL_ADAPTER_DISCLAIMER,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
