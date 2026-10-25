'use client';
import React, { useState, useMemo } from 'react';
import { MOCK_OPERATIONAL_ISSUES } from './mock-operational-data.js';
import { OperationsMapView } from './operations-map-view.jsx';
import { MapFilters } from './map-filters.jsx';
import { AccessibleIssueList } from './accessible-issue-list.jsx';
import { IssueDetailDrawer } from './issue-detail-drawer.jsx';
import { VIEW_MODES } from './types.js';

export function OperationsMapContainer({
  initialIssues = MOCK_OPERATIONAL_ISSUES,
}) {
  // View mode: MAP vs LIST
  const [viewMode, setViewMode] = useState(VIEW_MODES.MAP);

  // Clustering toggle
  const [isClustered, setIsClustered] = useState(true);

  // Security role state: Public View (Citizen) vs Authorized Official (Supervisor/Admin)
  const [isAuthorizedOfficial, setIsAuthorizedOfficial] = useState(false);

  // Active Filters State
  const [filters, setFilters] = useState({
    status: 'ALL',
    priority: 'ALL',
    department: 'ALL',
    verificationStatus: 'ALL',
    search: '',
  });

  // Selected issue for detail drawer
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter application logic
  const filteredIssues = useMemo(() => {
    return initialIssues.filter((issue) => {
      // Status filter
      if (filters.status !== 'ALL' && issue.status !== filters.status) {
        return false;
      }
      // Priority filter
      if (filters.priority !== 'ALL' && issue.severity !== filters.priority) {
        return false;
      }
      // Department filter
      if (filters.department !== 'ALL' && issue.department !== filters.department) {
        return false;
      }
      // Verification state filter
      if (
        filters.verificationStatus !== 'ALL' &&
        issue.verificationStatus !== filters.verificationStatus
      ) {
        return false;
      }
      // Text search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesDesc = issue.description.toLowerCase().includes(query);
        const matchesCat = (issue.categoryName || issue.categoryId || '').toLowerCase().includes(query);
        const matchesAddr = (issue.address || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesAddr) {
          return false;
        }
      }
      return true;
    });
  }, [initialIssues, filters]);

  // Pagination calculations
  const totalResults = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedIssues = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredIssues.slice(startIndex, startIndex + pageSize);
  }, [filteredIssues, validCurrentPage, pageSize]);

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      priority: 'ALL',
      department: 'ALL',
      verificationStatus: 'ALL',
      search: '',
    });
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Platform & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-primary border border-border-primary p-4 sm:p-6 rounded-2xl shadow-elevation-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Operational Command Hub • Pune PMC & PCMC
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Jurisdiction Operations Map
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Real-time multi-department civic issue tracking across administrative wards, ambiguity buffer zones, and priority emergency clusters.
          </p>
        </div>

        {/* View Mode & Clustering Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map vs List View Switcher */}
          <div className="inline-flex rounded-lg border border-border-primary bg-surface-secondary p-1">
            <button
              type="button"
              onClick={() => setViewMode(VIEW_MODES.MAP)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold min-h-[36px] transition-colors ${
                viewMode === VIEW_MODES.MAP
                  ? 'bg-primary text-text-inverse shadow-elevation-1'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              🗺️ Map View
            </button>
            <button
              type="button"
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold min-h-[36px] transition-colors ${
                viewMode === VIEW_MODES.LIST
                  ? 'bg-primary text-text-inverse shadow-elevation-1'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              📋 Accessible List
            </button>
          </div>

          {/* Clustering Toggle (Map view only) */}
          {viewMode === VIEW_MODES.MAP && (
            <button
              type="button"
              onClick={() => setIsClustered(!isClustered)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[44px] transition-colors ${
                isClustered
                  ? 'bg-surface-primary border-primary text-primary'
                  : 'bg-surface-secondary border-border-primary text-text-secondary'
              }`}
            >
              {isClustered ? '✓ Clustering Enabled' : '○ Individual Points'}
            </button>
          )}

          {/* Role Mode Indicator Button */}
          <button
            type="button"
            onClick={() => setIsAuthorizedOfficial(!isAuthorizedOfficial)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[44px] transition-colors ${
              isAuthorizedOfficial
                ? 'bg-status-success/10 border-status-success text-status-success'
                : 'bg-surface-secondary border-border-primary text-text-secondary'
            }`}
            title="Toggle between Public Citizen view and Authorized Official view"
          >
            {isAuthorizedOfficial ? '👮 Supervisor Audit Mode' : '🌐 Public View'}
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <MapFilters
        filters={filters}
        onChangeFilters={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={totalResults}
      />

      {/* Main View Area: Map View vs Accessible List View */}
      {viewMode === VIEW_MODES.MAP ? (
        <div className="space-y-4">
          <OperationsMapView
            issues={filteredIssues}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            isClustered={isClustered}
          />

          {/* Quick List Strip Below Map */}
          <div className="bg-surface-primary border border-border-primary rounded-xl p-4 shadow-elevation-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text-primary">
                Active Map Issues ({filteredIssues.length})
              </h2>
              <span className="text-xs text-text-tertiary">
                Tap marker on map or click item below to inspect
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIssue(issue);
                    }
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedIssue?.id === issue.id
                      ? 'border-primary bg-primary/5 shadow-elevation-1'
                      : 'border-border-primary bg-surface-secondary hover:border-border-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-priority-critical text-text-inverse'
                          : 'bg-surface-tertiary text-text-secondary'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-[11px] font-medium text-text-tertiary">
                      {issue.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-text-primary line-clamp-1">
                    {issue.title}
                  </h3>
                  <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-1">
                    {issue.address}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-primary text-xs text-text-secondary">
                <span>
                  Page {validCurrentPage} of {totalPages} ({totalResults} total issues)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage <= 1}
                    className="px-3 py-1.5 rounded border border-border-primary bg-surface-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage >= totalPages}
                    className="px-3 py-1.5 rounded border border-border-primary bg-surface-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Accessible Non-Map List View */
        <div className="space-y-4">
          <AccessibleIssueList
            issues={paginatedIssues}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
          />

          {/* List Pagination */}
          {totalPages > 1 && (
            <div className="bg-surface-primary border border-border-primary rounded-xl p-4 flex items-center justify-between text-xs text-text-secondary shadow-elevation-1">
              <span>
                Showing {((validCurrentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(validCurrentPage * pageSize, totalResults)} of {totalResults} issues
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage <= 1}
                  className="px-3 py-1.5 rounded border border-border-primary bg-surface-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                >
                  ← Previous
                </button>
                <span className="font-semibold text-text-primary px-2">
                  {validCurrentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="px-3 py-1.5 rounded border border-border-primary bg-surface-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-in Issue Detail Drawer / Bottom Sheet */}
      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        isAuthorizedOfficial={isAuthorizedOfficial}
        onToggleOfficialRole={(val) => setIsAuthorizedOfficial(val)}
      />
    </div>
  );
}
