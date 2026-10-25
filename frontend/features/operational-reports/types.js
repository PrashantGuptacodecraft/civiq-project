/**
 * Operational Reports & Exports Frontend Types & Constants
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

export const REPORT_TYPE_LABELS = {
  ISSUES_LIST: 'Jurisdiction Issues Inventory',
  SLA_PERFORMANCE: 'Department SLA Compliance & Performance',
  AUDIT_SUMMARY: 'Privileged Actions & Governance Audit',
};

export const REDACTION_NOTICE =
  'All citizen PII, telephone numbers, emails, and personal identifiers have been redacted from this export in compliance with CivIQ Data Protection standards.';
