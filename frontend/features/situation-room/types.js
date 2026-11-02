/**
 * Disaster Situation Room Frontend Types & Enumerations
 * Phase 66: Build disaster situation room and after-action review
 */

export const SITUATION_ROOM_TABS = Object.freeze({
  COMMAND_OVERVIEW: 'COMMAND_OVERVIEW',
  RESPONSE_TASKS: 'RESPONSE_TASKS',
  NEEDS_RESOURCES: 'NEEDS_RESOURCES',
  EVENT_TIMELINE: 'EVENT_TIMELINE',
  AFTER_ACTION_REVIEW: 'AFTER_ACTION_REVIEW',
});

export const TASK_STATUS_CLASSES = Object.freeze({
  DISPATCHED: 'bg-amber-100 text-amber-800 border-amber-300',
  EN_ROUTE: 'bg-blue-100 text-blue-800 border-blue-300',
  ON_SCENE: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
});

export const PRIORITY_BADGE_CLASSES = Object.freeze({
  CRITICAL_P0: 'bg-red-600 text-white animate-pulse',
  HIGH_P1: 'bg-orange-500 text-white',
  MEDIUM_P2: 'bg-yellow-500 text-gray-900',
  LOW_P3: 'bg-slate-500 text-white',
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

export const DISASTER_OPS_DISCLAIMER =
  'CivIQ Disaster Situation Room Notice: Operational matrix and AI-assisted summaries are ' +
  'designed to coordinate municipal resources. Pursuant to the Disaster Management Act, 2005, ' +
  'sovereign declarations and emergency orders by NDMA/DDMA maintain absolute operational precedence. ' +
  'AI summaries are non-authoritative advisory aids.';
