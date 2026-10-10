'use client';

import { type VerificationStatus, type IssueSeverity, type TrustLevel } from './mock-data';

/* ── Status Badge ── */
const STATUS_CONFIG: Record<VerificationStatus, { label: string; className: string }> = {
  PENDING:        { label: 'Pending',        className: 'bg-workflow-pending/10 text-workflow-pending border-workflow-pending/20' },
  IN_REVIEW:      { label: 'In Review',      className: 'bg-workflow-in-review/10 text-workflow-in-review border-workflow-in-review/20' },
  VERIFIED:       { label: 'Verified',        className: 'bg-workflow-verified/10 text-workflow-verified border-workflow-verified/20' },
  REJECTED:       { label: 'Rejected',        className: 'bg-workflow-rejected/10 text-workflow-rejected border-workflow-rejected/20' },
  SUSPICIOUS:     { label: 'Suspicious',      className: 'bg-workflow-suspicious/10 text-workflow-suspicious border-workflow-suspicious/20' },
  NEEDS_EVIDENCE: { label: 'Needs Evidence',  className: 'bg-workflow-needs-evidence/10 text-workflow-needs-evidence border-workflow-needs-evidence/20' },
  DUPLICATE:      { label: 'Duplicate',       className: 'bg-workflow-duplicate/10 text-workflow-duplicate border-workflow-duplicate/20' },
};

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}

/* ── Severity Badge ── */
const SEVERITY_CONFIG: Record<IssueSeverity, { label: string; className: string }> = {
  LOW:      { label: 'Low',      className: 'bg-priority-low/10 text-priority-low' },
  MEDIUM:   { label: 'Medium',   className: 'bg-priority-medium/10 text-priority-medium' },
  HIGH:     { label: 'High',     className: 'bg-priority-high/10 text-priority-high' },
  CRITICAL: { label: 'Critical', className: 'bg-priority-critical/10 text-priority-critical' },
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}

/* ── Trust Badge ── */
const TRUST_CONFIG: Record<TrustLevel, { label: string; className: string; icon: string }> = {
  TRUSTED:     { label: 'Trusted',     className: 'text-trust-trusted',     icon: '✓✓' },
  ESTABLISHED: { label: 'Established', className: 'text-trust-established', icon: '✓' },
  NEW:         { label: 'New',         className: 'text-trust-new',         icon: '○' },
  FLAGGED:     { label: 'Flagged',     className: 'text-trust-flagged',     icon: '⚠' },
  SUSPENDED:   { label: 'Suspended',   className: 'text-trust-suspended',   icon: '✕' },
};

export function TrustBadge({ level, score }: { level: TrustLevel; score: number }) {
  const config = TRUST_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.className}`} title={`Trust score: ${score}`}>
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
      <span className="text-text-tertiary font-normal">({score})</span>
    </span>
  );
}

/* ── Skeleton Card ── */
export function SkeletonCard() {
  return (
    <div className="bg-surface-elevated rounded-xl border border-border-primary p-6 space-y-4" role="status" aria-label="Loading">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-48 rounded-md" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-4 w-full rounded-md" />
      <div className="skeleton h-4 w-3/4 rounded-md" />
      <div className="flex gap-3">
        <div className="skeleton h-8 w-24 rounded-md" />
        <div className="skeleton h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({ filterLabel }: { filterLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No reports found</h3>
      <p className="text-text-secondary max-w-sm">
        {filterLabel === 'all'
          ? 'The verification queue is empty. Check back later for new reports.'
          : `No reports with "${filterLabel}" status. Try adjusting your filters.`}
      </p>
    </div>
  );
}

/* ── Error State ── */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h3>
      <p className="text-text-secondary max-w-sm mb-6">
        We couldn&apos;t load the verification queue. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-md h-11 px-6 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </div>
  );
}
