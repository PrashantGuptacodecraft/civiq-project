'use client';
import React from 'react';
import {
  DASHBOARD_DEPARTMENT_OPTIONS,
  DASHBOARD_WARD_OPTIONS,
  TIME_RANGE_OPTIONS,
} from './types.js';

export function DashboardFilters({
  filters,
  onChangeFilters,
  onResetFilters,
  activeDrillDownMetric = null,
  onClearDrillDown,
}) {
  const hasActiveFilters =
    filters.department !== 'ALL' ||
    filters.ward !== 'ALL' ||
    filters.timeRange !== '30d' ||
    Boolean(activeDrillDownMetric);

  return (
    <div className="w-full bg-surface-primary border border-border-primary rounded-2xl p-4 sm:p-5 shadow-elevation-1 space-y-4">
      {/* Top Header Row with Active Drill-Down Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-bold text-text-primary">
            Authority Command Filters &amp; Scopes
          </span>
        </div>

        {/* Reset Action */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-primary hover:text-primary-hover underline p-1 min-h-[36px] flex items-center self-start sm:self-auto cursor-pointer"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Filter */}
        <div>
          <label htmlFor="dash-filter-dept" className="block text-xs font-semibold text-text-secondary mb-1.5">
            Municipal Department
          </label>
          <select
            id="dash-filter-dept"
            value={filters.department}
            onChange={(e) => onChangeFilters({ ...filters, department: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {DASHBOARD_DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ward / Jurisdiction Filter */}
        <div>
          <label htmlFor="dash-filter-ward" className="block text-xs font-semibold text-text-secondary mb-1.5">
            Administrative Ward / ULB
          </label>
          <select
            id="dash-filter-ward"
            value={filters.ward}
            onChange={(e) => onChangeFilters({ ...filters, ward: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {DASHBOARD_WARD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Window Filter */}
        <div>
          <label htmlFor="dash-filter-time" className="block text-xs font-semibold text-text-secondary mb-1.5">
            Reporting Time Window
          </label>
          <select
            id="dash-filter-time"
            value={filters.timeRange}
            onChange={(e) => onChangeFilters({ ...filters, timeRange: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Drill-down Breadcrumb Tag */}
      {activeDrillDownMetric && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">🔍 Active Drill-Down:</span>
            <span className="font-semibold text-text-primary uppercase">
              {activeDrillDownMetric.replace('_', ' ')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearDrillDown}
            className="text-primary hover:text-primary-hover font-bold px-2 py-1 min-h-[32px] cursor-pointer"
          >
            ✕ Clear Drill-Down
          </button>
        </div>
      )}
    </div>
  );
}
