'use client';
import React from 'react';

export function AccessibleIssueList({
  issues = [],
  selectedIssue = null,
  onSelectIssue,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface-primary rounded-xl border border-border-primary p-8 text-center space-y-3">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-text-secondary">Loading accessible issue registry...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="w-full bg-surface-primary rounded-xl border border-border-primary p-8 text-center space-y-2">
        <p className="text-base font-semibold text-text-primary">No issues matching active filters</p>
        <p className="text-sm text-text-secondary">
          Try adjusting status, priority, department, or search keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-primary rounded-xl border border-border-primary overflow-hidden shadow-elevation-1">
      {/* Screen Reader Notice */}
      <div className="sr-only" aria-live="polite">
        Showing {issues.length} operational civic issues.
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" aria-label="Operational civic issues list">
          <thead className="bg-surface-secondary border-b border-border-primary text-xs uppercase text-text-tertiary">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Priority</th>
              <th scope="col" className="px-4 py-3 font-semibold">Issue Title & Category</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Department</th>
              <th scope="col" className="px-4 py-3 font-semibold">Jurisdiction</th>
              <th scope="col" className="px-4 py-3 font-semibold">Verification</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {issues.map((issue) => {
              const isSelected = selectedIssue?.id === issue.id;
              const isCritical = issue.severity === 'CRITICAL';

              return (
                <tr
                  key={issue.id}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-surface-secondary'
                  }`}
                  onClick={() => onSelectIssue(issue)}
                >
                  {/* Priority Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        isCritical
                          ? 'bg-priority-critical text-text-inverse'
                          : issue.severity === 'HIGH'
                          ? 'bg-priority-high text-text-inverse'
                          : 'bg-surface-tertiary text-text-secondary'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </td>

                  {/* Title & Category Column */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-text-primary line-clamp-1">
                      {issue.title}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                      {issue.categoryName || issue.categoryId} • {issue.address}
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {issue.status}
                    </span>
                  </td>

                  {/* Department Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-secondary">
                    {issue.department || 'General Admin'}
                  </td>

                  {/* Jurisdiction Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-secondary">
                    {issue.jurisdictionName || issue.jurisdictionId || 'PMC Pune'}
                  </td>

                  {/* Verification Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        issue.verificationStatus === 'VERIFIED'
                          ? 'bg-status-success/10 text-status-success'
                          : issue.verificationStatus === 'IN_REVIEW'
                          ? 'bg-status-info/10 text-status-info'
                          : 'bg-status-warning/15 text-status-warning'
                      }`}
                    >
                      {issue.verificationStatus}
                    </span>
                  </td>

                  {/* Action Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue(issue);
                      }}
                      className="px-3 py-1.5 rounded-md border border-border-primary text-xs font-medium text-text-primary hover:bg-surface-tertiary transition-colors min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Visible on mobile) */}
      <div className="md:hidden divide-y divide-border-primary">
        {issues.map((issue) => {
          const isSelected = selectedIssue?.id === issue.id;
          const isCritical = issue.severity === 'CRITICAL';

          return (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectIssue(issue);
                }
              }}
              className={`p-4 transition-colors cursor-pointer space-y-2.5 ${
                isSelected ? 'bg-primary/5' : 'hover:bg-surface-secondary active:bg-surface-tertiary'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    isCritical
                      ? 'bg-priority-critical text-text-inverse'
                      : 'bg-surface-tertiary text-text-secondary'
                  }`}
                >
                  {issue.severity}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                  {issue.status}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary text-sm leading-snug">
                  {issue.title}
                </h3>
                <p className="text-xs text-text-tertiary mt-1">
                  {issue.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-text-secondary pt-1 border-t border-border-primary/50">
                <span>{issue.department}</span>
                <span className="text-primary font-medium">Tap to Inspect →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
