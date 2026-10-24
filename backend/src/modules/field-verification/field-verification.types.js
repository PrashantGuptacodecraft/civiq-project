/**
 * Field Verification & Evidence Chain Types
 */

export const ProofType = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  DURING: 'DURING',
  INSPECTION: 'INSPECTION',
};

export const SupervisorDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
};

export const FieldTaskVerificationStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING_SUPERVISOR_REVIEW: 'PENDING_SUPERVISOR_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
};
