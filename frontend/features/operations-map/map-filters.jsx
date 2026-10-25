'use client';
import React from 'react';
import {
  MAP_STATUS_OPTIONS,
  MAP_PRIORITY_OPTIONS,
  MAP_DEPARTMENT_OPTIONS,
  MAP_VERIFICATION_OPTIONS,
} from './types.js';

export function MapFilters({
  filters,
  onChangeFilters,
  onResetFilters,
  totalResults = 0,
}) {
  const hasActiveFilters =
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.verificationStatus !== 'ALL' ||
    filters.search.trim().length > 0;

  const handleSelectChange = (key, value) => {
    onChangeFilters({ ...filters, [key]: value });
  };

  const handleSearchChange = (e) => {
    onChangeFilters({ ...filters, search: e.target.value });
  };

  const setQuickFilter = (preset) => {
    switch (preset) {
      case 'CRITICAL':
        onChangeFilters({
          ...filters,
          priority: 'CRITICAL',
          status: 'ALL',
          department: 'ALL',
          verificationStatus: 'ALL',
        });
        break;
      case 'PENDING_VERIFICATION':
        onChangeFilters({
          ...filters,
          verificationStatus: 'PENDING',
          priority: 'ALL',
          status: 'ALL',
          department: 'ALL',
        });
        break;
      case 'ACTIVE':
        onChangeFilters({
          ...filters,
          status: 'IN_PROGRESS',
          priority: 'ALL',
          department: 'ALL',
          verificationStatus: 'ALL',
        });
        break;
      case 'ALL':
      default:
        onResetFilters();
        break;
    }
  };

  return (
    <div className="w-full bg-surface-primary border border-border-primary rounded-xl p-4 shadow-elevation-1 space-y-3">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search issues by title, category, or address..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-lg border border-border-primary bg-surface-secondary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            aria-label="Search map issues"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, search: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary min-h-[44px] min-w-[36px]"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Results Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold text-text-secondary px-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-secondary border border-border-secondary">
            {totalResults} {totalResults === 1 ? 'Issue' : 'Issues'} Found
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-primary hover:text-primary-hover underline focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 min-h-[44px] flex items-center"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Primary Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {/* Status Dropdown */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-text-secondary mb-1">
            Issue Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {MAP_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div>
          <label htmlFor="filter-priority" className="block text-xs font-medium text-text-secondary mb-1">
            Priority / Severity
          </label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {MAP_PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div>
          <label htmlFor="filter-department" className="block text-xs font-medium text-text-secondary mb-1">
            Department
          </label>
          <select
            id="filter-department"
            value={filters.department}
            onChange={(e) => handleSelectChange('department', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {MAP_DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verification State Dropdown */}
        <div>
          <label htmlFor="filter-verification" className="block text-xs font-medium text-text-secondary mb-1">
            Verification State
          </label>
          <select
            id="filter-verification"
            value={filters.verificationStatus}
            onChange={(e) => handleSelectChange('verificationStatus', e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border-primary bg-surface-secondary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {MAP_VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-primary/60">
        <span className="text-xs text-text-tertiary mr-1 font-medium">Quick Presets:</span>
        <button
          type="button"
          onClick={() => setQuickFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors ${
            !hasActiveFilters
              ? 'bg-primary text-text-inverse'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          All Issues
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('CRITICAL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors ${
            filters.priority === 'CRITICAL'
              ? 'bg-priority-critical text-text-inverse'
              : 'bg-priority-critical/10 text-priority-critical hover:bg-priority-critical/20'
          }`}
        >
          🚨 Critical Only
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('PENDING_VERIFICATION')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors ${
            filters.verificationStatus === 'PENDING'
              ? 'bg-status-warning text-text-primary'
              : 'bg-status-warning/15 text-status-warning hover:bg-status-warning/25'
          }`}
        >
          ⏳ Pending Verification
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('ACTIVE')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors ${
            filters.status === 'IN_PROGRESS'
              ? 'bg-status-info text-text-inverse'
              : 'bg-status-info/10 text-status-info hover:bg-status-info/20'
          }`}
        >
          ⚙️ Active In-Progress
        </button>
      </div>
    </div>
  );
}
