'use client';
import React, { useState, useMemo, useEffect } from 'react';
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
  const [issues, setIssues] = useState(initialIssues);
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

  // Fetch live operational issues if available
  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('civiq_session_token') : null;
    fetch('/api/issues/operational-map?limit=200', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.data?.issues && Array.isArray(json.data.issues) && json.data.issues.length > 0) {
          setIssues(json.data.issues);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Re-compute KPIs whenever filters or issues change
  const computedData = useMemo(() => {
    return computeDashboardKpis(issues, filters);
  }, [issues, filters]);

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

  // Live refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('civiq_session_token') : null;
      const res = await fetch('/api/issues/operational-map?limit=200', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.issues?.length > 0) {
          setIssues(json.data.issues);
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
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
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-5">
      {/* Dashboard Top Header — Premium bento style */}
      <div
        className="relative flex flex-col md:flex-row md:items-start justify-between gap-5 p-5 sm:p-7 rounded-2xl overflow-hidden border border-border-primary/70"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #0F172A 100%)',
          boxShadow: '0 4px 24px rgba(37,99,235,0.08), 0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              Municipal Oversight • Pune PMC &amp; PCMC Command
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Authority Command Dashboard
          </h1>
          <p className="text-sm text-white/50 mt-2 max-w-xl leading-relaxed">
            Executive oversight of civic issue resolution, SLA compliance, department accountability, and citizen feedback.
          </p>
        </div>

        {/* Right side actions */}
        <div className="relative flex items-center gap-2 self-start flex-shrink-0 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/8 text-xs font-semibold text-white/70 backdrop-blur-sm">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Authority Access Level: Executive Official
          </span>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/50 min-h-[36px]"
            aria-label="Export operational reports"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="flex items-center justify-between mb-4 px-0.5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
              Core Operational Metrics
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              {totalIssues} issues evaluated · Click any metric to drill down
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-text-tertiary bg-surface-secondary px-2.5 py-1 rounded-lg border border-border-primary font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            Interactive
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
        <div className="flex items-center gap-1 p-1 bg-surface-secondary border border-border-primary rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold min-h-[40px] transition-all duration-200 cursor-pointer ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-surface-primary text-primary shadow-elevation-1 border border-border-primary/50'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/50'
            }`}
          >
            Departments Breakdown
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-md ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-tertiary text-text-tertiary'
            }`}>
              {byDepartment.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WARDS')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold min-h-[40px] transition-all duration-200 cursor-pointer ${
              activeTab === 'WARDS'
                ? 'bg-surface-primary text-primary shadow-elevation-1 border border-border-primary/50'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/50'
            }`}
          >
            Ward Distribution
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-md ${
              activeTab === 'WARDS'
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-tertiary text-text-tertiary'
            }`}>
              {byWard.length}
            </span>
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
