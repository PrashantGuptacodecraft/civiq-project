/**
 * Disaster Impact Reporting Types & Enumerations
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - Citizen and field worker impact reporting categories
 * - Emergency fast-path initial UNVERIFIED state lifecycle
 * - Binding to active disaster events and geospatial coordinates
 * - Official life-safety emergency handoff constants
 */

export const IMPACT_TYPES = Object.freeze({
  FLOODING_WATERLOGGING: 'FLOODING_WATERLOGGING',
  BLOCKED_ROAD_DEBRIS: 'BLOCKED_ROAD_DEBRIS',
  UTILITY_OUTAGE: 'UTILITY_OUTAGE',
  STRANDED_PERSONS_RESCUE_NEEDED: 'STRANDED_PERSONS_RESCUE_NEEDED',
  STRUCTURAL_INFRASTRUCTURE_DAMAGE: 'STRUCTURAL_INFRASTRUCTURE_DAMAGE',
  URGENT_RELIEF_NEEDS: 'URGENT_RELIEF_NEEDS',
});

export const IMPACT_SEVERITY = Object.freeze({
  CRITICAL_LIFE_SAFETY: 'CRITICAL_LIFE_SAFETY',
  HIGH_URGENT: 'HIGH_URGENT',
  MEDIUM_OPERATIONAL: 'MEDIUM_OPERATIONAL',
  LOW_ADVISORY: 'LOW_ADVISORY',
});

export const IMPACT_STATUS = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  FIELD_TRIAGED: 'FIELD_TRIAGED',
  RESPONDER_DISPATCHED: 'RESPONDER_DISPATCHED',
  RESOLVED: 'RESOLVED',
  REJECTED_FALSE_ALARM: 'REJECTED_FALSE_ALARM',
});

export const REPORTER_TYPE = Object.freeze({
  CITIZEN: 'CITIZEN',
  FIELD_WORKER: 'FIELD_WORKER',
  RESPONDER: 'RESPONDER',
});

export const UTILITY_TYPES = Object.freeze({
  ELECTRICITY_POWER: 'ELECTRICITY_POWER',
  DRINKING_WATER: 'DRINKING_WATER',
  SEWAGE_DRAINAGE: 'SEWAGE_DRAINAGE',
  PIPED_GAS: 'PIPED_GAS',
  TELECOMMUNICATIONS: 'TELECOMMUNICATIONS',
});

export const RELIEF_NEED_TYPES = Object.freeze({
  DRINKING_WATER: 'DRINKING_WATER',
  FOOD_RATIONS: 'FOOD_RATIONS',
  MEDICAL_AID: 'MEDICAL_AID',
  BOAT_EVACUATION: 'BOAT_EVACUATION',
  TARPAULIN_SHELTER: 'TARPAULIN_SHELTER',
});

/**
 * Statutory safety disclaimer per ADR 0002 and docs/phase-execution.md emergency rule.
 */
export const DISASTER_IMPACT_DISCLAIMER =
  'CivIQ Disaster Impact Reporting Notice: Reports submitted here enter the civic coordination system ' +
  'with an initial UNVERIFIED status for immediate municipal awareness. ' +
  'CivIQ is not an official emergency dispatch service. ' +
  'For active life-threatening emergencies, stranded persons, fire, or acute medical distress, ' +
  'immediately contact 112 (National Emergency), 101 (Fire), or 108 (Ambulance).';
