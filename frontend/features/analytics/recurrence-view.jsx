'use client';
import React, { useState, useMemo } from 'react';
import { MOCK_RECURRENCE_CANDIDATES } from './mock-recurrence-data.js';
import { RECURRENCE_DISCLAIMER, CATEGORY_LABELS } from './types.js';

export function RecurrenceView({ candidates = MOCK_RECURRENCE_CANDIDATES }) {
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [assetTypeFilter, setAssetTypeFilter] = useState('ALL');
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (urgencyFilter !== 'ALL' && c.urgency !== urgencyFilter) return false;
      if (assetTypeFilter !== 'ALL' && c.assetType !== assetTypeFilter) return false;
      return true;
    });
  }, [candidates, urgencyFilter, assetTypeFilter]);

  const toggleExpand = (id) => {
    setExpandedCandidateId((prev) => (prev === id ? null : id));
  };

  const urgencyBadgeStyles = {
    URGENT_MAINTENANCE: 'bg-red-500/10 text-red-600 border-red-500/30',
    SCHEDULED_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    MONITORING: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Analytical Non-Causal Callout */}
      <div
        className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5"
        role="region"
        aria-label="Recurrence Analytical Disclaimer"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-5 h-5 text-amber-600 shrink-0 mt-0.5">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-amber-700 tracking-wide uppercase">
              Recurrence Pattern Analysis • Engineering Verification Required
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {RECURRENCE_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-urgency" className="font-semibold text-text-secondary">
              Urgency:
            </label>
            <select
              id="filter-urgency"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-surface-primary border border-border-primary rounded-lg px-2.5 py-1.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value="ALL">All Urgency Tiers</option>
              <option value="URGENT_MAINTENANCE">Urgent Maintenance</option>
              <option value="SCHEDULED_REVIEW">Scheduled Review</option>
              <option value="MONITORING">Monitoring</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-asset-type" className="font-semibold text-text-secondary">
              Asset Type:
            </label>
            <select
              id="filter-asset-type"
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value)}
              className="bg-surface-primary border border-border-primary rounded-lg px-2.5 py-1.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value="ALL">All Asset Types</option>
              <option value="ROAD_SEGMENT">Road Segments</option>
              <option value="ELECTRICAL_INFRA">Electrical Infrastructure</option>
              <option value="WATER_NETWORK">Water Network</option>
              <option value="DRAINAGE_CULVERT">Drainage Culverts</option>
            </select>
          </div>
        </div>

        <span className="text-text-tertiary">
          Showing {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Candidates List */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-12 bg-surface-elevated rounded-xl border border-dashed border-border-primary">
          <p className="text-text-secondary font-medium">No recurring failure candidates match the filter.</p>
          <p className="text-xs text-text-tertiary mt-1">Try resetting the filter criteria to All.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => {
            const isExpanded = expandedCandidateId === candidate.candidateId;

            return (
              <div
                key={candidate.candidateId}
                className="bg-surface-elevated rounded-xl border border-border-primary p-5 shadow-sm space-y-4 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-primary">
                        {candidate.assetId}
                      </span>
                      <span className="text-xs font-semibold uppercase text-text-tertiary">
                        {candidate.department} • {candidate.ward}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary mt-1">
                      {candidate.assetName}
                    </h3>
                  </div>

                  <span
                    className={`self-start px-3 py-1 text-xs font-bold rounded-full border shrink-0 ${
                      urgencyBadgeStyles[candidate.urgency] || urgencyBadgeStyles.MONITORING
                    }`}
                  >
                    {candidate.urgency.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border-primary text-xs">
                  <div>
                    <span className="text-text-tertiary block">Repeated Failures</span>
                    <span className="text-base font-bold text-text-primary mt-0.5 block">
                      {candidate.failureCount} incidents
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Time Span</span>
                    <span className="text-base font-bold text-text-primary mt-0.5 block">
                      {candidate.timeSpanDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Mean Time (MTBF)</span>
                    <span className="text-base font-bold text-text-primary mt-0.5 block">
                      ~{candidate.meanTimeBetweenFailuresDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Recurrence Score</span>
                    <span className="text-base font-bold text-text-primary mt-0.5 block">
                      {candidate.recurrenceScore} / 100
                    </span>
                  </div>
                </div>

                {/* Actionable Maintenance Recommendation */}
                <div className="rounded-lg bg-surface-primary border border-primary/20 p-3.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 text-primary shrink-0 mt-0.5">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-text-primary block">
                        Actionable Maintenance Recommendation
                      </span>
                      <p className="text-text-secondary leading-relaxed">
                        {candidate.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Failure Timeline Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(candidate.candidateId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1 min-h-[36px]"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Hide' : 'View'} Failure Timeline ({candidate.failureTimeline.length} events)</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expandable Timeline */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border-primary space-y-2.5">
                      {candidate.failureTimeline.map((item, idx) => (
                        <div
                          key={item.issueId}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-primary border border-border-primary text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-text-primary block">
                              #{idx + 1} — {item.title}
                            </span>
                            <span className="text-[11px] text-text-tertiary block">
                              {item.address} • Reported {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-surface-secondary text-text-secondary">
                              {item.severity}
                            </span>
                            <span className="text-[11px] text-text-tertiary block mt-1">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
