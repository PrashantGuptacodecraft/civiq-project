/**
 * Emergency Responder & Agency Role Express Router
 * Phase 59: Add emergency responder/agency role model
 */

import { Router } from 'express';
import { responderService } from './responder.service.js';
import { incidentService } from '../incidents/incident.service.js';
import { DISPATCH_ADVISORY_DISCLAIMER } from './responder.types.js';

export const responderRouter = Router();

// ─────────────────────────────────────────────────────────────
// Agency Routes
// ─────────────────────────────────────────────────────────────

/**
 * GET /responders/agencies
 * Lists all registered authorized emergency responder agencies.
 */
responderRouter.get('/agencies', async (req, res) => {
  try {
    const agencies = await responderService.listAgencies(req.query);
    res.json({
      success: true,
      count: agencies.length,
      agencies,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /responders/agencies/:id
 * Retrieves agency details by ID.
 */
responderRouter.get('/agencies/:id', async (req, res) => {
  try {
    const agency = await responderService.getAgency(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: `Responder agency '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      agency,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /responders/agencies
 * Registers a new authorized responder agency.
 */
responderRouter.post('/agencies', async (req, res) => {
  try {
    const agency = await responderService.registerAgency(req.body);
    res.status(201).json({
      success: true,
      agency,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Responder Personnel Routes
// ─────────────────────────────────────────────────────────────

/**
 * GET /responders
 * Lists responder personnel with filtering.
 */
responderRouter.get('/', async (req, res) => {
  try {
    const responders = await responderService.listResponders(req.query);
    res.json({
      success: true,
      count: responders.length,
      responders,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /responders/:id
 * Retrieves responder details by ID.
 */
responderRouter.get('/:id', async (req, res) => {
  try {
    const responder = await responderService.getResponderById(req.params.id);
    if (!responder) {
      return res.status(404).json({
        success: false,
        error: `Responder '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      responder,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /responders
 * Registers a new authorized responder.
 */
responderRouter.post('/', async (req, res) => {
  try {
    const responder = await responderService.registerResponder(req.body);
    res.status(201).json({
      success: true,
      responder,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /responders/:id/status
 * Updates responder availability and operational status.
 */
responderRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status, location } = req.body;
    const responder = await responderService.updateResponderStatus(req.params.id, status, location);
    res.json({
      success: true,
      responder,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Scoped Access & Sensitive Incident Inspection
// ─────────────────────────────────────────────────────────────

/**
 * POST /responders/incidents/:id/authorize-access
 * Evaluates scoped access permission, enforces redaction if unauthorized,
 * and logs sensitive access audit records.
 */
responderRouter.post('/incidents/:id/authorize-access', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const incident = await incidentService.getIncidentById(incidentId, {
      user: { role: 'PLATFORM_SUPER_ADMIN' }, // Fetch raw record for evaluation
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident '${incidentId}' not found.`,
      });
    }

    const actor = req.body.actor || {
      id: req.headers['x-user-id'] || 'anonymous',
      role: req.headers['x-user-role'] || 'CITIZEN',
      jurisdictionId: req.headers['x-jurisdiction-id'] || null,
      badgeNumber: req.headers['x-badge-number'] || null,
      agencyId: req.headers['x-agency-id'] || null,
    };

    const requestedLevel = req.body.requestedLevel || 'SUMMARY';
    const context = {
      justification: req.body.justification,
      accessAction: req.body.accessAction,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const result = await responderService.authorizeIncidentAccess(actor, incident, requestedLevel, context);

    res.json({
      success: true,
      allowed: result.allowed,
      redactionsApplied: result.redactionsApplied,
      auditLogged: result.auditLogged,
      auditEntryId: result.auditEntryId || null,
      incident: result.incident,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /responders/incidents/:id/audit-trail
 * Retrieves audit logs of sensitive access for a given incident.
 */
responderRouter.get('/incidents/:id/audit-trail', async (req, res) => {
  try {
    const logs = await responderService.getSensitiveAccessAuditTrail(req.params.id);
    res.json({
      success: true,
      incidentId: req.params.id,
      count: logs.length,
      auditLogs: logs,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Advisory Dispatch Recommendations
// ─────────────────────────────────────────────────────────────

/**
 * POST /responders/incidents/:id/dispatch-recommendation
 * Generates algorithmic multi-agency dispatch recommendations with non-CAD statutory disclaimer.
 */
responderRouter.post('/incidents/:id/dispatch-recommendation', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const incident = await incidentService.getIncidentById(incidentId, {
      user: { role: 'PLATFORM_SUPER_ADMIN' },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident '${incidentId}' not found.`,
      });
    }

    const recommendation = await responderService.createDispatchRecommendation(incident);

    res.status(201).json({
      success: true,
      recommendation,
      disclaimer: DISPATCH_ADVISORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /responders/dispatch-recommendations/:id
 * Retrieves a specific dispatch recommendation.
 */
responderRouter.get('/dispatch-recommendations/:id', async (req, res) => {
  try {
    const recommendation = await responderService.getDispatchRecommendation(req.params.id);
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: `Dispatch recommendation '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      recommendation,
      disclaimer: DISPATCH_ADVISORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * PATCH /responders/dispatch-recommendations/:id/status
 * Updates dispatch recommendation status (transmitted to CAD, acknowledged by responder).
 */
responderRouter.patch('/dispatch-recommendations/:id/status', async (req, res) => {
  try {
    const { status, notes, actor } = req.body;
    const updated = await responderService.updateDispatchRecommendationStatus(req.params.id, status, {
      actor,
      notes,
    });

    res.json({
      success: true,
      recommendation: updated,
      disclaimer: DISPATCH_ADVISORY_DISCLAIMER,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});
