/**
 * Phase 53: Asset Intelligence Dashboard Frontend Types & Constants
 */

export const ASSET_INTELLIGENCE_DISCLAIMER =
  'AI Predictive Maintenance Advisory • Decision Support Only. Risk scores and failure indicators are non-causal ' +
  'projections intended to assist municipal engineers in prioritizing physical site inspections. ' +
  'Final maintenance determination rests with authorized department officials.';

export const ASSET_TYPE_LABELS = {
  ROAD_SEGMENT: 'Road Segment',
  STREETLIGHT: 'Streetlight',
  ELECTRICAL_TRANSFORMER: 'Transformer',
  DRAINAGE_CULVERT: 'Drainage Culvert',
  STORM_DRAIN: 'Storm Drain',
  WATER_PIPELINE: 'Water Pipeline',
  WATER_VALVE: 'Water Valve',
  COMMUNITY_TOILET: 'Community Toilet',
  WASTE_STATION: 'Waste Station',
  TRAFFIC_SIGNAL: 'Traffic Signal',
  PARK_INFRASTRUCTURE: 'Park Infrastructure',
  OTHER: 'Other Infrastructure',
};

export const REASON_CODE_LABELS = {
  HIGH_FAILURE_FREQUENCY: 'High Failure Frequency',
  CHRONIC_RECURRENCE: 'Chronic Recurrence',
  EXCEEDED_DESIGN_LIFESPAN: 'Exceeded Design Lifespan',
  MAINTENANCE_OVERDUE: 'Maintenance Overdue',
  RAPID_CONDITION_DEGRADATION: 'Rapid Degradation',
  ELEVATED_DOWNTIME: 'Elevated Downtime',
  HEALTHY_OPERATIONAL_BASELINE: 'Healthy Baseline',
};

export const REASON_CODE_BADGES = {
  HIGH_FAILURE_FREQUENCY: 'bg-red-500/10 text-red-600 border-red-500/30',
  CHRONIC_RECURRENCE: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  EXCEEDED_DESIGN_LIFESPAN: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  MAINTENANCE_OVERDUE: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  RAPID_CONDITION_DEGRADATION: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  ELEVATED_DOWNTIME: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  HEALTHY_OPERATIONAL_BASELINE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

export const RISK_LEVEL_BADGES = {
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  LOW: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

export const ACTION_RECOMMENDATIONS = {
  MAINTENANCE_REVIEW_RECOMMENDED: 'Maintenance Review Recommended',
  ROUTINE_MONITORING: 'Routine Monitoring',
};
