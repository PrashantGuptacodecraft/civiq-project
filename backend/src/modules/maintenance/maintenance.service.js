/**
 * Maintenance History and Financial Tracking Service
 * Phase 51: Add Maintenance History and Cost Tracking
 */

import { assetService } from '../assets/asset.service.js';
import { assetLinkService } from '../assets-links/asset-link.service.js';
import { SYNTHETIC_MAINTENANCE_ACTIONS } from './maintenance.fixtures.js';
import {
  MAINTENANCE_ACTION_TYPES,
  MAINTENANCE_STATUS,
  MAINTENANCE_OUTCOMES,
  FINANCIAL_FIELDS,
  REDACTED_FINANCIAL_VALUE,
} from './maintenance.types.js';

export class MaintenanceService {
  constructor() {
    this.actions = new Map();
    this.financialAudits = [];
    this.init();
  }

  /**
   * Initializes store with synthetic maintenance fixtures.
   */
  init() {
    this.actions.clear();
    this.financialAudits = [];

    for (const fixture of SYNTHETIC_MAINTENANCE_ACTIONS) {
      this.actions.set(fixture.id, { ...fixture });

      // Seed initial financial baseline audit for fixtures
      if (fixture.totalCost > 0) {
        this.financialAudits.push({
          id: `fau-${this.financialAudits.length + 1}`,
          maintenanceId: fixture.id,
          assetId: fixture.assetId,
          actorId: 'system-init',
          actorRole: 'SYSTEM',
          action: 'INITIAL_RECORD',
          field: 'totalCost',
          previousValue: null,
          newValue: fixture.totalCost,
          reason: 'Initial historical maintenance baseline',
          workOrderNumber: fixture.workOrderNumber,
          timestamp: fixture.createdAt,
        });
      }
    }
  }

  /**
   * Resets stores for test isolation.
   */
  reset() {
    this.init();
  }

  /**
   * Helper to redact sensitive financial expenditure fields for non-authorized roles.
   */
  redactFinancialFields(record) {
    const safe = { ...record };
    safe.partsCost = REDACTED_FINANCIAL_VALUE;
    safe.laborCost = REDACTED_FINANCIAL_VALUE;
    safe.contractorCost = REDACTED_FINANCIAL_VALUE;
    safe.totalCost = REDACTED_FINANCIAL_VALUE;
    safe.workOrderNumber = REDACTED_FINANCIAL_VALUE;
    safe.invoiceReference = REDACTED_FINANCIAL_VALUE;
    safe.isFinancialDataRedacted = true;
    return safe;
  }

  /**
   * Records a new maintenance action with parts/labor/contractor costs and downtime.
   */
  async recordMaintenanceAction(data = {}, options = {}) {
    const { user } = options;
    const actorId = user?.userId || user?.id || 'system';
    const actorRole = user?.roleAssignments?.[0]?.role || user?.role || 'SYSTEM';

    if (!data.assetId) {
      const err = new Error('Asset ID (assetId) is required.');
      err.statusCode = 400;
      throw err;
    }

    const asset = await assetService.getAssetById(data.assetId);

    const actionType = data.actionType || MAINTENANCE_ACTION_TYPES.PREVENTIVE_MAINTENANCE;
    if (!Object.values(MAINTENANCE_ACTION_TYPES).includes(actionType)) {
      const err = new Error(
        `Invalid actionType '${actionType}'. Allowed types: ${Object.values(MAINTENANCE_ACTION_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const status = data.status || MAINTENANCE_STATUS.COMPLETED;
    if (!Object.values(MAINTENANCE_STATUS).includes(status)) {
      const err = new Error(
        `Invalid status '${status}'. Allowed statuses: ${Object.values(MAINTENANCE_STATUS).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const outcome = data.outcome || MAINTENANCE_OUTCOMES.RESOLVED;
    if (!Object.values(MAINTENANCE_OUTCOMES).includes(outcome)) {
      const err = new Error(
        `Invalid outcome '${outcome}'. Allowed outcomes: ${Object.values(MAINTENANCE_OUTCOMES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Cost calculations
    const partsCost = Math.max(0, Number(data.partsCost || 0));
    const laborCost = Math.max(0, Number(data.laborCost || 0));
    const contractorCost = Math.max(0, Number(data.contractorCost || 0));
    const totalCost = partsCost + laborCost + contractorCost;

    const downtimeHours = Math.max(0, Number(data.downtimeHours || 0));
    const conditionScoreBefore =
      typeof data.conditionScoreBefore === 'number'
        ? Math.max(0, Math.min(100, data.conditionScoreBefore))
        : asset.conditionScore || 100;
    const conditionScoreAfter =
      typeof data.conditionScoreAfter === 'number'
        ? Math.max(0, Math.min(100, data.conditionScoreAfter))
        : conditionScoreBefore;

    const now = new Date().toISOString();
    const id = data.id || `mnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newAction = {
      id,
      assetId: asset.id,
      actionType,
      status,
      outcome,
      description: data.description || '',
      performedBy: data.performedBy || 'Municipal Maintenance Team',
      startedAt: data.startedAt || now,
      completedAt: status === MAINTENANCE_STATUS.COMPLETED ? data.completedAt || now : null,
      downtimeHours,
      conditionScoreBefore,
      conditionScoreAfter,
      partsCost,
      laborCost,
      contractorCost,
      totalCost,
      currency: data.currency || 'INR',
      workOrderNumber: data.workOrderNumber || `WO-${asset.jurisdictionId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      invoiceReference: data.invoiceReference || null,
      financialYear: data.financialYear || 'FY2026-27',
      linkedIssueIds: Array.isArray(data.linkedIssueIds) ? data.linkedIssueIds : [],
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    this.actions.set(id, newAction);

    // Update asset condition score & last inspected time if condition improved
    if (typeof data.conditionScoreAfter === 'number') {
      const assetUpdates = {
        conditionScore: conditionScoreAfter,
        lastInspectedAt: now,
      };
      // If completed successfully and asset was degraded/under repair, bring back to operational
      if (
        status === MAINTENANCE_STATUS.COMPLETED &&
        outcome === MAINTENANCE_OUTCOMES.RESOLVED &&
        conditionScoreAfter >= 70
      ) {
        assetUpdates.lifecycleStatus = 'OPERATIONAL';
      }
      await assetService.updateAsset(asset.id, assetUpdates);
    }

    // Record auditable financial log
    if (totalCost > 0) {
      this.financialAudits.push({
        id: `fau-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        maintenanceId: id,
        assetId: asset.id,
        actorId,
        actorRole,
        action: 'RECORDED',
        field: 'totalCost',
        previousValue: null,
        newValue: totalCost,
        reason: data.notes || 'Recorded maintenance expenditure',
        workOrderNumber: newAction.workOrderNumber,
        timestamp: now,
      });
    }

    return newAction;
  }

  /**
   * Updates an existing maintenance record with full financial field audit tracking.
   */
  async updateMaintenanceAction(id, updates = {}, options = {}) {
    const existing = this.actions.get(id);
    if (!existing) {
      const err = new Error(`Maintenance record with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { user, reason = 'Administrative update of maintenance record' } = options;
    const actorId = user?.userId || user?.id || 'system';
    const actorRole = user?.roleAssignments?.[0]?.role || user?.role || 'SYSTEM';
    const now = new Date().toISOString();

    // Check financial changes for mandatory audit logging
    const financialChanged = FINANCIAL_FIELDS.some(
      (f) => updates[f] !== undefined && updates[f] !== existing[f]
    );

    if (financialChanged) {
      for (const f of FINANCIAL_FIELDS) {
        if (updates[f] !== undefined && updates[f] !== existing[f]) {
          this.financialAudits.push({
            id: `fau-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            maintenanceId: id,
            assetId: existing.assetId,
            actorId,
            actorRole,
            action: 'UPDATED',
            field: f,
            previousValue: existing[f],
            newValue: updates[f],
            reason,
            workOrderNumber: updates.workOrderNumber || existing.workOrderNumber,
            timestamp: now,
          });
        }
      }
    }

    // Recompute totalCost if parts/labor/contractor changed
    let partsCost = updates.partsCost !== undefined ? Number(updates.partsCost) : existing.partsCost;
    let laborCost = updates.laborCost !== undefined ? Number(updates.laborCost) : existing.laborCost;
    let contractorCost = updates.contractorCost !== undefined ? Number(updates.contractorCost) : existing.contractorCost;
    let totalCost = partsCost + laborCost + contractorCost;

    const updated = {
      ...existing,
      ...updates,
      partsCost,
      laborCost,
      contractorCost,
      totalCost,
      id: existing.id,
      assetId: existing.assetId,
      updatedAt: now,
    };

    this.actions.set(id, updated);
    return updated;
  }

  /**
   * Retrieves single maintenance action by ID with financial field access control.
   */
  async getMaintenanceActionById(id, options = {}) {
    const action = this.actions.get(id);
    if (!action) {
      const err = new Error(`Maintenance record with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { canReadCosts = false } = options;
    if (!canReadCosts) {
      return this.redactFinancialFields(action);
    }
    return action;
  }

  /**
   * Lists maintenance actions matching optional filters.
   */
  async listMaintenanceActions(query = {}, options = {}) {
    const {
      assetId,
      actionType,
      status,
      outcome,
      financialYear,
      limit = 50,
      offset = 0,
    } = query;

    let items = Array.from(this.actions.values());

    if (assetId) {
      items = items.filter((a) => a.assetId === assetId);
    }
    if (actionType) {
      items = items.filter((a) => a.actionType === actionType);
    }
    if (status) {
      items = items.filter((a) => a.status === status);
    }
    if (outcome) {
      items = items.filter((a) => a.outcome === outcome);
    }
    if (financialYear) {
      items = items.filter((a) => a.financialYear === financialYear);
    }

    // Sort by startedAt DESC
    items.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    const total = items.length;
    const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

    const { canReadCosts = false } = options;
    const formatted = canReadCosts
      ? paginated
      : paginated.map((item) => this.redactFinancialFields(item));

    return {
      total,
      count: formatted.length,
      offset: Number(offset),
      limit: Number(limit),
      actions: formatted,
    };
  }

  /**
   * Builds an integrated chronological asset timeline:
   * Combines installation baseline, maintenance events, downtime episodes,
   * linked civic issues & resolutions, and condition score progression.
   */
  async getAssetTimeline(assetId, options = {}) {
    const asset = await assetService.getAssetById(assetId);
    const { canReadCosts = false } = options;

    const timeline = [];
    let totalDowntimeHours = 0;
    let totalExpenditure = 0;
    let maintenanceCount = 0;

    // 1. Initial Installation / Commissioning Baseline Event
    timeline.push({
      id: `evt-install-${asset.id}`,
      eventType: 'ASSET_INSTALLATION',
      title: `Asset Commissioned: ${asset.name}`,
      description: `Asset initially placed into service with tag ${asset.assetTag} under ${asset.department}.`,
      timestamp: asset.installationDate || asset.createdAt,
      conditionScore: 100,
      downtimeHours: 0,
      financialCost: canReadCosts ? 0 : REDACTED_FINANCIAL_VALUE,
      actor: 'Municipal Procurement & Commissioning Cell',
    });

    // 2. Maintenance Actions & Interventions
    const assetActions = Array.from(this.actions.values()).filter((a) => a.assetId === asset.id);

    for (const action of assetActions) {
      maintenanceCount++;
      totalDowntimeHours += action.downtimeHours || 0;
      totalExpenditure += action.totalCost || 0;

      timeline.push({
        id: `evt-maint-${action.id}`,
        eventType: 'MAINTENANCE_ACTION',
        actionType: action.actionType,
        status: action.status,
        outcome: action.outcome,
        title: `${action.actionType.replace(/_/g, ' ')}: ${action.status}`,
        description: action.description,
        timestamp: action.completedAt || action.startedAt,
        conditionScore: action.conditionScoreAfter,
        conditionDelta: action.conditionScoreAfter - action.conditionScoreBefore,
        downtimeHours: action.downtimeHours,
        financialCost: canReadCosts ? action.totalCost : REDACTED_FINANCIAL_VALUE,
        workOrderNumber: canReadCosts ? action.workOrderNumber : REDACTED_FINANCIAL_VALUE,
        performedBy: action.performedBy,
        linkedIssueIds: action.linkedIssueIds,
      });
    }

    // 3. Linked Civic Issues & Complaints
    try {
      const { links } = await assetLinkService.getLinksForAsset(asset.id, { includeUnlinked: true });
      for (const link of links) {
        timeline.push({
          id: `evt-link-${link.id}`,
          eventType: 'CIVIC_ISSUE_LINKED',
          title: `Civic Issue #${link.issueId} Linked (${link.linkMethod})`,
          description: link.issue?.title || `Civic issue linked with match confidence ${link.confidence}`,
          timestamp: link.linkedAt,
          status: link.status,
          linkConfidence: link.confidence,
          actor: link.linkedBy,
        });

        if (link.unlinkedAt) {
          timeline.push({
            id: `evt-unlink-${link.id}`,
            eventType: 'CIVIC_ISSUE_UNLINKED',
            title: `Civic Issue #${link.issueId} Unlinked`,
            description: `Link removed from asset`,
            timestamp: link.unlinkedAt,
            actor: link.unlinkedBy,
          });
        }
      }
    } catch {
      // Fallback
    }

    // Sort complete timeline descending by timestamp (newest events first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      assetId: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      assetType: asset.assetType,
      department: asset.department,
      jurisdictionId: asset.jurisdictionId,
      currentLifecycleStatus: asset.lifecycleStatus,
      currentConditionScore: asset.conditionScore,
      metrics: {
        totalMaintenanceActions: maintenanceCount,
        totalDowntimeHours: Number(totalDowntimeHours.toFixed(1)),
        totalExpenditure: canReadCosts ? totalExpenditure : REDACTED_FINANCIAL_VALUE,
        currency: 'INR',
        isFinancialDataRedacted: !canReadCosts,
      },
      timeline,
    };
  }

  /**
   * Retrieves auditable financial modification log records.
   */
  async getFinancialAudits(query = {}) {
    const { maintenanceId, assetId } = query;

    let records = [...this.financialAudits];
    if (maintenanceId) {
      records = records.filter((r) => r.maintenanceId === maintenanceId);
    }
    if (assetId) {
      records = records.filter((r) => r.assetId === assetId);
    }

    // Sort by timestamp DESC
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      total: records.length,
      audits: records,
    };
  }
}

export const maintenanceService = new MaintenanceService();
