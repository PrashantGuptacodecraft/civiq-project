/**
 * Public Safety Communication Service
 * Phase 60: Add public safety communication templates
 *
 * Implements approved template catalog, parameter validation, mandatory emergency handoffs,
 * and strict Human-In-The-Loop review gates to prevent unreviewed AI text from becoming official public warnings.
 */

import {
  COMMUNICATION_TYPES,
  COMMUNICATION_CHANNELS,
  REVIEW_STATUS,
  PUBLISH_STATUS,
  SEVERITY_LEVEL,
  EMERGENCY_DISCLAIMER_TEXT,
  EMERGENCY_HANDOFF_CONTACTS,
} from './communication.types.js';
import { PRE_APPROVED_TEMPLATES } from './template-catalog.js';

export class UnreviewedAIWarningError extends Error {
  constructor(message) {
    super(
      message ||
        'Safety Policy Violation: Cannot publish public safety communication with unreviewed AI-generated text. An authorized official must review and approve this notice prior to public broadcast.'
    );
    this.name = 'UnreviewedAIWarningError';
    this.statusCode = 403;
  }
}

export class CommunicationService {
  constructor() {
    this.templates = new Map();
    this.alerts = new Map();
    this.auditLogs = [];
    this.init();
  }

  /**
   * Initializes store with curated pre-approved templates.
   */
  init() {
    this.templates.clear();
    this.alerts.clear();
    this.auditLogs = [];

    for (const tpl of PRE_APPROVED_TEMPLATES) {
      this.templates.set(tpl.id, JSON.parse(JSON.stringify(tpl)));
    }
  }

  /**
   * Resets internal store for test isolation.
   */
  reset() {
    this.init();
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Template Catalog
  // ─────────────────────────────────────────────────────────────

  /**
   * Lists available approved templates.
   */
  async listTemplates(filter = {}) {
    let list = Array.from(this.templates.values());

    if (filter.communicationType) {
      list = list.filter((t) => t.communicationType === filter.communicationType);
    }

    if (filter.channel) {
      list = list.filter((t) => t.supportedChannels?.includes(filter.channel));
    }

    return list;
  }

  /**
   * Retrieves a template by ID.
   */
  async getTemplate(id) {
    return this.templates.get(id) || null;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Safe Template Rendering Engine
  // ─────────────────────────────────────────────────────────────

  /**
   * Validates variables and safely renders an approved template.
   * Automatically attaches mandatory emergency disclaimers and helpline handoffs.
   */
  async renderTemplate(templateId, variables = {}, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      const err = new Error(`Template '${templateId}' not found in approved catalog.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Validate required variables
    const missing = [];
    for (const reqVar of template.requiredVariables || []) {
      const val = variables[reqVar];
      if (val === undefined || val === null || String(val).trim() === '') {
        missing.push(reqVar);
      }
    }

    if (missing.length > 0) {
      const err = new Error(
        `Missing required template variable(s): ${missing.join(', ')}. All required variables must be provided.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Select language (default: 'en')
    const lang = options.language || 'en';
    const copy = template.templateCopies[lang] || template.templateCopies.en;

    // 3. Safe string interpolation
    function interpolate(text, vars) {
      let result = text;
      for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        // Sanitize value to prevent template injection
        const cleanVal = String(value).trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
        result = result.replace(regex, cleanVal);
      }
      return result;
    }

    const title = interpolate(copy.title, variables);
    const summary = interpolate(copy.summary, variables);
    const body = interpolate(copy.body, variables);

    const jurisdictionId = options.jurisdictionId || variables.jurisdictionId || 'mh-pune-pmc';
    const severity = options.severity || template.defaultSeverity;
    const channels = options.channels || template.supportedChannels;

    const alertId = `ALERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const rendered = {
      id: alertId,
      templateId,
      templateName: template.name,
      communicationType: template.communicationType,
      severity,
      jurisdictionId,
      language: lang,
      channels,
      title,
      summary,
      body,
      variables,
      emergencyDisclaimer: EMERGENCY_DISCLAIMER_TEXT[lang] || EMERGENCY_DISCLAIMER_TEXT.en,
      emergencyContacts: EMERGENCY_HANDOFF_CONTACTS,
      doNotRelyOnCivIQForImmediateRescue: true,
      isAiDraft: false,
      reviewStatus: REVIEW_STATUS.PRE_APPROVED_TEMPLATE,
      publishStatus: PUBLISH_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
    };

    this.alerts.set(alertId, rendered);
    return rendered;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. AI-Draft Ingestion & Review Governance
  // ─────────────────────────────────────────────────────────────

  /**
   * Submits an AI-generated public safety communication proposal.
   * Explicitly sets reviewStatus to AI_DRAFT_PENDING_REVIEW.
   * CANNOT be published until an authorized human official approves it.
   */
  async createAiDraft(data = {}, options = {}) {
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const body = typeof data.body === 'string' ? data.body.trim() : '';

    if (!title || title.length < 5) {
      const err = new Error('AI draft title must be at least 5 characters long.');
      err.statusCode = 400;
      throw err;
    }

    if (!body || body.length < 10) {
      const err = new Error('AI draft body must be at least 10 characters long.');
      err.statusCode = 400;
      throw err;
    }

    const lang = options.language || data.language || 'en';
    const alertId = `ALERT-AI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const aiDraft = {
      id: alertId,
      templateId: null,
      communicationType: data.communicationType || COMMUNICATION_TYPES.VERIFIED_ISSUE_ALERT,
      severity: data.severity || SEVERITY_LEVEL.WARNING,
      jurisdictionId: data.jurisdictionId || 'mh-pune-pmc',
      language: lang,
      channels: data.channels || [COMMUNICATION_CHANNELS.IN_APP_BANNER],
      title,
      summary: data.summary || title,
      body,
      isAiDraft: true,
      aiModelProvenance: {
        modelIdentifier: options.modelIdentifier || data.modelIdentifier || 'civiq-ai-synthesis-v1',
        promptTokens: options.promptTokens || 0,
        generatedAt: new Date().toISOString(),
      },
      // SAFETY RULE: Unreviewed AI draft CANNOT be published as an official warning
      reviewStatus: REVIEW_STATUS.AI_DRAFT_PENDING_REVIEW,
      publishStatus: PUBLISH_STATUS.DRAFT,
      emergencyDisclaimer: EMERGENCY_DISCLAIMER_TEXT[lang] || EMERGENCY_DISCLAIMER_TEXT.en,
      emergencyContacts: EMERGENCY_HANDOFF_CONTACTS,
      doNotRelyOnCivIQForImmediateRescue: true,
      createdAt: new Date().toISOString(),
    };

    this.alerts.set(alertId, aiDraft);
    return aiDraft;
  }

  /**
   * Human official review and approval of an AI-drafted or pending alert.
   * Allows optional edits to title/body during the review process.
   */
  async approveAiDraft(alertId, approver = {}, options = {}) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      const err = new Error(`Alert '${alertId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const approverRole = approver.roleAssignments?.[0]?.role || approver.role || 'CITIZEN';
    const authorizedRoles = [
      'PLATFORM_SUPER_ADMIN',
      'NATIONAL_ADMIN',
      'STATE_ADMIN',
      'DISTRICT_ULB_ADMIN',
      'DISASTER_COORDINATOR',
      'AGENCY_ADMIN',
      'DEPARTMENT_OFFICER',
      'EMERGENCY_DISPATCHER',
    ];

    if (!authorizedRoles.includes(approverRole)) {
      const err = new Error(
        `Forbidden: Role '${approverRole}' is not authorized to approve official public safety communications.`
      );
      err.statusCode = 403;
      throw err;
    }

    // Apply human edits if provided
    if (options.editedTitle) {
      alert.title = options.editedTitle.trim();
    }
    if (options.editedBody) {
      alert.body = options.editedBody.trim();
    }

    alert.reviewStatus = REVIEW_STATUS.APPROVED_BY_OFFICIAL;
    alert.officialReview = {
      approvedBy: approver.id || approver.userId || 'official-reviewer',
      approverName: approver.name || 'Authorized Official',
      approverRole,
      approvedAt: new Date().toISOString(),
      approvalNotes: options.approvalNotes || 'Reviewed and verified for public dissemination.',
    };

    this.recordAuditLog('ALERT_APPROVED', alert, approver);
    return alert;
  }

  /**
   * Rejects an AI draft or pending alert.
   */
  async rejectAiDraft(alertId, rejector = {}, reason = 'Content rejected by official review') {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      const err = new Error(`Alert '${alertId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    alert.reviewStatus = REVIEW_STATUS.REJECTED_BY_OFFICIAL;
    alert.publishStatus = PUBLISH_STATUS.REVOKED;
    alert.rejectionDetails = {
      rejectedBy: rejector.id || rejector.userId || 'official-reviewer',
      rejectedAt: new Date().toISOString(),
      reason,
    };

    this.recordAuditLog('ALERT_REJECTED', alert, rejector);
    return alert;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Publishing Gate & Safeguards
  // ─────────────────────────────────────────────────────────────

  /**
   * Publishes a public safety communication alert.
   * STRICT SAFETY GATE: Blocks publication if AI text has not been reviewed and approved by a human official.
   */
  async publishAlert(alertId, actor = {}) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      const err = new Error(`Alert '${alertId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // ─── STRICT SAFETY CHECKS ───
    if (alert.reviewStatus === REVIEW_STATUS.REJECTED_BY_OFFICIAL) {
      const err = new Error(`Cannot publish alert '${alertId}' because it was explicitly rejected by official review.`);
      err.statusCode = 400;
      throw err;
    }

    if (alert.isAiDraft && alert.reviewStatus !== REVIEW_STATUS.APPROVED_BY_OFFICIAL) {
      throw new UnreviewedAIWarningError(
        `Safety Violation: Cannot publish alert '${alertId}'. This communication contains unreviewed AI-generated text with status '${alert.reviewStatus}'. Human official review and approval is mandatory before public warning broadcast.`
      );
    }

    alert.publishStatus = PUBLISH_STATUS.PUBLISHED;
    alert.publishedAt = new Date().toISOString();
    alert.publishedBy = {
      id: actor.id || actor.userId || 'system-dispatcher',
      role: actor.role || 'OFFICIAL',
      name: actor.name || 'Dispatcher',
    };

    this.recordAuditLog('ALERT_PUBLISHED', alert, actor);
    return alert;
  }

  /**
   * Retrieves an alert by ID.
   */
  async getAlertById(id) {
    return this.alerts.get(id) || null;
  }

  /**
   * Lists alerts with optional filtering.
   */
  async listAlerts(filter = {}) {
    let list = Array.from(this.alerts.values());

    if (filter.jurisdictionId) {
      list = list.filter((a) => a.jurisdictionId === filter.jurisdictionId);
    }

    if (filter.communicationType) {
      list = list.filter((a) => a.communicationType === filter.communicationType);
    }

    if (filter.publishStatus) {
      list = list.filter((a) => a.publishStatus === filter.publishStatus);
    }

    if (filter.reviewStatus) {
      list = list.filter((a) => a.reviewStatus === filter.reviewStatus);
    }

    return list;
  }

  /**
   * Internal audit log helper.
   */
  recordAuditLog(action, alert, actor) {
    this.auditLogs.push({
      id: `COMM-AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      alertId: alert.id,
      communicationType: alert.communicationType,
      isAiDraft: alert.isAiDraft,
      reviewStatus: alert.reviewStatus,
      actor: {
        id: actor?.id || actor?.userId || 'unknown',
        role: actor?.role || 'UNKNOWN',
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns audit logs for communications.
   */
  getAuditLogs() {
    return [...this.auditLogs];
  }
}

export const communicationService = new CommunicationService();
