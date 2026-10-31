/**
 * Disaster Impact Reporting REST Router
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - POST /disaster-impact/reports (Submit citizen/field impact report)
 * - GET  /disaster-impact/reports (List impact reports with filtering)
 * - GET  /disaster-impact/reports/:id (Retrieve specific impact report)
 * - GET  /disaster-impact/summary/:disasterId (Aggregated impact breakdown metrics)
 * - PATCH /disaster-impact/reports/:id/triage (Update triage/resolution status)
 */

import { Router } from 'express';
import { disasterImpactService } from './disaster-impact.service.js';
import { DISASTER_IMPACT_DISCLAIMER } from './disaster-impact.types.js';

export const disasterImpactRouter = Router();

/**
 * POST /disaster-impact/reports
 * Emergency fast-path report submission with UNVERIFIED initial status.
 */
disasterImpactRouter.post('/reports', async (req, res) => {
  try {
    const reporterContext = {
      id: req.headers['x-user-id'] || req.body.reporterId || 'citizen-anonymous',
      role: req.headers['x-user-role'] || req.body.reporterRole || 'CITIZEN',
      phone: req.body.phone || req.body.reporterPhone || null,
    };

    const outcome = await disasterImpactService.submitImpactReport(req.body, reporterContext);
    res.status(201).json(outcome);
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
      statutoryNotice: DISASTER_IMPACT_DISCLAIMER,
    });
  }
});

/**
 * GET /disaster-impact/reports
 * Lists impact reports matching query parameters.
 */
disasterImpactRouter.get('/reports', async (req, res) => {
  try {
    const reports = await disasterImpactService.listReports(req.query);

    res.json({
      success: true,
      count: reports.length,
      reports,
      disclaimer: DISASTER_IMPACT_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /disaster-impact/summary/:disasterId
 * Returns aggregated situational impact metrics for a disaster incident.
 */
disasterImpactRouter.get('/summary/:disasterId', async (req, res) => {
  try {
    const summary = await disasterImpactService.getImpactSummary(req.params.disasterId);

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
 * GET /disaster-impact/reports/:id
 * Retrieves a single impact report by ID.
 */
disasterImpactRouter.get('/reports/:id', async (req, res) => {
  try {
    const report = await disasterImpactService.getReportById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: `Disaster impact report '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      report,
      disclaimer: DISASTER_IMPACT_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /disaster-impact/reports/:id/triage
 * Transitions impact report status (FIELD_TRIAGED, RESPONDER_DISPATCHED, RESOLVED).
 */
disasterImpactRouter.patch('/reports/:id/triage', async (req, res) => {
  try {
    const triageContext = {
      actor: {
        id: req.headers['x-user-id'] || 'responder-1',
        role: req.headers['x-user-role'] || 'DISASTER_RESPONDER',
      },
      notes: req.body.notes,
    };

    const report = await disasterImpactService.triageReport(
      req.params.id,
      req.body.status,
      triageContext
    );

    res.json({
      success: true,
      report,
      disclaimer: DISASTER_IMPACT_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});
