import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  computeDashboardKpis,
  filterDrillDownIssues,
  FreshnessBadge,
  KpiCard,
  DashboardFilters,
  DepartmentBreakdown,
  WardBreakdown,
  DrillDownDrawer,
  CommandDashboard,
  MOCK_DASHBOARD_ISSUES,
  SOURCE_LABELS,
} from '../features/dashboard/index.js';

describe('Phase 45: Authority Command Dashboard & KPI Engine Tests', () => {
  describe('KPI Calculation Engine (computeDashboardKpis)', () => {
    it('accurately computes the 6 required core KPIs', () => {
      const data = computeDashboardKpis(MOCK_DASHBOARD_ISSUES);

      expect(data.totalIssues).toBe(MOCK_DASHBOARD_ISSUES.length);

      // 1. Open Issues
      expect(data.kpis.open.count).toBeGreaterThan(0);
      expect(data.kpis.open.rate).toBeGreaterThan(0);
      expect(data.kpis.open.label).toBe('Open Issues');

      // 2. Verified Issues
      expect(data.kpis.verified.count).toBeGreaterThan(0);
      expect(data.kpis.verified.rate).toBeGreaterThan(0);
      expect(data.kpis.verified.label).toBe('Verified Issues');

      // 3. SLA Breached Issues
      expect(data.kpis.slaBreached.count).toBeGreaterThanOrEqual(1);
      expect(data.kpis.slaBreached.complianceRate).toBeDefined();
      expect(data.kpis.slaBreached.label).toBe('SLA Breached');

      // 4. Average Resolution Time
      expect(data.kpis.averageResolution.hours).toBeGreaterThan(0);
      expect(data.kpis.averageResolution.label).toBe('Avg Resolution Time');

      // 5. Reopened Rate
      expect(data.kpis.reopened.count).toBe(1); // civiq-dash-004 is REOPENED
      expect(data.kpis.reopened.rate).toBeGreaterThan(0);
      expect(data.kpis.reopened.label).toBe('Reopened Rate');

      // 6. Duplicate Rate
      expect(data.kpis.duplicate.count).toBe(1); // civiq-dash-006 is DUPLICATE
      expect(data.kpis.duplicate.rate).toBeGreaterThan(0);
      expect(data.kpis.duplicate.label).toBe('Duplicate Rate');
    });

    it('correctly filters KPIs by department and ward scopes', () => {
      // Filter by Sewerage & Drainage
      const deptFiltered = computeDashboardKpis(MOCK_DASHBOARD_ISSUES, {
        department: 'Sewerage & Drainage Department',
      });

      expect(deptFiltered.totalIssues).toBe(2);
      expect(deptFiltered.byDepartment.length).toBe(1);
      expect(deptFiltered.byDepartment[0].departmentName).toBe('Sewerage & Drainage Department');

      // Filter by Ward Swargate
      const wardFiltered = computeDashboardKpis(MOCK_DASHBOARD_ISSUES, {
        ward: 'ward-swargate',
      });

      expect(wardFiltered.totalIssues).toBe(2);
      expect(wardFiltered.byWard.length).toBe(1);
      expect(wardFiltered.byWard[0].wardName).toContain('Swargate');
    });
  });

  describe('Drill-Down Filtering Engine (filterDrillDownIssues)', () => {
    const computed = computeDashboardKpis(MOCK_DASHBOARD_ISSUES);

    it('filters drill-down issues for open metric', () => {
      const openIssues = filterDrillDownIssues(computed.enrichedIssues, 'open');
      expect(openIssues.length).toBe(computed.kpis.open.count);
      expect(openIssues.every((i) => i.isOpen)).toBe(true);
    });

    it('filters drill-down issues for SLA breached metric', () => {
      const breachedIssues = filterDrillDownIssues(computed.enrichedIssues, 'sla_breached');
      expect(breachedIssues.length).toBe(computed.kpis.slaBreached.count);
      expect(breachedIssues.every((i) => i.isSlaBreached)).toBe(true);
    });

    it('filters drill-down issues for reopened metric', () => {
      const reopenedIssues = filterDrillDownIssues(computed.enrichedIssues, 'reopened');
      expect(reopenedIssues.length).toBe(1);
      expect(reopenedIssues[0].status).toBe('REOPENED');
    });

    it('filters drill-down issues for duplicate metric', () => {
      const duplicateIssues = filterDrillDownIssues(computed.enrichedIssues, 'duplicate');
      expect(duplicateIssues.length).toBe(1);
      expect(duplicateIssues[0].verificationStatus).toBe('DUPLICATE');
    });
  });

  describe('FreshnessBadge Component', () => {
    it('renders data freshness, source labeling, and sync trigger', () => {
      const html = renderToStaticMarkup(
        <FreshnessBadge
          lastUpdated={new Date('2026-10-25T12:00:00Z')}
          onRefresh={() => {}}
          isRefreshing={false}
          sourceLabel={SOURCE_LABELS.PRIMARY}
        />
      );

      expect(html).toContain('Data Freshness:');
      expect(html).toContain(SOURCE_LABELS.PRIMARY);
      expect(html).toContain('Sync Now');
      expect(html).toContain('aria-live="polite"');
    });
  });

  describe('KpiCard Component', () => {
    it('renders KPI metric, value, sublabel, and drill-down affordance', () => {
      const html = renderToStaticMarkup(
        <KpiCard
          title="Open Issues"
          value={42}
          sublabel="60% of total registered issues"
          statusColor="primary"
          onClickDrillDown={() => {}}
        />
      );

      expect(html).toContain('Open Issues');
      expect(html).toContain('42');
      expect(html).toContain('60% of total registered issues');
      expect(html).toContain('Drill Down →');
    });
  });

  describe('DashboardFilters Component', () => {
    it('renders department, ward, and time window dropdown selectors', () => {
      const filters = {
        department: 'ALL',
        ward: 'ALL',
        timeRange: '30d',
      };

      const html = renderToStaticMarkup(
        <DashboardFilters
          filters={filters}
          onChangeFilters={() => {}}
          onResetFilters={() => {}}
        />
      );

      expect(html).toContain('Municipal Department');
      expect(html).toContain('Administrative Ward / ULB');
      expect(html).toContain('Reporting Time Window');
      expect(html).toContain('All Departments');
      expect(html).toContain('All Wards &amp; ULBs');
      expect(html).toContain('Last 30 Days');
    });
  });

  describe('DepartmentBreakdown & WardBreakdown Components', () => {
    const computed = computeDashboardKpis(MOCK_DASHBOARD_ISSUES);

    it('renders department table with compliance and average resolution', () => {
      const html = renderToStaticMarkup(
        <DepartmentBreakdown
          departments={computed.byDepartment}
          onSelectDepartment={() => {}}
        />
      );

      expect(html).toContain('Department Performance &amp; Accountability');
      expect(html).toContain('Public Works Department (PWD)');
      expect(html).toContain('SLA Compliance');
      expect(html).toContain('Avg Resolution');
    });

    it('renders ward breakdown cards with emergency counts', () => {
      const html = renderToStaticMarkup(
        <WardBreakdown
          wards={computed.byWard}
          onSelectWard={() => {}}
        />
      );

      expect(html).toContain('Jurisdiction &amp; Ward Distribution');
      expect(html).toContain('PMC Ward 11 - Swargate / Parvati');
      expect(html).toContain('Select Ward →');
    });
  });

  describe('DrillDownDrawer Component', () => {
    const computed = computeDashboardKpis(MOCK_DASHBOARD_ISSUES);

    it('renders slide-in drawer with filtered issues when open', () => {
      const openIssues = filterDrillDownIssues(computed.enrichedIssues, 'open');

      const html = renderToStaticMarkup(
        <DrillDownDrawer
          isOpen={true}
          onClose={() => {}}
          title="Drill-Down: Open Issues"
          metricKey="open"
          issues={openIssues}
        />
      );

      expect(html).toContain('Drill-Down: Open Issues');
      expect(html).toContain('Metric: open');
      expect(html).toContain('Close Drill-Down');
    });
  });

  describe('CommandDashboard Container Integration', () => {
    it('renders complete authority dashboard with 6 KPI cards, tabs, and oversight context', () => {
      const html = renderToStaticMarkup(
        <CommandDashboard initialIssues={MOCK_DASHBOARD_ISSUES} />
      );

      expect(html).toContain('Authority Command Dashboard');
      expect(html).toContain('Municipal Oversight • Pune PMC &amp; PCMC Command');
      expect(html).toContain('Open Issues');
      expect(html).toContain('Verified Issues');
      expect(html).toContain('SLA Breached');
      expect(html).toContain('Avg Resolution Time');
      expect(html).toContain('Reopened Rate');
      expect(html).toContain('Duplicate Rate');
      expect(html).toContain('Departments Breakdown');
      expect(html).toContain('Data Freshness:');
      expect(html).toContain(SOURCE_LABELS.PRIMARY);
    });
  });
});
