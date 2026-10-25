/**
 * Synthetic Mock Data for Operational Reports
 * Phase 48: Add Operational Reports and Exports
 */

import { REDACTION_NOTICE } from './types.js';

export const MOCK_REPORT_HISTORY = [
  {
    jobId: 'rep-job-1730001',
    reportType: 'ISSUES_LIST',
    format: 'CSV',
    fileName: 'civiq-issues-mh-pune-pmc-2026-10-25.csv',
    recordCount: 142,
    status: 'COMPLETED',
    createdAt: '2026-10-25T10:15:00Z',
    completedAt: '2026-10-25T10:15:04Z',
    disclaimer: REDACTION_NOTICE,
  },
  {
    jobId: 'rep-job-1730002',
    reportType: 'SLA_PERFORMANCE',
    format: 'JSON',
    fileName: 'civiq-sla-performance-mh-pune-pmc-2026-10-25.json',
    recordCount: 8,
    status: 'COMPLETED',
    createdAt: '2026-10-25T11:30:00Z',
    completedAt: '2026-10-25T11:30:02Z',
    disclaimer: REDACTION_NOTICE,
  },
];
