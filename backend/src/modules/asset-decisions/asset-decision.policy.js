/**
 * Category Policy Thresholds for Asset Cost/Benefit Evaluation
 * Phase 54: Add Cost/Benefit Decision Support
 */

export const DEFAULT_CATEGORY_POLICY_THRESHOLDS = {
  ROAD_SEGMENT: {
    assetType: 'ROAD_SEGMENT',
    replacementThresholdRatio: 0.60,
    warningThresholdRatio: 0.40,
    baselineReplacementCostInr: 5000000.0,
    annualRepairBudgetCapInr: 1500000.0,
    description: 'IRC:37 standard arterial/collector road wearing course reconstruction threshold',
  },
  ELECTRICAL_TRANSFORMER: {
    assetType: 'ELECTRICAL_TRANSFORMER',
    replacementThresholdRatio: 0.50,
    warningThresholdRatio: 0.35,
    baselineReplacementCostInr: 1200000.0,
    annualRepairBudgetCapInr: 400000.0,
    description: 'CEA standard distribution transformer rewinding & core replacement ceiling',
  },
  DRAINAGE_CULVERT: {
    assetType: 'DRAINAGE_CULVERT',
    replacementThresholdRatio: 0.65,
    warningThresholdRatio: 0.45,
    baselineReplacementCostInr: 2500000.0,
    annualRepairBudgetCapInr: 700000.0,
    description: 'CPHEEO stormwater cross-drainage structural rehabilitation benchmark',
  },
  STORM_DRAIN: {
    assetType: 'STORM_DRAIN',
    replacementThresholdRatio: 0.65,
    warningThresholdRatio: 0.45,
    baselineReplacementCostInr: 1800000.0,
    annualRepairBudgetCapInr: 500000.0,
    description: 'Storm drain line desilting and civil lining overhaul threshold',
  },
  WATER_PIPELINE: {
    assetType: 'WATER_PIPELINE',
    replacementThresholdRatio: 0.55,
    warningThresholdRatio: 0.35,
    baselineReplacementCostInr: 3500000.0,
    annualRepairBudgetCapInr: 1000000.0,
    description: 'Non-revenue water mitigation & ductile iron trunk line replacement trigger',
  },
  WATER_VALVE: {
    assetType: 'WATER_VALVE',
    replacementThresholdRatio: 0.60,
    warningThresholdRatio: 0.40,
    baselineReplacementCostInr: 300000.0,
    annualRepairBudgetCapInr: 100000.0,
    description: 'Sluice/butterfly pressure regulation valve mechanical life replacement threshold',
  },
  STREETLIGHT: {
    assetType: 'STREETLIGHT',
    replacementThresholdRatio: 0.70,
    warningThresholdRatio: 0.45,
    baselineReplacementCostInr: 80000.0,
    annualRepairBudgetCapInr: 30000.0,
    description: 'Municipal public lighting pole and smart luminaire retrofit threshold',
  },
  COMMUNITY_TOILET: {
    assetType: 'COMMUNITY_TOILET',
    replacementThresholdRatio: 0.55,
    warningThresholdRatio: 0.35,
    baselineReplacementCostInr: 1500000.0,
    annualRepairBudgetCapInr: 400000.0,
    description: 'Swachh Bharat municipal public sanitation facility refurbishment limit',
  },
  WASTE_STATION: {
    assetType: 'WASTE_STATION',
    replacementThresholdRatio: 0.60,
    warningThresholdRatio: 0.40,
    baselineReplacementCostInr: 2000000.0,
    annualRepairBudgetCapInr: 600000.0,
    description: 'Compactor and solid waste intermediate transfer station overhaul threshold',
  },
  TRAFFIC_SIGNAL: {
    assetType: 'TRAFFIC_SIGNAL',
    replacementThresholdRatio: 0.60,
    warningThresholdRatio: 0.40,
    baselineReplacementCostInr: 600000.0,
    annualRepairBudgetCapInr: 180000.0,
    description: 'Automated junction signaling and sensor pole renewal threshold',
  },
  PARK_INFRASTRUCTURE: {
    assetType: 'PARK_INFRASTRUCTURE',
    replacementThresholdRatio: 0.65,
    warningThresholdRatio: 0.45,
    baselineReplacementCostInr: 800000.0,
    annualRepairBudgetCapInr: 250000.0,
    description: 'Public recreation facilities, fencing, and equipment replacement threshold',
  },
  OTHER: {
    assetType: 'OTHER',
    replacementThresholdRatio: 0.60,
    warningThresholdRatio: 0.40,
    baselineReplacementCostInr: 1000000.0,
    annualRepairBudgetCapInr: 300000.0,
    description: 'Default municipal general infrastructure cost-benefit threshold',
  },
};

export class PolicyThresholdManager {
  constructor() {
    this.thresholds = new Map();
    this.init();
  }

  init() {
    this.thresholds.clear();
    for (const [key, val] of Object.entries(DEFAULT_CATEGORY_POLICY_THRESHOLDS)) {
      this.thresholds.set(key, { ...val });
    }
  }

  reset() {
    this.init();
  }

  getThreshold(category = 'OTHER') {
    const normalized = (category || 'OTHER').toUpperCase().trim();
    if (this.thresholds.has(normalized)) {
      return { ...this.thresholds.get(normalized) };
    }
    return { ...this.thresholds.get('OTHER') };
  }

  setThreshold(category, thresholdData = {}) {
    const normalized = (category || 'OTHER').toUpperCase().trim();
    const existing = this.getThreshold(normalized);

    const replacementRatio =
      thresholdData.replacementThresholdRatio !== undefined
        ? Number(thresholdData.replacementThresholdRatio)
        : existing.replacementThresholdRatio;

    const warningRatio =
      thresholdData.warningThresholdRatio !== undefined
        ? Number(thresholdData.warningThresholdRatio)
        : existing.warningThresholdRatio;

    if (replacementRatio < 0.1 || replacementRatio > 1.0) {
      throw new Error('Replacement threshold ratio must be between 0.10 and 1.00');
    }
    if (warningRatio < 0.05 || warningRatio >= replacementRatio) {
      throw new Error('Warning threshold ratio must be between 0.05 and less than replacement threshold ratio');
    }

    const updated = {
      ...existing,
      ...thresholdData,
      assetType: normalized,
      replacementThresholdRatio: replacementRatio,
      warningThresholdRatio: warningRatio,
      baselineReplacementCostInr:
        thresholdData.baselineReplacementCostInr !== undefined
          ? Number(thresholdData.baselineReplacementCostInr)
          : existing.baselineReplacementCostInr,
      annualRepairBudgetCapInr:
        thresholdData.annualRepairBudgetCapInr !== undefined
          ? Number(thresholdData.annualRepairBudgetCapInr)
          : existing.annualRepairBudgetCapInr,
      updatedAt: new Date().toISOString(),
    };

    this.thresholds.set(normalized, updated);
    return { ...updated };
  }

  getAllThresholds() {
    const result = {};
    for (const [key, val] of this.thresholds.entries()) {
      result[key] = { ...val };
    }
    return result;
  }
}

export const policyThresholdManager = new PolicyThresholdManager();
