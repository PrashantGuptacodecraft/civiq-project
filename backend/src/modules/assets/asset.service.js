/**
 * Asset Registry Service
 * Phase 49: Build Asset Registry
 */

import { ASSET_TYPES, ASSET_LIFECYCLE_STATUS } from './asset.types.js';
import { SYNTHETIC_ASSETS } from './asset.fixtures.js';

export class AssetService {
  constructor() {
    this.assets = new Map();
    this.init();
  }

  /**
   * Initializes the in-memory registry with synthetic fixtures.
   */
  init() {
    this.assets.clear();
    for (const fixture of SYNTHETIC_ASSETS) {
      this.assets.set(fixture.id, { ...fixture });
    }
  }

  /**
   * Resets the repository to clean fixture baseline (useful for test isolation).
   */
  reset() {
    this.init();
  }

  /**
   * Retrieves a list of assets matching optional filters.
   */
  async getAssets(query = {}) {
    const {
      assetType,
      lifecycleStatus,
      department,
      jurisdictionId,
      ward,
      search,
      includeDecommissioned = false,
      limit = 50,
      offset = 0,
    } = query;

    let items = Array.from(this.assets.values());

    // Exclude soft-deleted or decommissioned unless explicitly requested
    if (!includeDecommissioned && includeDecommissioned !== 'true') {
      items = items.filter(
        (a) => !a.deletedAt && a.lifecycleStatus !== ASSET_LIFECYCLE_STATUS.DECOMMISSIONED
      );
    }

    if (assetType) {
      items = items.filter((a) => a.assetType === assetType);
    }

    if (lifecycleStatus) {
      items = items.filter((a) => a.lifecycleStatus === lifecycleStatus);
    }

    if (department) {
      items = items.filter((a) => a.department.toLowerCase() === department.toLowerCase());
    }

    if (jurisdictionId) {
      items = items.filter((a) => a.jurisdictionId === jurisdictionId);
    }

    if (ward) {
      items = items.filter((a) => a.ward.toLowerCase().includes(ward.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetTag.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.address && a.address.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

    return {
      assets: paginated,
      total,
      count: paginated.length,
      offset: Number(offset),
      limit: Number(limit),
    };
  }

  /**
   * Retrieves a single asset by ID.
   */
  async getAssetById(id) {
    const asset = this.assets.get(id);
    if (!asset || asset.deletedAt) {
      const err = new Error(`Asset with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }
    return asset;
  }

  /**
   * Creates a new maintainable asset in the registry.
   */
  async createAsset(data) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const err = new Error('Asset name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.assetType || !Object.values(ASSET_TYPES).includes(data.assetType)) {
      const err = new Error(
        `Invalid assetType '${data.assetType}'. Valid types: ${Object.values(ASSET_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    if (!data.department || typeof data.department !== 'string' || !data.department.trim()) {
      const err = new Error('Asset owner department is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.jurisdictionId || typeof data.jurisdictionId !== 'string' || !data.jurisdictionId.trim()) {
      const err = new Error('Asset jurisdictionId is required.');
      err.statusCode = 400;
      throw err;
    }

    const lifecycleStatus = data.lifecycleStatus || ASSET_LIFECYCLE_STATUS.OPERATIONAL;
    if (!Object.values(ASSET_LIFECYCLE_STATUS).includes(lifecycleStatus)) {
      const err = new Error(
        `Invalid lifecycleStatus '${lifecycleStatus}'. Valid statuses: ${Object.values(ASSET_LIFECYCLE_STATUS).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const id = data.id || `ast-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const assetTag = data.assetTag || `AST-${data.assetType.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const conditionScore = typeof data.conditionScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(data.conditionScore)))
      : 100;

    const newAsset = {
      id,
      assetTag,
      name: data.name.trim(),
      description: data.description || '',
      assetType: data.assetType,
      lifecycleStatus,
      conditionScore,
      department: data.department.trim(),
      jurisdictionId: data.jurisdictionId.trim(),
      ward: data.ward || 'Central Jurisdiction',
      address: data.address || '',
      latitude: typeof data.latitude === 'number' ? data.latitude : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
      geometryJson: data.geometryJson || null,
      installationDate: data.installationDate || now,
      lastInspectedAt: data.lastInspectedAt || now,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.assets.set(id, newAsset);
    return newAsset;
  }

  /**
   * Updates an existing asset's attributes, condition, or lifecycle status.
   */
  async updateAsset(id, updates = {}) {
    const existing = await this.getAssetById(id);

    if (updates.assetType && !Object.values(ASSET_TYPES).includes(updates.assetType)) {
      const err = new Error(
        `Invalid assetType '${updates.assetType}'. Valid types: ${Object.values(ASSET_TYPES).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    if (updates.lifecycleStatus && !Object.values(ASSET_LIFECYCLE_STATUS).includes(updates.lifecycleStatus)) {
      const err = new Error(
        `Invalid lifecycleStatus '${updates.lifecycleStatus}'. Valid statuses: ${Object.values(ASSET_LIFECYCLE_STATUS).join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    let conditionScore = existing.conditionScore;
    if (typeof updates.conditionScore === 'number') {
      conditionScore = Math.max(0, Math.min(100, Math.round(updates.conditionScore)));
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // prevent changing ID
      conditionScore,
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(id, updated);
    return updated;
  }

  /**
   * Decommissions / soft-deletes an asset from the active registry.
   */
  async deleteAsset(id) {
    const existing = await this.getAssetById(id);
    const now = new Date().toISOString();

    const decommissioned = {
      ...existing,
      lifecycleStatus: ASSET_LIFECYCLE_STATUS.DECOMMISSIONED,
      deletedAt: now,
      updatedAt: now,
    };

    this.assets.set(id, decommissioned);
    return {
      success: true,
      message: `Asset '${id}' decommissioned and removed from active registry.`,
    };
  }

  /**
   * Computes asset registry metrics and summaries.
   */
  async getAssetStats(jurisdictionId = null) {
    let items = Array.from(this.assets.values()).filter((a) => !a.deletedAt);

    if (jurisdictionId) {
      items = items.filter((a) => a.jurisdictionId === jurisdictionId);
    }

    const byType = {};
    for (const type of Object.values(ASSET_TYPES)) {
      byType[type] = 0;
    }

    const byStatus = {};
    for (const status of Object.values(ASSET_LIFECYCLE_STATUS)) {
      byStatus[status] = 0;
    }

    let totalCondition = 0;
    for (const item of items) {
      byType[item.assetType] = (byType[item.assetType] || 0) + 1;
      byStatus[item.lifecycleStatus] = (byStatus[item.lifecycleStatus] || 0) + 1;
      totalCondition += item.conditionScore || 0;
    }

    const total = items.length;
    const avgCondition = total > 0 ? Math.round(totalCondition / total) : 0;

    return {
      totalAssets: total,
      averageConditionScore: avgCondition,
      byType,
      byStatus,
      jurisdictionId: jurisdictionId || 'ALL',
    };
  }
}

export const assetService = new AssetService();
