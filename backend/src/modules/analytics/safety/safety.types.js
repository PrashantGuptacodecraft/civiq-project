/**
 * Road-Safety Correlation Analytics Types and Constants
 * Phase 57: Add road-safety correlation analytics
 */

/**
 * Mandatory analytical disclaimer.
 * Explicitly frames safety analytics as statistical correlation, NOT causality.
 */
export const SAFETY_CORRELATION_DISCLAIMER =
  'Statistical spatial-temporal correlation only. Co-location of municipal infrastructure defects ' +
  '(such as potholes, lighting failures, surface depressions, or drainage issues) with accident clusters ' +
  'indicates spatial-temporal association, NOT causal proof, infrastructure defect attribution, or official driver fault. ' +
  'Physical site inspection and forensic engineering analysis by qualified road safety authorities is required.';

export const INVESTIGATION_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  NONE: 'NONE',
};

export const CORRELATION_LEVELS = {
  HIGH: 'HIGH',             // score >= 0.75
  MODERATE: 'MODERATE',     // 0.50 <= score < 0.75
  LOW: 'LOW',               // 0.25 <= score < 0.50
  NEGLIGIBLE: 'NEGLIGIBLE', // score < 0.25
};

export const DEFAULT_CORRELATION_RADIUS_KM = 0.25; // 250 meters default spatial radius
export const DEFAULT_LOOKBACK_DAYS = 90;           // 90 days default temporal window
export const INVESTIGATION_THRESHOLD_SCORE = 0.60; // Score >= 0.60 produces "investigation recommended"

export const INFRASTRUCTURE_FACTOR_WEIGHTS = {
  ROADS_POTHOLE: 1.35,
  ROADS_SURFACE_DAMAGE: 1.30,
  LIGHTING_STREETLIGHT_OUT: 1.25,
  LIGHTING_DARK_SPOT: 1.25,
  DRAINAGE_WATERLOGGING: 1.30,
  DRAINAGE_MANHOLE_OPEN: 1.40,
  TRAFFIC_SIGNAL_FAILURE: 1.35,
  GENERAL_DEFECT: 1.0,
};
