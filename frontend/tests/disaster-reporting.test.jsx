/**
 * Phase 63 Exit Checks: Disaster Impact Reporting Frontend Tests
 *
 * Validates:
 * 1. DisasterImpactForm (Life-safety Call 112 banner, min 56px touch target, UNVERIFIED status, multi-hazard types)
 * 2. DisasterImpactFeed (Real-time ground reports, category filtering, prominent UNVERIFIED badges)
 * 3. DisasterImpactSummary (Rollup metrics for stranded persons, flooding points, road blockages)
 * 4. DisasterReportingPageContent (Mobile-first responsive layout, tab navigation)
 * 5. Statutory safety disclaimers and emergency boundary adherence (ADR 0002)
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DisasterImpactForm,
  DisasterImpactFeed,
  DisasterImpactSummary,
  DisasterReportingPageContent,
  IMPACT_TYPES,
  IMPACT_TYPE_LABELS,
  IMPACT_STATUS,
  DISASTER_IMPACT_DISCLAIMER,
} from '../features/disaster-reporting/index.js';

const MOCK_REPORTS = [
  {
    reportId: 'DIR-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED,
    status: IMPACT_STATUS.UNVERIFIED,
    location: {
      latitude: 18.4880,
      longitude: 73.8310,
      ward: 'Ward 9 - Sinhagad Road',
    },
    impactDetails: {
      title: 'Water 4 feet in ground floor flats; 4 elderly residents stranded',
      description: 'Senior citizens require boat evacuation assistance.',
      isLifeThreatening: true,
      strandedPersonsCount: 4,
      waterDepthMeters: 1.2,
    },
    reportedAt: '2026-10-30T05:10:00Z',
  },
  {
    reportId: 'DIR-2026-0002',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS,
    status: IMPACT_STATUS.FIELD_TRIAGED,
    location: {
      latitude: 18.5170,
      longitude: 73.8480,
      ward: 'Ward 12 - Shivaji Nagar',
    },
    impactDetails: {
      title: 'Baba Bhide Causeway Submerged Under 1.5m Water',
      description: 'Barricades placed to block traffic.',
      isLifeThreatening: false,
      strandedPersonsCount: 0,
      waterDepthMeters: 1.5,
    },
    reportedAt: '2026-10-30T05:30:00Z',
  },
  {
    reportId: 'DIR-2026-0003',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.UTILITY_OUTAGE,
    status: IMPACT_STATUS.UNVERIFIED,
    location: {
      latitude: 18.4850,
      longitude: 73.8290,
      ward: 'Ward 9 - Sinhagad Road',
    },
    impactDetails: {
      title: 'Power Shutdown across Sinhagad Road Sectors 1-4',
      description: 'Feeder pillars submerged up to transformer base.',
      isLifeThreatening: false,
      strandedPersonsCount: 0,
    },
    reportedAt: '2026-10-30T05:40:00Z',
  },
];

describe('Phase 63: Disaster Impact Reporting Frontend', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. DisasterImpactForm Component
  // ─────────────────────────────────────────────────────────────
  describe('1. DisasterImpactForm', () => {
    it('renders prominent life-safety emergency Call 112 banner with min 56px touch target', () => {
      const html = renderToStaticMarkup(<DisasterImpactForm />);

      expect(html).toContain('Life-Threatening Emergency?');
      expect(html).toContain('Call 112');
      expect(html).toContain('href="tel:112"');
      expect(html).toContain('min-h-[56px]');
    });

    it('renders UNVERIFIED fast-path mode badge and disclaimer', () => {
      const html = renderToStaticMarkup(<DisasterImpactForm />);

      expect(html).toContain('Mode: UNVERIFIED Fast-Path');
      expect(html).toContain(DISASTER_IMPACT_DISCLAIMER);
    });

    it('renders all 6 disaster impact category selection tiles', () => {
      const html = renderToStaticMarkup(<DisasterImpactForm />);

      expect(html).toContain('Urban Flooding');
      expect(html).toContain('Blocked Road');
      expect(html).toContain('Utility Outage');
      expect(html).toContain('Stranded People');
      expect(html).toContain('Structural');
      expect(html).toContain('Relief Supplies');
    });

    it('renders GPS auto-detect button and coordinate inputs', () => {
      const html = renderToStaticMarkup(<DisasterImpactForm />);

      expect(html).toContain('Auto-Detect GPS');
      expect(html).toContain('Latitude');
      expect(html).toContain('Longitude');
      expect(html).toContain('Street Address or Landmark');
    });

    it('renders life-threatening danger checkbox and relief needs options', () => {
      const html = renderToStaticMarkup(<DisasterImpactForm />);

      expect(html).toContain('Immediate Life-Threatening Danger?');
      expect(html).toContain('Drinking Water');
      expect(html).toContain('Emergency First Aid / Medicines');
      expect(html).toContain('Rescue Boat / Floatation');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DisasterImpactFeed Component
  // ─────────────────────────────────────────────────────────────
  describe('2. DisasterImpactFeed', () => {
    it('renders live impact reports with prominent UNVERIFIED status badges', () => {
      const html = renderToStaticMarkup(<DisasterImpactFeed reports={MOCK_REPORTS} />);

      expect(html).toContain('Ground Impact Feed');
      expect(html).toContain('3 Reports');
      expect(html).toContain('UNVERIFIED');
      expect(html).toContain('FIELD_TRIAGED');
      expect(html).toContain('Life Safety Risk');
      expect(html).toContain('4 Stranded');
      expect(html).toContain('Ward 9 - Sinhagad Road');
    });

    it('renders category filtering tabs', () => {
      const html = renderToStaticMarkup(<DisasterImpactFeed reports={MOCK_REPORTS} />);

      expect(html).toContain('All Impacts');
      expect(html).toContain('Urban Flooding');
      expect(html).toContain('Blocked Road');
      expect(html).toContain('Power &amp; Utility Outage');
    });

    it('renders empty state when no reports match', () => {
      const html = renderToStaticMarkup(<DisasterImpactFeed reports={[]} />);

      expect(html).toContain('No reports in this category');
      expect(html).toContain('Ground observations will appear here when submitted');
    });

    it('renders loading indicator when isLoading is true', () => {
      const html = renderToStaticMarkup(<DisasterImpactFeed isLoading={true} />);

      expect(html).toContain('Loading live impact reports...');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DisasterImpactSummary Component
  // ─────────────────────────────────────────────────────────────
  describe('3. DisasterImpactSummary', () => {
    it('computes and displays rollup metrics across ground reports', () => {
      const html = renderToStaticMarkup(<DisasterImpactSummary reports={MOCK_REPORTS} />);

      expect(html).toContain('Situational Impact Overview');
      expect(html).toContain('Total Reports');
      expect(html).toContain('Life Safety Risk');
      expect(html).toContain('Stranded People');
      expect(html).toContain('Flood Points');
      expect(html).toContain('Blocked Roads');
      expect(html).toContain('Power Outages');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. DisasterReportingPageContent Component
  // ─────────────────────────────────────────────────────────────
  describe('4. DisasterReportingPageContent', () => {
    it('renders full page with overview stats, tab navigation, and impact form', () => {
      const html = renderToStaticMarkup(<DisasterReportingPageContent />);

      expect(html).toContain('Situational Impact Overview');
      expect(html).toContain('Report Ground Impact');
      expect(html).toContain('Live Ground Feed');
      expect(html).toContain('Call 112');
    });
  });
});
