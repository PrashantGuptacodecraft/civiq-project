/**
 * Disaster Operations & Situation Room Types & Enumerations
 * Phase 66: Build disaster situation room and after-action review
 *
 * Implements:
 * - Event command dashboard data models
 * - Response task lifecycle (Dispatched, En Route, On Scene, Completed)
 * - Blocked routes & impact cluster models
 * - After-Action Review (AAR) structure & source provenance labels
 * - Sovereign coordination disclaimer per ADR 0002
 */

export const RESPONSE_TASK_TYPES = Object.freeze({
  RESCUE_EVACUATION: 'RESCUE_EVACUATION',
  DEWATERING_PUMPING: 'DEWATERING_PUMPING',
  DEBRIS_ROAD_CLEARANCE: 'DEBRIS_ROAD_CLEARANCE',
  FOOD_WATER_RELIEF: 'FOOD_WATER_RELIEF',
  MEDICAL_AID_TRIAGE: 'MEDICAL_AID_TRIAGE',
  SHELTER_ACCOMMODATION: 'SHELTER_ACCOMMODATION',
  UTILITY_RESTORATION: 'UTILITY_RESTORATION',
});

export const TASK_STATUS = Object.freeze({
  DISPATCHED: 'DISPATCHED',
  EN_ROUTE: 'EN_ROUTE',
  ON_SCENE: 'ON_SCENE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const TASK_PRIORITY = Object.freeze({
  CRITICAL_P0: 'CRITICAL_P0',
  HIGH_P1: 'HIGH_P1',
  MEDIUM_P2: 'MEDIUM_P2',
  LOW_P3: 'LOW_P3',
});

export const AAR_SOURCE_LABELS = Object.freeze({
  SACHET_NDMA_ALERT: '[SOURCE: SACHET_NDMA_ALERT]',
  IMD_WEATHER_RADAR: '[SOURCE: IMD_WEATHER_RADAR]',
  CWC_HYDROLOGY_DATA: '[SOURCE: CWC_HYDROLOGY_DATA]',
  FIELD_INSPECTION: '[SOURCE: FIELD_INSPECTION]',
  CITIZEN_VERIFIED_REPORT: '[SOURCE: CITIZEN_VERIFIED_REPORT]',
  MUNICIPAL_DISPATCH_RECORD: '[SOURCE: MUNICIPAL_DISPATCH_RECORD]',
  AI_DRAFT: '[AI_DRAFT: NON_AUTHORITATIVE]',
});

export const AAR_STATUS = Object.freeze({
  DRAFT_AI_ASSISTED: 'DRAFT_AI_ASSISTED',
  UNDER_COORDINATOR_REVIEW: 'UNDER_COORDINATOR_REVIEW',
  APPROVED_PUBLISHED: 'APPROVED_PUBLISHED',
  ARCHIVED: 'ARCHIVED',
});

export const DISASTER_OPS_DISCLAIMER =
  'CivIQ Disaster Situation Room Notice: This event command dashboard aggregates municipal alerts, ' +
  'field impact clusters, blocked routes, and resource allocations for operational coordination. ' +
  'Pursuant to the Disaster Management Act, 2005, sovereign emergency declarations and ' +
  'authoritative directives by the National Disaster Management Authority (NDMA) and ' +
  'District Disaster Management Authority (DDMA) maintain absolute legal and operational precedence. ' +
  'AI-assisted summaries and recommendations are non-authoritative advisory aids.';
