/**
 * Cost/Benefit Asset Decision Support Types & Constants
 * Phase 54: Add Cost/Benefit Decision Support
 */

export const DECISION_RECOMMENDATIONS = {
  REPLACE_REVIEW_RECOMMENDED: 'REPLACE_REVIEW_RECOMMENDED',
  REHABILITATE_OR_OVERHAUL: 'REHABILITATE_OR_OVERHAUL',
  CONTINUE_MAINTENANCE: 'CONTINUE_MAINTENANCE',
};

export const DECISION_REASON_CODES = {
  THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
  NEAR_THRESHOLD_WARNING: 'NEAR_THRESHOLD_WARNING',
  COST_EFFECTIVE_REPAIRS: 'COST_EFFECTIVE_REPAIRS',
  EXCEEDED_DESIGN_LIFESPAN: 'EXCEEDED_DESIGN_LIFESPAN',
  CHRONIC_FAILURE_COST_ACCELERATION: 'CHRONIC_FAILURE_COST_ACCELERATION',
  SEVERE_CONDITION_WEAR: 'SEVERE_CONDITION_WEAR',
  BUDGET_CAP_EXCEEDED: 'BUDGET_CAP_EXCEEDED',
};

export const DECISION_DISCLAIMER =
  'AI Decision Support Advisory • Non-Authoritative. Cost/benefit indicators and replacement-review ' +
  'recommendations are non-causal projections intended to assist municipal engineers in capital budgeting. ' +
  'Final capital replacement determination rests with authorized municipal finance and engineering directors.';

export const REDACTED_FINANCIAL_VALUE = '[REDACTED]';
