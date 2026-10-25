/**
 * Operational Reports & Exports Types and Constants
 * Phase 48: Add Operational Reports and Exports
 */

export const REPORT_TYPES = {
  ISSUES_LIST: 'ISSUES_LIST',
  SLA_PERFORMANCE: 'SLA_PERFORMANCE',
  AUDIT_SUMMARY: 'AUDIT_SUMMARY',
};

export const REPORT_FORMATS = {
  CSV: 'CSV',
  JSON: 'JSON',
};

export const JOB_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export const AUTHORIZED_EXPORT_ROLES = new Set([
  'PLATFORM_SUPER_ADMIN',
  'NATIONAL_ADMIN',
  'STATE_ADMIN',
  'DISTRICT_ULB_ADMIN',
  'DEPARTMENT_OFFICER',
  'DISASTER_COORDINATOR',
  'AUDITOR',
]);

export const REDACTION_NOTICE =
  'All citizen PII, telephone numbers, emails, and personal identifiers have been redacted from this export in compliance with CivIQ Data Protection standards.';
