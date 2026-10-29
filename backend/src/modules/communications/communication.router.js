/**
 * Public Safety Communications Express Router
 * Phase 60: Add public safety communication templates
 */

import { Router } from 'express';
import { communicationService } from './communication.service.js';
import {
  EMERGENCY_DISCLAIMER_TEXT,
  EMERGENCY_HANDOFF_CONTACTS,
} from './communication.types.js';

export const communicationRouter = Router();

// ─────────────────────────────────────────────────────────────
// Template Routes
// ─────────────────────────────────────────────────────────────

/**
 * GET /communications/templates
 * Lists all approved public safety communication templates.
 */
communicationRouter.get('/templates', async (req, res) => {
  try {
    const templates = await communicationService.listTemplates(req.query);
    res.json({
      success: true,
      count: templates.length,
      templates,
      emergencyContacts: EMERGENCY_HANDOFF_CONTACTS,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /communications/templates/:id
 * Retrieves details and variables schema for a specific template.
 */
communicationRouter.get('/templates/:id', async (req, res) => {
  try {
    const template = await communicationService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Communication template '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      template,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /communications/render
 * Renders an approved template with variables and validates parameters.
 */
communicationRouter.post('/render', async (req, res) => {
  try {
    const { templateId, variables, language, jurisdictionId, severity, channels } = req.body;
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required to render a communication.',
      });
    }

    const rendered = await communicationService.renderTemplate(templateId, variables || {}, {
      language,
      jurisdictionId,
      severity,
      channels,
    });

    res.status(201).json({
      success: true,
      alert: rendered,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// AI-Draft Ingestion & Review Routes
// ─────────────────────────────────────────────────────────────

/**
 * POST /communications/ai-draft
 * Ingests an AI-drafted public safety message into pending review state.
 */
communicationRouter.post('/ai-draft', async (req, res) => {
  try {
    const aiDraft = await communicationService.createAiDraft(req.body, {
      modelIdentifier: req.body.modelIdentifier,
      promptTokens: req.body.promptTokens,
      language: req.body.language,
    });

    res.status(201).json({
      success: true,
      aiDraft,
      notice: 'AI draft ingested with status AI_DRAFT_PENDING_REVIEW. Human official review is required prior to publication.',
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /communications/alerts/:id/approve
 * Human official review and approval of an AI-drafted or pending alert.
 */
communicationRouter.post('/alerts/:id/approve', async (req, res) => {
  try {
    const approver = req.body.approver || {
      id: req.headers['x-user-id'] || 'official-1',
      role: req.headers['x-user-role'] || 'DISASTER_COORDINATOR',
      name: req.headers['x-user-name'] || 'Duty Officer',
    };

    const approved = await communicationService.approveAiDraft(req.params.id, approver, {
      editedTitle: req.body.editedTitle,
      editedBody: req.body.editedBody,
      approvalNotes: req.body.approvalNotes,
    });

    res.json({
      success: true,
      alert: approved,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /communications/alerts/:id/reject
 * Official rejection of an alert draft.
 */
communicationRouter.post('/alerts/:id/reject', async (req, res) => {
  try {
    const rejector = req.body.rejector || {
      id: req.headers['x-user-id'] || 'official-1',
      role: req.headers['x-user-role'] || 'DISASTER_COORDINATOR',
    };

    const rejected = await communicationService.rejectAiDraft(
      req.params.id,
      rejector,
      req.body.reason
    );

    res.json({
      success: true,
      alert: rejected,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /communications/alerts/:id/publish
 * Publishes an approved alert. Fails if AI draft has not been reviewed by a human official.
 */
communicationRouter.post('/alerts/:id/publish', async (req, res) => {
  try {
    const actor = req.body.actor || {
      id: req.headers['x-user-id'] || 'dispatcher-1',
      role: req.headers['x-user-role'] || 'EMERGENCY_DISPATCHER',
    };

    const published = await communicationService.publishAlert(req.params.id, actor);

    res.json({
      success: true,
      alert: published,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /communications/alerts
 * Lists communication alerts with filtering.
 */
communicationRouter.get('/alerts', async (req, res) => {
  try {
    const alerts = await communicationService.listAlerts(req.query);
    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /communications/alerts/:id
 * Retrieves a single communication alert.
 */
communicationRouter.get('/alerts/:id', async (req, res) => {
  try {
    const alert = await communicationService.getAlertById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert '${req.params.id}' not found.`,
      });
    }

    res.json({
      success: true,
      alert,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});
