/**
 * Civic Hotspot Analytics Types and Constants
 * Phase 46: Hotspot Analytics
 */

export const DEFAULT_WINDOW_SIZE_KM = 0.5; // 500 meters default spatial window
export const DEFAULT_MIN_INCIDENTS = 3;    // Minimum incidents required to form a hotspot
export const DEFAULT_TIME_WINDOW_DAYS = 30; // Default 30-day temporal observation window

/**
 * Mandatory analytical disclaimer.
 * Explicitly labels analytics as analytical concentration, NOT causal proof.
 */
export const ANALYTICAL_DISCLAIMER =
  'Analytical hotspot concentration based on geographic incident density and spatial proximity. ' +
  'Report volume indicates reporting frequency within observation windows and does not establish root causation, ' +
  'infrastructure failure attribution, or official legal fault.';

export const HOTSPOT_INTENSITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const TREND_DIRECTIONS = {
  INCREASING: 'INCREASING',
  STABLE: 'STABLE',
  DECREASING: 'DECREASING',
};

export const SEVERITY_WEIGHTS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
