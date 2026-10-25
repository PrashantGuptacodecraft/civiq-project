'use client';
import React from 'react';

export function WardBreakdown({
  wards = [],
  onSelectWard,
  selectedWard = 'ALL',
}) {
  if (wards.length === 0) {
    return (
      <div className="bg-surface-primary border border-border-primary rounded-2xl p-6 text-center text-sm text-text-secondary">
        No administrative ward metrics available.
      </div>
    );
  }

  return (
    <div className="bg-surface-primary border border-border-primary rounded-2xl p-4 sm:p-5 shadow-elevation-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary">
            Jurisdiction &amp; Ward Distribution
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Geographic distribution of issues, critical incidents, and SLA compliance across PMC and PCMC wards.
          </p>
        </div>
        <span className="text-xs text-text-tertiary">
          Tap card to filter
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {wards.map((ward) => {
          const isSelected = selectedWard === ward.wardId;
          const hasCritical = ward.criticalCount > 0;

          return (
            <div
              key={ward.wardId}
              onClick={() => onSelectWard(ward.wardId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectWard(ward.wardId);
                }
              }}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-elevation-2'
                  : 'border-border-primary bg-surface-secondary hover:border-border-secondary hover:shadow-elevation-1'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm text-text-primary line-clamp-1">
                  {ward.wardName}
                </h3>
                {hasCritical && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-priority-critical text-text-inverse uppercase shrink-0">
                    {ward.criticalCount} Critical
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-border-primary/60">
                <div>
                  <span className="text-[10px] text-text-tertiary block">Total</span>
                  <span className="font-extrabold text-text-primary">{ward.totalIssues}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-tertiary block">Open</span>
                  <span className="font-extrabold text-primary">{ward.openCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-tertiary block">SLA Breached</span>
                  <span className={`font-extrabold ${ward.slaBreachedCount > 0 ? 'text-priority-critical' : 'text-status-success'}`}>
                    {ward.slaBreachedCount}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-text-secondary">
                <span>Compliance: {ward.slaComplianceRate}%</span>
                <span className="text-primary hover:underline">Select Ward →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
