/**
 * Operational Reports Redaction & Formatting Utilities
 * Phase 48: Add Operational Reports and Exports
 */

import { redactPiiString } from '../ai-audit/redaction.js';

/**
 * Redacts citizen personal identifiable information (PII) from issue records prior to export.
 */
export function redactIssueForExport(issue) {
  if (!issue) return null;

  return {
    id: issue.id,
    title: redactPiiString(issue.title || ''),
    description: redactPiiString(issue.description || ''),
    categoryId: issue.categoryId || 'general',
    severity: issue.severity || 'MEDIUM',
    status: issue.status || 'SUBMITTED',
    verificationStatus: issue.verificationStatus || 'PENDING',
    latitude: issue.latitude ?? null,
    longitude: issue.longitude ?? null,
    address: redactPiiString(issue.address || ''),
    ward: issue.ward || (issue.jurisdiction && issue.jurisdiction.name) || '',
    jurisdictionId: issue.jurisdictionId || '',
    createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : '',
    updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : '',
    // Strict privacy: Citizen reporter identity is stripped
    reportedBy: '[REDACTED_CITIZEN_PII]',
  };
}

/**
 * Redacts audit log entries before inclusion in export.
 */
export function redactAuditForExport(log) {
  if (!log) return null;

  let detailsStr = '';
  if (typeof log.details === 'object' && log.details !== null) {
    detailsStr = JSON.stringify(log.details);
  } else if (typeof log.details === 'string') {
    detailsStr = log.details;
  }

  return {
    id: log.id,
    action: log.action || 'UNKNOWN',
    entityType: log.entityType || 'UNKNOWN',
    entityId: log.entityId || '',
    actorRole: log.actorRole || 'SYSTEM',
    jurisdictionId: log.jurisdictionId || '',
    timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    details: redactPiiString(detailsStr),
  };
}

/**
 * Formats tabular data as RFC-4180 compliant CSV string with escaping.
 */
export function toCsvString(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));

  return [headerLine, ...rowLines].join('\r\n');
}
