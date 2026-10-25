'use client';
import React from 'react';

export function DrillDownDrawer({
  isOpen = false,
  onClose,
  title = 'Issue Drill-Down',
  metricKey = 'all',
  issues = [],
  onSelectIssue,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-surface-primary border-l border-border-primary shadow-elevation-4 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      role="dialog"
      aria-labelledby="drill-down-heading"
      aria-modal="true"
    >
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-border-primary bg-surface-secondary/70 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
              Metric: {metricKey.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-tertiary">
              {issues.length} {issues.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <h2 id="drill-down-heading" className="text-lg font-extrabold text-text-primary">
            {title}
          </h2>
        </div>

        {/* Close Button (Touch target >= 44x44px) */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-tertiary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          aria-label="Close drill-down panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drawer Body - Scrollable Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {issues.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No issues matching the selected drill-down criteria.
          </div>
        ) : (
          issues.map((issue) => {
            const isCritical = issue.severity === 'CRITICAL';

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue && onSelectIssue(issue)}
                className="p-3.5 rounded-xl border border-border-primary bg-surface-secondary hover:bg-surface-tertiary transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCritical
                        ? 'bg-priority-critical text-text-inverse'
                        : issue.severity === 'HIGH'
                        ? 'bg-priority-high text-text-inverse'
                        : 'bg-surface-primary text-text-secondary border border-border-secondary'
                    }`}
                  >
                    {issue.severity}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {issue.isSlaBreached && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-priority-critical/15 text-priority-critical">
                        ⚠️ SLA Breached
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      {issue.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-text-primary line-clamp-1">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                    {issue.address || issue.wardName || 'PMC Pune'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border-primary/50">
                  <span>{issue.department}</span>
                  <span className="font-medium text-primary">Details →</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-border-primary bg-surface-primary flex items-center justify-between">
        <span className="text-xs text-text-tertiary font-mono">
          Showing {issues.length} item(s)
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border-primary text-text-secondary hover:bg-surface-secondary text-sm font-medium min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          Close Drill-Down
        </button>
      </div>
    </div>
  );
}
