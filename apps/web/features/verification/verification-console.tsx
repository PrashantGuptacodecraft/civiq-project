'use client';

import { useState, useMemo } from 'react';
import type { MockIssue, VerificationStatus } from './mock-data';
import { MOCK_ISSUES } from './mock-data';
import { StatusBadge, SeverityBadge, TrustBadge, SkeletonCard, EmptyState } from './ui';
import { IssueDetailPanel } from './issue-detail-panel';

type FilterTab = 'all' | VerificationStatus;

const FILTER_TABS: { key: FilterTab; label: string; count?: (issues: MockIssue[]) => number }[] = [
  { key: 'all',            label: 'All' },
  { key: 'PENDING',        label: 'Pending' },
  { key: 'SUSPICIOUS',     label: 'Suspicious' },
  { key: 'NEEDS_EVIDENCE', label: 'Needs Evidence' },
  { key: 'DUPLICATE',      label: 'Duplicate' },
  { key: 'IN_REVIEW',      label: 'In Review' },
  { key: 'VERIFIED',       label: 'Verified' },
  { key: 'REJECTED',       label: 'Rejected' },
];

export function VerificationConsole() {
  const [issues, setIssues] = useState<MockIssue[]>(MOCK_ISSUES);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedIssue, setSelectedIssue] = useState<MockIssue | null>(null);
  const [isLoading] = useState(false);

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'all') return issues;
    return issues.filter((i) => i.verificationStatus === activeFilter);
  }, [issues, activeFilter]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: issues.length };
    for (const issue of issues) {
      counts[issue.verificationStatus] = (counts[issue.verificationStatus] || 0) + 1;
    }
    return counts;
  }, [issues]);

  const handleAction = (issueId: string, newStatus: VerificationStatus, reason: string) => {
    setIssues((prev) =>
      prev.map((iss) =>
        iss.id === issueId ? { ...iss, verificationStatus: newStatus } : iss
      )
    );
    // In production, this would call the backend VerificationService.transitionStatus()
    console.log(`[Verification] Issue ${issueId} → ${newStatus}: ${reason}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Verification Console</h1>
            <p className="text-sm text-text-secondary mt-1">Review and verify pending civic reports</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface-secondary px-4 py-2 rounded-lg border border-border-primary">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>{issues.length} total reports</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs — horizontally scrollable on mobile */}
      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Filter by verification status">
          {FILTER_TABS.map(({ key, label }) => {
            const count = tabCounts[key] || 0;
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(key)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-elevation-1'
                    : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-tertiary text-text-tertiary'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState filterLabel={activeFilter} />
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue, index) => (
            <button
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className="w-full text-left bg-surface-elevated rounded-xl border border-border-primary p-4 md:p-5 shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-secondary transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 animate-fade-in group"
              style={{ animationDelay: `${Math.min(index, 4) * 50}ms`, animationFillMode: 'backwards' }}
              aria-label={`Review issue: ${issue.title}`}
            >
              {/* Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Severity Indicator */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                    issue.severity === 'CRITICAL' ? 'bg-priority-critical' :
                    issue.severity === 'HIGH' ? 'bg-priority-high' :
                    issue.severity === 'MEDIUM' ? 'bg-priority-medium' : 'bg-priority-low'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {issue.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                  <StatusBadge status={issue.verificationStatus} />
                  <SeverityBadge severity={issue.severity} />
                </div>
              </div>

              {/* Bottom Row — Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-4 text-xs text-text-tertiary">
                {/* Location */}
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {issue.city || 'Unknown'}
                </span>
                {/* Reporter Trust */}
                <TrustBadge level={issue.reporter.trustLevel} score={issue.reporter.trustScore} />
                {/* Evidence count */}
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  {issue.evidence.length} file{issue.evidence.length !== 1 ? 's' : ''}
                </span>
                {/* Risk signals */}
                {issue.riskSignals.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-status-warning font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {issue.riskSignals.length} signal{issue.riskSignals.length !== 1 ? 's' : ''}
                  </span>
                )}
                {/* Duplicates */}
                {issue.duplicateCandidateCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-workflow-duplicate font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {issue.duplicateCandidateCount} dup
                  </span>
                )}
                {/* Timestamp */}
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formatDate(issue.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          onAction={handleAction}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
