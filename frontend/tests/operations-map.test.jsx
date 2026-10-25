import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  OperationsMapView,
  MapFilters,
  IssueDetailDrawer,
  AccessibleIssueList,
  OperationsMapContainer,
  clusterMarkers,
  MOCK_OPERATIONAL_ISSUES,
} from '../features/operations-map/index.js';

describe('Phase 44: Operational Map & Authorization Tests', () => {
  describe('Clustering Algorithm (clusterMarkers)', () => {
    it('aggregates close issues into clusters with dominant status and priority', () => {
      // Swargate issues (civiq-pune-001 at 18.5015, 73.8580 and civiq-pune-002 at 18.5025, 73.8588)
      const clusters = clusterMarkers(MOCK_OPERATIONAL_ISSUES, 1);
      
      const cluster = clusters.find((c) => c.isCluster);
      expect(cluster).toBeDefined();
      expect(cluster.count).toBeGreaterThanOrEqual(2);
      expect(cluster.dominantSeverity).toBe('CRITICAL');
      expect(cluster.issueIds).toContain('civiq-pune-001');
    });

    it('leaves distant isolated issues as single points', () => {
      const clusters = clusterMarkers(MOCK_OPERATIONAL_ISSUES, 1);
      const singlePoints = clusters.filter((c) => !c.isCluster);

      expect(singlePoints.length).toBeGreaterThan(0);
      const chinchwadIssue = singlePoints.find(
        (p) => p.issue.id === 'civiq-pcmc-007'
      );
      expect(chinchwadIssue).toBeDefined();
      expect(chinchwadIssue.issue.title).toContain('Chinchwad');
    });
  });

  describe('OperationsMapView Component', () => {
    it('renders accessible application role, vector boundaries, and controls', () => {
      const html = renderToStaticMarkup(
        <OperationsMapView
          issues={MOCK_OPERATIONAL_ISSUES}
          selectedIssue={null}
          onSelectIssue={() => {}}
          isClustered={true}
        />
      );

      // Accessible application role
      expect(html).toContain('role="application"');
      expect(html).toContain('CivIQ Operational Jurisdiction Map');

      // Jurisdiction boundaries
      expect(html).toContain('PMC (Pune Municipal Corp)');
      expect(html).toContain('PCMC (Pimpri-Chinchwad)');
      expect(html).toContain('Ambiguity Buffer Zone (Mula River Border)');

      // Map zoom & location controls
      expect(html).toContain('aria-label="Zoom in operational map"');
      expect(html).toContain('aria-label="Zoom out operational map"');
      expect(html).toContain('aria-label="Center map on my location"');
      expect(html).toContain('aria-label="Reset map viewport center"');
    });

    it('renders single issue markers with priority-based size and category symbols', () => {
      const html = renderToStaticMarkup(
        <OperationsMapView
          issues={MOCK_OPERATIONAL_ISSUES}
          selectedIssue={MOCK_OPERATIONAL_ISSUES[0]}
          onSelectIssue={() => {}}
          isClustered={false}
        />
      );

      // Critical manhole warning icon rendered
      expect(html).toContain('⚠️');
      // Selected issue tooltip rendered
      expect(html).toContain('Critical Open Manhole near Swargate Chowk');
    });
  });

  describe('MapFilters Component', () => {
    it('renders status, priority, department, and verification state dropdowns', () => {
      const filters = {
        status: 'ALL',
        priority: 'ALL',
        department: 'ALL',
        verificationStatus: 'ALL',
        search: '',
      };

      const html = renderToStaticMarkup(
        <MapFilters
          filters={filters}
          onChangeFilters={() => {}}
          onResetFilters={() => {}}
          totalResults={9}
        />
      );

      expect(html).toContain('Issue Status');
      expect(html).toContain('Priority / Severity');
      expect(html).toContain('Department');
      expect(html).toContain('Verification State');
      expect(html).toContain('9 Issues Found');
      expect(html).toContain('Search issues by title');
      expect(html).toContain('🚨 Critical Only');
      expect(html).toContain('⏳ Pending Verification');
    });
  });

  describe('AccessibleIssueList Component', () => {
    it('renders accessible table and mobile card alternative for screen readers', () => {
      const html = renderToStaticMarkup(
        <AccessibleIssueList
          issues={MOCK_OPERATIONAL_ISSUES}
          selectedIssue={null}
          onSelectIssue={() => {}}
        />
      );

      expect(html).toContain('aria-label="Operational civic issues list"');
      expect(html).toContain('Priority');
      expect(html).toContain('Issue Title &amp; Category');
      expect(html).toContain('Department');
      expect(html).toContain('Jurisdiction');
      expect(html).toContain('Critical Open Manhole near Swargate Chowk');
    });

    it('renders empty state when no issues match filter criteria', () => {
      const html = renderToStaticMarkup(
        <AccessibleIssueList
          issues={[]}
          selectedIssue={null}
          onSelectIssue={() => {}}
        />
      );

      expect(html).toContain('No issues matching active filters');
    });
  });

  describe('Authorization & Privacy Protection in IssueDetailDrawer', () => {
    const testIssue = MOCK_OPERATIONAL_ISSUES[0];

    it('redacts exact forensic evidence and citizen PII in Public Citizen View', () => {
      const html = renderToStaticMarkup(
        <IssueDetailDrawer
          issue={testIssue}
          onClose={() => {}}
          isAuthorizedOfficial={false}
          onToggleOfficialRole={() => {}}
        />
      );

      // Privacy Shield notice is displayed
      expect(html).toContain('Privacy Shield Active');
      expect(html).toContain('Exact Evidence &amp; Identity Redacted');
      expect(html).toContain('Sign in with Official Credentials to Audit');

      // Citizen PII must NOT be present
      expect(html).not.toContain(testIssue.reportedBy.phone);
      expect(html).not.toContain(testIssue.reportedBy.email);

      // Exact storage key and cryptographic SHA-256 hash must NOT be exposed
      expect(html).not.toContain(testIssue.evidence[0].storageKey);
      expect(html).not.toContain(testIssue.evidence[0].fileHash);
    });

    it('exposes full cryptographic forensic audit and citizen contact to Authorized Officials', () => {
      const html = renderToStaticMarkup(
        <IssueDetailDrawer
          issue={testIssue}
          onClose={() => {}}
          isAuthorizedOfficial={true}
          onToggleOfficialRole={() => {}}
        />
      );

      // Official audit badge is displayed
      expect(html).toContain('Full Official Audit');
      expect(html).toContain('Citizen Reporter:');
      expect(html).toContain('✓ Identity Verified');

      // Citizen contact details ARE present for officials
      expect(html).toContain(testIssue.reportedBy.phone);
      expect(html).toContain(testIssue.reportedBy.email);

      // Exact storage key and cryptographic hash ARE visible for official verification
      expect(html).toContain(testIssue.evidence[0].storageKey);
      expect(html).toContain(testIssue.evidence[0].fileHash);
      expect(html).toContain('Forensic GPS:');
    });
  });

  describe('OperationsMapContainer Integration', () => {
    it('renders complete operational map view with title, filter bar, and quick list', () => {
      const html = renderToStaticMarkup(
        <OperationsMapContainer initialIssues={MOCK_OPERATIONAL_ISSUES} />
      );

      expect(html).toContain('Jurisdiction Operations Map');
      expect(html).toContain('Operational Command Hub • Pune PMC &amp; PCMC');
      expect(html).toContain('🗺️ Map View');
      expect(html).toContain('📋 Accessible List');
      expect(html).toContain('✓ Clustering Enabled');
      expect(html).toContain('Active Map Issues');
    });
  });
});
