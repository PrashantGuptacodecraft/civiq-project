'use client';
import React, { useState, useMemo } from 'react';
import { MOCK_DASHBOARD_ISSUES } from './mock-dashboard-data.js';
import { computeDashboardKpis, filterDrillDownIssues } from './kpi-engine.js';
import { FreshnessBadge } from './freshness-badge.jsx';
import { DashboardFilters } from './dashboard-filters.jsx';
import { KpiCard } from './kpi-card.jsx';
import { DepartmentBreakdown } from './department-breakdown.jsx';
import { WardBreakdown } from './ward-breakdown.jsx';
import { DrillDownDrawer } from './drill-down-drawer.jsx';
import { ExportModal } from '../operational-reports/index.js';
import { KPI_METRIC_KEYS, SOURCE_LABELS } from './types.js';

export function CommandDashboard({
  initialIssues = MOCK_DASHBOARD_ISSUES,
}) {
  const [filters, setFilters] = useState({
    department: 'ALL',
    ward: 'ALL',
    timeRange: '30d',
  });

  const [activeDrillDownMetric, setActiveDrillDownMetric] = useState(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('DEPARTMENTS'); // 'DEPARTMENTS' | 'WARDS'

  // Re-compute KPIs whenever filters or issues change
  const computedData = useMemo(() => {
    return computeDashboardKpis(initialIssues, filters);
  }, [initialIssues, filters]);

  const { kpis, byDepartment, byWard, enrichedIssues, totalIssues } = computedData;

  // Handle drill-down trigger
  const handleOpenDrillDown = (metricKey) => {
    setActiveDrillDownMetric(metricKey);
    setIsDrillDownOpen(true);
  };

  const handleCloseDrillDown = () => {
    setIsDrillDownOpen(false);
  };

  const handleClearDrillDown = () => {
    setActiveDrillDownMetric(null);
    setIsDrillDownOpen(false);
  };

  // Filtered drill-down items
  const drillDownItems = useMemo(() => {
    return filterDrillDownIssues(enrichedIssues, activeDrillDownMetric);
  }, [enrichedIssues, activeDrillDownMetric]);

  // Simulate refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 400);
  };

  const handleResetFilters = () => {
    setFilters({
      department: 'ALL',
      ward: 'ALL',
      timeRange: '30d',
    });
    setActiveDrillDownMetric(null);
    setIsDrillDownOpen(false);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-primary border border-border-primary p-4 sm:p-6 rounded-2xl shadow-elevation-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Municipal Oversight • Pune PMC &amp; PCMC Command
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Authority Command Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Real-time executive oversight of civic issue resolution, SLA compliance, department accountability, and citizen reopening trends.
          </p>
        </div>

        {/* Executive Scope Badge & Export Action */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <span className="px-3 py-1.5 rounded-xl border border-border-primary bg-surface-secondary text-xs font-semibold text-text-primary shadow-elevation-1">
            🏛️ Authority Access Level: Executive Official
          </span>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border-primary bg-surface-elevated text-xs font-bold text-text-primary hover:bg-surface-secondary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
            aria-label="Export operational reports"
          >
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Reports
          </button>
        </div>
      </div>

      {/* Freshness & Data Source Banner */}
      <FreshnessBadge
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        sourceLabel={SOURCE_LABELS.PRIMARY}
      />

      {/* Filters Bar */}
      <DashboardFilters
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={handleResetFilters}
        activeDrillDownMetric={activeDrillDownMetric}
        onClearDrillDown={handleClearDrillDown}
      />

      {/* 6 CORE REQUIRED KPIS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary">
            Core Operational Metrics ({totalIssues} issues evaluated)
          </h2>
          <span className="text-xs text-text-secondary">
            Click any metric to drill down
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Open Issues */}
          <KpiCard
            title={kpis.open.label}
            value={kpis.open.count}
            sublabel={kpis.open.sublabel}
            statusColor="primary"
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.OPEN}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.OPEN)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* 2. Verified Issues */}
          <KpiCard
            title={kpis.verified.label}
            value={kpis.verified.count}
            sublabel={kpis.verified.sublabel}
            statusColor="success"
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.VERIFIED}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.VERIFIED)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* 3. SLA Breached Issues */}
          <KpiCard
            title={kpis.slaBreached.label}
            value={kpis.slaBreached.count}
            sublabel={kpis.slaBreached.sublabel}
            statusColor={kpis.slaBreached.count > 0 ? 'error' : 'success'}
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.SLA_BREACHED}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.SLA_BREACHED)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          {/* 4. Average Resolution Time */}
          <KpiCard
            title={kpis.averageResolution.label}
            value={kpis.averageResolution.hours}
            unit="hrs"
            sublabel={kpis.averageResolution.sublabel}
            statusColor="neutral"
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.AVG_RESOLUTION}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.AVG_RESOLUTION)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          {/* 5. Reopened Rate */}
          <KpiCard
            title={kpis.reopened.label}
            value={`${kpis.reopened.rate}%`}
            sublabel={kpis.reopened.sublabel}
            statusColor={kpis.reopened.rate > 10 ? 'warning' : 'neutral'}
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.REOPENED}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.REOPENED)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />

          {/* 6. Duplicate Rate */}
          <KpiCard
            title={kpis.duplicate.label}
            value={`${kpis.duplicate.rate}%`}
            sublabel={kpis.duplicate.sublabel}
            statusColor="neutral"
            isActive={activeDrillDownMetric === KPI_METRIC_KEYS.DUPLICATE}
            onClickDrillDown={() => handleOpenDrillDown(KPI_METRIC_KEYS.DUPLICATE)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Breakdown Tab Switcher (Department vs Ward) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border-primary pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-primary text-text-inverse shadow-elevation-1'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            🏢 Departments Breakdown ({byDepartment.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WARDS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'WARDS'
                ? 'bg-primary text-text-inverse shadow-elevation-1'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            📍 Ward &amp; Jurisdiction Distribution ({byWard.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'DEPARTMENTS' ? (
          <DepartmentBreakdown
            departments={byDepartment}
            selectedDepartment={filters.department}
            onSelectDepartment={(deptName) => {
              setFilters((prev) => ({
                ...prev,
                department: prev.department === deptName ? 'ALL' : deptName,
              }));
            }}
          />
        ) : (
          <WardBreakdown
            wards={byWard}
            selectedWard={filters.ward}
            onSelectWard={(wardId) => {
              setFilters((prev) => ({
                ...prev,
                ward: prev.ward === wardId ? 'ALL' : wardId,
              }));
            }}
          />
        )}
      </div>

      {/* Drill-down Drawer */}
      <DrillDownDrawer
        isOpen={isDrillDownOpen}
        onClose={handleCloseDrillDown}
        metricKey={activeDrillDownMetric || 'all'}
        title={`Drill-down: ${activeDrillDownMetric ? activeDrillDownMetric.toUpperCase().replace('_', ' ') : 'All Issues'}`}
        issues={drillDownItems}
      />

      {/* Operational Reports Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        jurisdictionId={filters.ward !== 'ALL' ? filters.ward : 'mh-pune-pmc'}
      />
    </div>
  );
}
