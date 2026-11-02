/**
 * Sync Router
 * Phase 69: Add offline field sync
 */

import { Router } from 'express';
import { syncService } from './sync.service.js';
import { SYNC_CONFLICT_RESOLUTION } from './sync.types.js';

export const syncRouter = Router();

/**
 * GET /sync/tasks
 * Retrieve tasks delta or initial cache for authenticated worker
 */
syncRouter.get('/tasks', async (req, res) => {
  try {
    const { workerId, jurisdictionId, since } = req.query;
    const result = await syncService.getTasksForWorker({
      workerId,
      jurisdictionId,
      since,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /sync/batch
 * Process a batch of mutations from the offline client queue
 */
syncRouter.post('/batch', async (req, res) => {
  try {
    const { mutations, conflictStrategy } = req.body;

    if (!Array.isArray(mutations)) {
      return res.status(400).json({
        error: "Field 'mutations' must be an array of mutation objects",
      });
    }

    const result = await syncService.processBatchSync({
      mutations,
      conflictStrategy: conflictStrategy || SYNC_CONFLICT_RESOLUTION.LATEST_TIMESTAMP_WINS,
      userContext: req.user || null,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
