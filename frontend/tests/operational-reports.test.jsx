/**
 * Phase 48 Frontend Tests: Operational Reports & Exports Component Tests
 * Validates export dialog rendering, report catalog selection,
 * mandatory privacy redaction notices, and dashboard export integration.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ExportModal,
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  REDACTION_NOTICE,
  MOCK_REPORT_HISTORY,
} from '../features/operational-reports/index.js';
import { CommandDashboard } from '../features/dashboard/index.js';

describe('Phase 48: Operational Reports and Exports Frontend Tests', () => {
  describe('ExportModal Component', () => {
    it('renders export dialog with report types, format options, and scope badge', () => {
      const html = renderToStaticMarkup(
        <ExportModal
          isOpen={true}
          onClose={() => {}}
          jurisdictionId="mh-pune-pmc"
        />
      );

      // Dialog title & Scope
      expect(html).toContain('Export Operational Reports');
      expect(html).toContain('mh-pune-pmc');

      // Report types
      expect(html).toContain('Jurisdiction Issues Inventory');
      expect(html).toContain('Department SLA Compliance');
      expect(html).toContain('Privileged Actions');

      // Formats
      expect(html).toContain('CSV (Spreadsheet)');
      expect(html).toContain('JSON (Structured Data)');

      // Mandatory Data Protection & Redaction Notice
      expect(html).toContain('Privacy &amp; Data Protection Notice');
      expect(html).toContain(REDACTION_NOTICE);

      // Actions
      expect(html).toContain('Generate Export');
      expect(html).toContain('Cancel');
    });

    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <ExportModal isOpen={false} onClose={() => {}} />
      );
      expect(html).toBe('');
    });
  });

  describe('CommandDashboard Integration', () => {
    it('renders Export Reports button in executive dashboard header', () => {
      const html = renderToStaticMarkup(<CommandDashboard />);
      expect(html).toContain('Export Reports');
      expect(html).toContain('Authority Access Level: Executive Official');
    });
  });
});
