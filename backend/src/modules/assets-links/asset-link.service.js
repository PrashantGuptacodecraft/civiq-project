/**
 * Asset Link Service
 * Phase 50: Link Issues to Assets
 */

import { prisma } from '@civiq/db';
import { assetService } from '../assets/asset.service.js';
import { SYNTHETIC_HOTSPOT_ISSUES } from '../analytics/hotspots/hotspot.fixtures.js';
import {
  LINK_METHODS,
  LINK_STATUS,
  LINK_HISTORY_ACTIONS,
  CONFIRMED_VERIFICATION_STATUSES,
} from './asset-link.types.js';
import {
  findNearestAssetCandidates,
  haversineDistanceMeters,
} from './asset-link.spatial.js';

export class AssetLinkService {
  constructor() {
    this.links = new Map();
    this.history = [];
    this.mockIssues = new Map();
    this.init();
  }

  /**
   * Initializes mock issue lookup and seed links
   */
  init() {
    this.links.clear();
    this.history = [];
    this.mockIssues.clear();

    // Seed mock issues from synthetic hotspot fixtures
    for (const issue of SYNTHETIC_HOTSPOT_ISSUES) {
      this.mockIssues.set(issue.id, { ...issue });
    }
  }

  /**
   * Resets the store for test isolation
   */
  reset() {
    this.init();
  }

  /**
   * Allows tests or pipelines to inject or mock an issue record
   */
  registerMockIssue(issue) {
    if (issue && issue.id) {
      this.mockIssues.set(issue.id, { ...issue });
    }
  }

  /**
   * Resolves an issue from the database or mock registry
   */
  async resolveIssue(issueId) {
    if (!issueId) {
      const err = new Error('Issue ID is required.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Check in-memory / mock issues
    if (this.mockIssues.has(issueId)) {
      return this.mockIssues.get(issueId);
    }

    // 2. Query Prisma database
    try {
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { jurisdiction: true },
      });
      if (issue) {
        return issue;
      }
    } catch {
      // Prisma not connected or mocked
    }

    const err = new Error(`Issue '${issueId}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  /**
   * Validates whether an issue is confirmed/verified.
   * Unconfirmed, rejected, or duplicate issues cannot be linked to maintainable assets.
   */
  validateIssueIsConfirmed(issue) {
    const vStatus = issue.verificationStatus || 'VERIFIED';
    if (!CONFIRMED_VERIFICATION_STATUSES.includes(vStatus)) {
      const err = new Error(
        `Cannot link unconfirmed issue '${issue.id}' (verificationStatus: '${vStatus}'). Only confirmed/verified issues may be linked to registry assets.`
      );
      err.statusCode = 400;
      throw err;
    }
    return true;
  }

  /**
   * Suggests nearest asset candidates for a confirmed issue based on spatial proximity
   * and category affinity.
   */
  async getNearestCandidatesForIssue(issueId, options = {}) {
    const issue = await this.resolveIssue(issueId);
    this.validateIssueIsConfirmed(issue);

    if (typeof issue.latitude !== 'number' || typeof issue.longitude !== 'number') {
      const err = new Error(`Issue '${issueId}' lacks valid GPS coordinates for spatial candidate search.`);
      err.statusCode = 400;
      throw err;
    }

    const { assets } = await assetService.getAssets({ limit: 1000 });

    const candidates = findNearestAssetCandidates(
      {
        latitude: issue.latitude,
        longitude: issue.longitude,
        categoryId: issue.categoryId,
        department: issue.department || issue.defaultDepartment,
        jurisdictionId: issue.jurisdictionId,
      },
      assets,
      options
    );

    return {
      issueId: issue.id,
      coordinates: {
        latitude: issue.latitude,
        longitude: issue.longitude,
      },
      candidateCount: candidates.length,
      candidates,
    };
  }

  /**
   * Suggests nearest asset candidates directly by coordinate location
   */
  async getNearestCandidatesByCoordinates(location, options = {}) {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      const err = new Error('Valid latitude and longitude coordinates are required.');
      err.statusCode = 400;
      throw err;
    }

    const { assets } = await assetService.getAssets({ limit: 1000 });

    const candidates = findNearestAssetCandidates(location, assets, options);

    return {
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      candidateCount: candidates.length,
      candidates,
    };
  }

  /**
   * Links a confirmed issue to one or more assets.
   */
  async linkIssueToAssets(params = {}) {
    const {
      issueId,
      assetId,
      assetIds: rawAssetIds,
      confidence: requestedConfidence,
      linkMethod = LINK_METHODS.MANUAL_OFFICER,
      notes = '',
      user,
    } = params;

    // Normalise asset IDs
    let targetAssetIds = [];
    if (Array.isArray(rawAssetIds) && rawAssetIds.length > 0) {
      targetAssetIds = rawAssetIds;
    } else if (assetId) {
      targetAssetIds = [assetId];
    } else {
      const err = new Error('At least one assetId or assetIds array is required.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve and validate issue is confirmed
    const issue = await this.resolveIssue(issueId);
    this.validateIssueIsConfirmed(issue);

    const now = new Date().toISOString();
    const actorId = user?.userId || user?.id || 'system';
    const actorRole = user?.roleAssignments?.[0]?.role || user?.role || 'SYSTEM';

    const createdLinks = [];

    // 2. Validate and process each target asset
    for (const aId of targetAssetIds) {
      const asset = await assetService.getAssetById(aId);

      // Check if active link already exists between this issue and asset
      let existingLink = Array.from(this.links.values()).find(
        (l) => l.issueId === issueId && l.assetId === aId && l.status === LINK_STATUS.ACTIVE
      );

      // Compute or fallback confidence
      let confidence = requestedConfidence;
      if (typeof confidence !== 'number') {
        if (
          typeof issue.latitude === 'number' &&
          typeof issue.longitude === 'number' &&
          typeof asset.latitude === 'number' &&
          typeof asset.longitude === 'number'
        ) {
          const dist = haversineDistanceMeters(
            issue.latitude,
            issue.longitude,
            asset.latitude,
            asset.longitude
          );
          if (dist <= 25) confidence = 0.95;
          else if (dist <= 75) confidence = 0.85;
          else if (dist <= 200) confidence = 0.70;
          else confidence = 0.50;
        } else {
          confidence = 0.80; // Manual confirmation baseline
        }
      }

      confidence = Math.min(1.0, Math.max(0.0, Number(confidence.toFixed(2))));

      if (existingLink) {
        // Update existing link
        const prevConfidence = existingLink.confidence;
        existingLink.confidence = confidence;
        existingLink.notes = notes || existingLink.notes;
        existingLink.updatedAt = now;

        // Record history
        this.history.push({
          id: `ash-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          linkId: existingLink.id,
          issueId,
          assetId: aId,
          action: LINK_HISTORY_ACTIONS.CONFIDENCE_UPDATED,
          actorId,
          actorRole,
          previousConfidence: prevConfidence,
          newConfidence: confidence,
          reason: notes || 'Updated link confidence',
          timestamp: now,
        });

        createdLinks.push({ ...existingLink, asset });
      } else {
        // Create new link
        const linkId = `asl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        const newLink = {
          id: linkId,
          issueId,
          assetId: aId,
          confidence,
          linkMethod,
          status: LINK_STATUS.ACTIVE,
          notes,
          linkedBy: actorId,
          linkedAt: now,
          updatedAt: now,
          unlinkedBy: null,
          unlinkedAt: null,
        };

        this.links.set(linkId, newLink);

        // Record creation history
        this.history.push({
          id: `ash-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          linkId,
          issueId,
          assetId: aId,
          action: LINK_HISTORY_ACTIONS.LINKED,
          actorId,
          actorRole,
          previousConfidence: null,
          newConfidence: confidence,
          reason: notes || `Linked issue to asset ${asset.assetTag} via ${linkMethod}`,
          timestamp: now,
        });

        createdLinks.push({ ...newLink, asset });
      }
    }

    return createdLinks;
  }

  /**
   * Deactivates / unlinks an issue from an asset with audit history.
   */
  async unlinkIssueFromAsset(linkId, params = {}) {
    const { user, reason = 'Unlinked by authority action' } = params;

    const link = this.links.get(linkId);
    if (!link || link.status !== LINK_STATUS.ACTIVE) {
      const err = new Error(`Active asset link with ID '${linkId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const actorId = user?.userId || user?.id || 'system';
    const actorRole = user?.roleAssignments?.[0]?.role || user?.role || 'SYSTEM';

    link.status = LINK_STATUS.UNLINKED;
    link.unlinkedAt = now;
    link.unlinkedBy = actorId;
    link.updatedAt = now;

    this.history.push({
      id: `ash-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      linkId,
      issueId: link.issueId,
      assetId: link.assetId,
      action: LINK_HISTORY_ACTIONS.UNLINKED,
      actorId,
      actorRole,
      previousConfidence: link.confidence,
      newConfidence: null,
      reason,
      timestamp: now,
    });

    return {
      success: true,
      message: `Asset link '${linkId}' successfully unlinked.`,
      unlinkedAt: now,
    };
  }

  /**
   * Retrieves all assets linked to an issue.
   */
  async getLinksForIssue(issueId, options = {}) {
    const { includeUnlinked = false } = options;

    let links = Array.from(this.links.values()).filter((l) => l.issueId === issueId);
    if (!includeUnlinked) {
      links = links.filter((l) => l.status === LINK_STATUS.ACTIVE);
    }

    const enriched = [];
    for (const link of links) {
      let asset = null;
      try {
        asset = await assetService.getAssetById(link.assetId);
      } catch {
        // Asset might have been removed
      }
      enriched.push({
        ...link,
        asset,
      });
    }

    return {
      issueId,
      count: enriched.length,
      links: enriched,
    };
  }

  /**
   * Retrieves all issues linked to an asset.
   */
  async getLinksForAsset(assetId, options = {}) {
    const { includeUnlinked = false } = options;

    let links = Array.from(this.links.values()).filter((l) => l.assetId === assetId);
    if (!includeUnlinked) {
      links = links.filter((l) => l.status === LINK_STATUS.ACTIVE);
    }

    const enriched = [];
    for (const link of links) {
      let issue = null;
      try {
        issue = await this.resolveIssue(link.issueId);
      } catch {
        // Issue not found
      }
      enriched.push({
        ...link,
        issue,
      });
    }

    return {
      assetId,
      count: enriched.length,
      links: enriched,
    };
  }

  /**
   * Retrieves audit and change history for an issue or link.
   */
  async getLinkHistory(query = {}) {
    const { issueId, assetId, linkId } = query;

    let historyRecords = [...this.history];

    if (linkId) {
      historyRecords = historyRecords.filter((h) => h.linkId === linkId);
    }
    if (issueId) {
      historyRecords = historyRecords.filter((h) => h.issueId === issueId);
    }
    if (assetId) {
      historyRecords = historyRecords.filter((h) => h.assetId === assetId);
    }

    // Sort by timestamp descending
    historyRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      total: historyRecords.length,
      history: historyRecords,
    };
  }
}

export const assetLinkService = new AssetLinkService();
