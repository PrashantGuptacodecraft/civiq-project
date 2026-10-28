/**
 * Phase 53: Asset Intelligence Dashboard & Predictive Maintenance Tests
 * Validates high-recurrence candidate identification, downtime tracking,
 * failure trends, verified citizen proof linking, and timeline drill-downs.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AssetIntelligenceDashboard,
  AssetTimelineDrawer,
  MOCK_ASSET_INTELLIGENCE,
  ASSET_INTELLIGENCE_DISCLAIMER,
  ASSET_TYPE_LABELS,
  REASON_CODE_LABELS,
  RISK_LEVEL_BADGES,
  ACTION_RECOMMENDATIONS,
} from '../features/assets/index.js';

describe('Phase 53: Asset Intelligence & Predictive Maintenance Dashboard', () => {
  describe('Mock Asset Intelligence Data Integrity', () => {
    it('contains valid infrastructure assets with failure, downtime, and risk scores', () => {
      expect(MOCK_ASSET_INTELLIGENCE.length).toBeGreaterThanOrEqual(6);

      MOCK_ASSET_INTELLIGENCE.forEach((asset) => {
        expect(asset.id).toBeDefined();
        expect(asset.assetTag).toMatch(/^AST-[A-Z]+-\d+/);
        expect(asset.name).toBeTruthy();
        expect(asset.assetType).toBeDefined();
        expect(asset.department).toBeTruthy();
        expect(asset.jurisdictionId).toMatch(/^mh-pune-(pmc|pcmc)$/);
        expect(asset.conditionScore).toBeGreaterThanOrEqual(0);
        expect(asset.conditionScore).toBeLessThanOrEqual(100);
        expect(asset.failureCount).toBeGreaterThanOrEqual(0);
        expect(asset.totalDowntimeHours).toBeGreaterThanOrEqual(0);
        expect(asset.riskScore).toBeGreaterThanOrEqual(0);
        expect(asset.riskScore).toBeLessThanOrEqual(1);
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(asset.riskLevel);
        expect(Array.isArray(asset.reasonCodes)).toBe(true);
        expect(Array.isArray(asset.linkedIssues)).toBe(true);
        expect(Array.isArray(asset.timeline)).toBe(true);
      });
    });

    it('identifies critical recurrence candidates with verified citizen proof', () => {
      const roadSegment = MOCK_ASSET_INTELLIGENCE.find((a) => a.id === 'ast-001');
      expect(roadSegment).toBeDefined();
      expect(roadSegment.riskLevel).toBe('CRITICAL');
      expect(roadSegment.failureCount).toBe(6);
      expect(roadSegment.totalDowntimeHours).toBe(24.0);
      expect(roadSegment.reasonCodes).toContain('CHRONIC_RECURRENCE');

      // Verify linked issues with citizen proof
      expect(roadSegment.linkedIssues.length).toBe(2);
      const proofIssue = roadSegment.linkedIssues[0];
      expect(proofIssue.proofPhoto).toBeTruthy();
      expect(proofIssue.proofCaption).toContain('35cm deep pothole cavity');
    });

    it('contains chronological timeline with maintenance work orders and outcomes', () => {
      const transformer = MOCK_ASSET_INTELLIGENCE.find((a) => a.id === 'ast-003');
      expect(transformer).toBeDefined();
      expect(transformer.totalDowntimeHours).toBe(45.0);
      expect(transformer.timeline.length).toBeGreaterThanOrEqual(1);

      const maintEvent = transformer.timeline.find((e) => e.eventType === 'MAINTENANCE_ACTION');
      expect(maintEvent).toBeDefined();
      expect(maintEvent.workOrderNumber).toMatch(/^WO-/);
      expect(maintEvent.downtimeHours).toBeGreaterThan(0);
    });
  });

  describe('AssetIntelligenceDashboard Static Rendering', () => {
    it('renders header, live telemetry status, and mandatory AI advisory disclaimer', () => {
      const html = renderToStaticMarkup(<AssetIntelligenceDashboard />);

      expect(html).toContain('Asset Intelligence &amp; Predictive Maintenance');
      expect(html).toContain('Live Sensor &amp; Civic Telemetry');
      expect(html).toContain('AI Predictive Maintenance Advisory');
      expect(html).toContain('Decision Support');
      expect(html).toContain(ASSET_INTELLIGENCE_DISCLAIMER);
    });

    it('renders top-level KPI metrics correctly', () => {
      const html = renderToStaticMarkup(<AssetIntelligenceDashboard />);

      // Monitored Assets
      expect(html).toContain('data-testid="kpi-total-assets"');
      expect(html).toContain('6');

      // At-Risk Candidates
      expect(html).toContain('data-testid="kpi-critical-count"');
      expect(html).toContain('4'); // ast-001 (CRITICAL), ast-003 (CRITICAL), ast-005 (HIGH), ast-008 (HIGH)

      // Cumulative Downtime (24 + 36 + 45 + 18 + 12 + 4 = 139)
      expect(html).toContain('data-testid="kpi-total-downtime"');
      expect(html).toContain('139');

      // Mean Condition Score
      expect(html).toContain('data-testid="kpi-avg-condition"');
    });

    it('renders high-recurrence candidate cards with condition score and reason codes', () => {
      const html = renderToStaticMarkup(<AssetIntelligenceDashboard />);

      // Candidates
      expect(html).toContain('AST-RD-104');
      expect(html).toContain('FC Road Carriageway Km 2.4-2.8');
      expect(html).toContain('AST-DR-031');
      expect(html).toContain('Box Culvert BC-31 Deccan Gymkhana');
      expect(html).toContain('AST-EL-402');
      expect(html).toContain('Distribution Transformer TR-402 (PCMC)');

      // Badges & Labels
      expect(html).toContain('Chronic Recurrence');
      expect(html).toContain('Elevated Downtime');
      expect(html).toContain('Maintenance Review Recommended');
      expect(html).toContain('linked citizen complaint');

      // Touch targets >= 44px
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('View Timeline &amp; Issues');
    });

    it('renders navigation view tabs and search filter bar', () => {
      const html = renderToStaticMarkup(<AssetIntelligenceDashboard />);

      expect(html).toContain('High-Recurrence Candidates');
      expect(html).toContain('Failure Trends &amp; Breakdown');
      expect(html).toContain('Full Registry Inventory');
      expect(html).toContain('Search by asset tag, name, ward, or department...');
      expect(html).toContain('All Municipalities (Pune Metropolitan)');
    });
  });

  describe('AssetTimelineDrawer Drill-Down Component', () => {
    it('renders asset metadata, condition score, and AI advisory banner', () => {
      const asset = MOCK_ASSET_INTELLIGENCE[0]; // FC Road
      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={asset} onClose={() => {}} />
      );

      expect(html).toContain('AST-RD-104');
      expect(html).toContain('FC Road Carriageway Km 2.4-2.8');
      expect(html).toContain('Road Segment');
      expect(html).toContain('CRITICAL RISK (82%)');
      expect(html).toContain('Ward 12 - Shivaji Nagar');
      expect(html).toContain('AI Predictive Maintenance Advisory');
      expect(html).toContain('Maintenance Review Recommended');
      expect(html).toContain('45'); // conditionScore
      expect(html).toContain('/ 100');
    });

    it('renders linked civic complaints with verified citizen proof photo and caption', () => {
      const asset = MOCK_ASSET_INTELLIGENCE[0]; // FC Road
      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={asset} onClose={() => {}} />
      );

      expect(html).toContain('Linked Civic Complaints &amp; Verified Proof');
      expect(html).toContain('iss-hs-001');
      expect(html).toContain('Severe crater pothole on FC Road near Goodluck');
      expect(html).toContain('Verified Citizen Proof Photo');
      expect(html).toContain('Citizen photo showing 35cm deep pothole cavity in active traffic lane');

      expect(html).toContain('iss-hs-002');
      expect(html).toContain('Multiple recurrent potholes near Ferguson Gate 2');
      expect(html).toContain('Surface peeling and sub-base moisture subsidence across 15 meters');
    });

    it('renders chronological lifecycle & maintenance history with work orders and downtime', () => {
      const asset = MOCK_ASSET_INTELLIGENCE[0]; // FC Road
      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={asset} onClose={() => {}} />
      );

      expect(html).toContain('Asset Lifecycle &amp; Maintenance History');
      expect(html).toContain('WO-PMC-2026-0812');
      expect(html).toContain('Emergency Hot-Mix Asphalt Compaction');
      expect(html).toContain('6.5 hrs');
      expect(html).toContain('EMERGENCY_REPAIR');
      expect(html).toContain('PMC Road Maintenance Division &amp; Shinde Roadworks');

      // Commissioning baseline
      expect(html).toContain('Asset Commissioned: FC Road Carriageway');
      expect(html).toContain('Full bituminous concrete reconstruction placed into active municipal service.');
    });

    it('renders fallback empty state when asset has no linked complaints', () => {
      const assetWithoutComplaints = MOCK_ASSET_INTELLIGENCE.find((a) => a.id === 'ast-004'); // Streetlight
      expect(assetWithoutComplaints).toBeDefined();

      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={assetWithoutComplaints} onClose={() => {}} />
      );

      expect(html).toContain('No active citizen complaints linked to this municipal asset.');
    });

    it('renders accessible modal attributes and close button with touch target >= 44px', () => {
      const asset = MOCK_ASSET_INTELLIGENCE[0];
      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={asset} onClose={() => {}} />
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="asset-drawer-title"');
      expect(html).toContain('aria-label="Close asset details"');
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('min-w-[44px]');
    });

    it('returns null when no asset is provided', () => {
      const html = renderToStaticMarkup(
        <AssetTimelineDrawer asset={null} onClose={() => {}} />
      );
      expect(html).toBe('');
    });
  });

  describe('Category Failure Trends Calculation Logic', () => {
    it('accurately groups failures and downtime across asset categories', () => {
      const roadAssets = MOCK_ASSET_INTELLIGENCE.filter((a) => a.assetType === 'ROAD_SEGMENT');
      const roadFailures = roadAssets.reduce((sum, a) => sum + a.failureCount, 0);
      const roadDowntime = roadAssets.reduce((sum, a) => sum + a.totalDowntimeHours, 0);

      expect(roadFailures).toBe(6);
      expect(roadDowntime).toBe(24.0);

      const drainAssets = MOCK_ASSET_INTELLIGENCE.filter((a) => a.assetType === 'DRAINAGE_CULVERT');
      const drainFailures = drainAssets.reduce((sum, a) => sum + a.failureCount, 0);
      expect(drainFailures).toBe(4);
      const drainDowntime = drainAssets.reduce((sum, a) => sum + a.totalDowntimeHours, 0);
      expect(drainDowntime).toBe(36.0);

      const transformerAssets = MOCK_ASSET_INTELLIGENCE.filter((a) => a.assetType === 'ELECTRICAL_TRANSFORMER');
      const transformerDowntime = transformerAssets.reduce((sum, a) => sum + a.totalDowntimeHours, 0);
      expect(transformerDowntime).toBe(45.0);
    });
  });
});
