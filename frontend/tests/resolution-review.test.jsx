import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MOCK_PROPOSED_RESOLUTIONS,
  MOCK_QUALITY_METRICS,
  ResolutionReviewCard,
  QualityMetricsWidget,
} from '../features/resolution-review/index.js';

describe('Citizen Resolution Verification & Review (Phase 43)', () => {
  describe('Quality Metrics & Accountability KPI Widget', () => {
    it('renders confirmation rate, reopen rate, and average rating', () => {
      const html = renderToStaticMarkup(<QualityMetricsWidget metrics={MOCK_QUALITY_METRICS} />);
      expect(html).toContain('Citizen Resolution Quality');
      expect(html).toContain('90.3%');
      expect(html).toContain('9.7%');
      expect(html).toContain('4.65');
      expect(html).toContain('124');
    });

    it('renders department performance breakdown', () => {
      const html = renderToStaticMarkup(<QualityMetricsWidget metrics={MOCK_QUALITY_METRICS} />);
      expect(html).toContain('Public Works Department (PWD)');
      expect(html).toContain('91.2% confirmed');
      expect(html).toContain('Delhi Jal Board (DJB)');
    });

    it('returns null when metrics are null', () => {
      const html = renderToStaticMarkup(<QualityMetricsWidget metrics={null} />);
      expect(html).toBe('');
    });
  });

  describe('Resolution Review Card & Before/After Proof Display', () => {
    const mockRes = MOCK_PROPOSED_RESOLUTIONS[0];

    it('renders proposed resolution summary with worker notes and GPS verification', () => {
      const html = renderToStaticMarkup(<ResolutionReviewCard resolution={mockRes} />);
      expect(html).toContain(mockRes.title);
      expect(html).toContain(mockRes.proposedBy);
      expect(html).toContain('Excavated loose debris');
      expect(html).toContain('GPS Site Matched');
      expect(html).toContain('Before Remediation');
      expect(html).toContain('After Remediation');
    });

    it('renders accessible mobile action buttons with >= 44px touch targets', () => {
      const html = renderToStaticMarkup(<ResolutionReviewCard resolution={mockRes} />);
      expect(html).toContain('Yes, Confirm Resolution');
      expect(html).toContain('No, Reopen Issue');
      expect(html).toContain('min-h-[56px]');
    });

    it('renders empty placeholder state when resolution is null', () => {
      const html = renderToStaticMarkup(<ResolutionReviewCard resolution={null} />);
      expect(html).toContain('No Proposed Resolution Selected');
    });
  });
});
