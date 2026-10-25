/**
 * Phase 46 & 47: Hotspot & Recurring Issue Analytics Frontend Types & Constants
 */

export const ANALYTICAL_DISCLAIMER =
  'Analytical hotspot concentration based on geographic incident density and spatial proximity. ' +
  'Report volume indicates reporting frequency within observation windows and does not establish root causation, ' +
  'infrastructure failure attribution, or official legal fault.';

export const RECURRENCE_DISCLAIMER =
  'Recurring failure patterns indicate elevated incident frequency on physical assets or localized coordinates. ' +
  'Identified candidates require physical municipal engineering inspection and root-cause analysis prior to contractual or structural determination.';

export const HOTSPOT_INTENSITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const MAINTENANCE_URGENCY = {
  URGENT_MAINTENANCE: 'URGENT_MAINTENANCE',
  SCHEDULED_REVIEW: 'SCHEDULED_REVIEW',
  MONITORING: 'MONITORING',
};

export const TREND_DIRECTION = {
  INCREASING: 'INCREASING',
  STABLE: 'STABLE',
  DECREASING: 'DECREASING',
};

export const CATEGORY_LABELS = {
  roads_pothole: 'Roads & Potholes',
  drainage_overflow: 'Drainage & Flooding',
  sanitation_garbage_dump: 'Garbage & Sanitation',
  roads_debris: 'Road Debris & Rubble',
  electricity_streetlight_out: 'Streetlights & Electrical',
  water_pipeline_leak: 'Water Pipeline Leaks',
};
