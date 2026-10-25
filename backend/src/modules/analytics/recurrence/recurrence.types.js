/**
 * Recurring Issue Analytics Types & Constants
 * Phase 47: Recurring Issue Intelligence
 */

export const RECURRENCE_THRESHOLDS = {
  MIN_FAILURES_DEFAULT: 2,
  OBSERVATION_WINDOW_DAYS_DEFAULT: 90,
  PROXIMITY_RADIUS_METERS_DEFAULT: 50, // 50m micro-spatial window for unlinked assets
};

export const MAINTENANCE_URGENCY = {
  URGENT_MAINTENANCE: 'URGENT_MAINTENANCE',
  SCHEDULED_REVIEW: 'SCHEDULED_REVIEW',
  MONITORING: 'MONITORING',
};

export const ASSET_TYPES = {
  ROAD_SEGMENT: 'ROAD_SEGMENT',
  ELECTRICAL_INFRA: 'ELECTRICAL_INFRA',
  WATER_NETWORK: 'WATER_NETWORK',
  DRAINAGE_CULVERT: 'DRAINAGE_CULVERT',
  SANITATION_FACILITY: 'SANITATION_FACILITY',
  GENERAL_ASSET: 'GENERAL_ASSET',
};

export const RECURRENCE_DISCLAIMER =
  'Recurring failure patterns indicate elevated incident frequency on physical assets or localized coordinates. ' +
  'Identified candidates require physical municipal engineering inspection and root-cause analysis prior to contractual or structural determination.';
