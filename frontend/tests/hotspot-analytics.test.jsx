/**
 * Phase 46 Frontend Tests: Hotspot Analytics Component Tests
 * Validates spatial concentration rendering, temporal trend views,
 * drill-down drawers, and mandatory analytical non-causal labeling.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  HotspotAnalytics,
  HotspotCard,
  HotspotDetailDrawer,
  HotspotTrendView,
  RecurrenceView,
  MOCK_HOTSPOTS,
  MOCK_RECURRENCE_CANDIDATES,
  ANALYTICAL_DISCLAIMER,
  RECURRENCE_DISCLAIMER,
} from '../features/analytics/index.js';

describe('Phase 46: Hotspot Analytics Frontend Components', () => {
  describe('HotspotCard Component', () => {
    it('renders name, ward, intensity score, and trend percentage correctly', () => {
      const mockHotspot = MOCK_HOTSPOTS[0];
      const html = renderToStaticMarkup(
        <HotspotCard
          hotspot={mockHotspot}
          isSelected={false}
          onSelect={() => {}}
        />
      );

      expect(html).toContain('Ward 12 - Shivaji Nagar');
      expect(html).toContain('CRITICAL');
      expect(html).toContain('88'); // Intensity score
      expect(html).toContain('6 reports');
      expect(html).toContain('+66.7%'); // Increasing trend
      expect(html).toContain('Examine');
    });

    it('renders decreasing trend with negative percentage', () => {
      const mockHotspot = MOCK_HOTSPOTS[1]; // Kothrud (DECREASING)
      const html = renderToStaticMarkup(
        <HotspotCard
          hotspot={mockHotspot}
          isSelected={true}
          onSelect={() => {}}
        />
      );

      expect(html).toContain('Ward 5 - Kothrud');
      expect(html).toContain('-66.7%');
      expect(html).toContain('HIGH');
    });
  });

  describe('HotspotDetailDrawer Component', () => {
    it('renders constituent incidents and mandatory analytical non-causal disclaimer', () => {
      const mockHotspot = MOCK_HOTSPOTS[0];
      const html = renderToStaticMarkup(
        <HotspotDetailDrawer
          hotspot={mockHotspot}
          onClose={() => {}}
        />
      );

      // Mandatory analytical disclaimer check
      expect(html).toContain('Analytical Observation • Not Causal Proof');
      expect(html).toContain('does not establish root causation');

      // Cluster metrics
      expect(html).toContain('Cluster Intensity');
      expect(html).toContain('Spatial Extent');
      expect(html).toContain('~285m radius');

      // Constituent incidents
      expect(html).toContain('Constituent Incidents (6)');
      expect(html).toContain('Severe crater pothole on FC Road');
      expect(html).toContain('Open storm drain overflowing on road');
    });

    it('returns null when hotspot is not provided', () => {
      const html = renderToStaticMarkup(
        <HotspotDetailDrawer hotspot={null} onClose={() => {}} />
      );
      expect(html).toBe('');
    });
  });

  describe('HotspotTrendView Component', () => {
    it('renders category ranking and emerging hotspots', () => {
      const html = renderToStaticMarkup(
        <HotspotTrendView
          hotspots={MOCK_HOTSPOTS}
          onSelectHotspot={() => {}}
        />
      );

      expect(html).toContain('Issue Category Distribution Across Hotspots');
      expect(html).toContain('Emerging Concentrations (Increasing Velocity)');
      expect(html).toContain('High-Intensity Chronic Concentrations');

      // Emerging item
      expect(html).toContain('+66.7%');
    });
  });

  describe('RecurrenceView Component (Phase 47)', () => {
    it('renders recurring failure candidates, asset details, and actionable recommendations', () => {
      const html = renderToStaticMarkup(
        <RecurrenceView candidates={MOCK_RECURRENCE_CANDIDATES} />
      );

      // Asset tags & Names
      expect(html).toContain('AST-RD-104');
      expect(html).toContain('FC Road Carriageway Km 2.4-2.8');
      expect(html).toContain('AST-EL-402');
      expect(html).toContain('Distribution Transformer TR-402');

      // Urgency badge
      expect(html).toContain('URGENT MAINTENANCE');

      // Recommendations
      expect(html).toContain('Actionable Maintenance Recommendation');
      expect(html).toContain('Subsurface structural investigation recommended');

      // Mandatory analytical disclaimer
      expect(html).toContain('Recurrence Pattern Analysis • Engineering Verification Required');
      expect(html).toContain(RECURRENCE_DISCLAIMER);
    });
  });

  describe('HotspotAnalytics Main Container', () => {
    it('renders header, mandatory analytical callout, KPI cards, and hotspot list', () => {
      const html = renderToStaticMarkup(
        <HotspotAnalytics initialHotspots={MOCK_HOTSPOTS} />
      );

      // Header
      expect(html).toContain('Civic Hotspot Analytics');
      expect(html).toContain('Spatial Intelligence');

      // Mandatory Non-Causal Callout
      expect(html).toContain('Analytical Concentration • Not Causal Proof');
      expect(html).toContain(ANALYTICAL_DISCLAIMER);

      // Summary KPIs
      expect(html).toContain('Detected Hotspots');
      expect(html).toContain('Critical Intensity');
      expect(html).toContain('Emerging Hotspots');
      expect(html).toContain('Dominant Domain');

      // Filters
      expect(html).toContain('Category:');
      expect(html).toContain('Window:');
      expect(html).toContain('Min Reports:');

      // Hotspot cards rendered
      expect(html).toContain('Ward 12 - Shivaji Nagar');
      expect(html).toContain('Ward 5 - Kothrud');
      expect(html).toContain('Ward 18 - Chinchwad');
    });
  });
});
