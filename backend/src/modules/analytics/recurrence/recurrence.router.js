/**
 * Recurring Issue Analytics Express Router
 * Phase 47: Recurring Issue Analytics
 */

import { Router } from 'express';
import { recurrenceService } from './recurrence.service.js';

export const recurrenceRouter = Router();

/**
 * GET /analytics/recurrence/candidates
 * Retrieves scored maintenance-review candidates with configurable thresholds.
 */
recurrenceRouter.get('/recurrence/candidates', async (req, res, next) => {
  try {
    const {
      minFailures,
      observationWindowDays,
      assetType,
      department,
      urgency,
    } = req.query;

    const result = await recurrenceService.getMaintenanceReviewCandidates({
      minFailures: minFailures ? parseInt(minFailures, 10) : undefined,
      observationWindowDays: observationWindowDays ? parseInt(observationWindowDays, 10) : undefined,
      assetType: assetType || undefined,
      department: department || undefined,
      urgency: urgency || undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/recurrence/assets/:assetId
 * Retrieves full failure timeline and maintenance history for a specific asset.
 */
recurrenceRouter.get('/recurrence/assets/:assetId', async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const { observationWindowDays } = req.query;

    const assetData = await recurrenceService.getAssetRecurrence(assetId, {
      observationWindowDays: observationWindowDays ? parseInt(observationWindowDays, 10) : undefined,
    });

    if (!assetData) {
      return res.status(404).json({
        success: false,
        error: `Asset recurrence profile with id '${assetId}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      asset: assetData,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /analytics/recurrence/summary
 * Retrieves overall recurrence KPIs, department breakdown, and urgency distribution.
 */
recurrenceRouter.get('/recurrence/summary', async (req, res, next) => {
  try {
    const { observationWindowDays } = req.query;
    const data = await recurrenceService.getMaintenanceReviewCandidates({
      observationWindowDays: observationWindowDays ? parseInt(observationWindowDays, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      summary: data.summary,
      disclaimer: data.disclaimer,
    });
  } catch (err) {
    next(err);
  }
});
