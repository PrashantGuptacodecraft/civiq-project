'use client';
import React from 'react';

/**
 * Resolution Quality KPIs & Citizen Outcome Metrics (Phase 43)
 */
export function QualityMetricsWidget({ metrics }) {
  if (!metrics) return null;

  return (
    <section
      aria-labelledby="quality-metrics-title"
      className="p-4 bg-surface-elevated rounded-xl border border-border-primary shadow-elevation-1 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-border-primary/60 pb-2">
        <h2 id="quality-metrics-title" className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
          <span>📊</span> Citizen Resolution Quality
        </h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
          Accountability Live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Confirmation Rate */}
        <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
          <div className="text-[11px] font-bold text-text-tertiary uppercase">Confirmation Rate</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
            {metrics.confirmationRate}%
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">Citizen Verified</div>
        </div>

        {/* KPI 2: Reopen Rate */}
        <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
          <div className="text-[11px] font-bold text-text-tertiary uppercase">Reopen Rate</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
            {metrics.reopenRate}%
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">Rework Requested</div>
        </div>

        {/* KPI 3: Average Rating */}
        <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
          <div className="text-[11px] font-bold text-text-tertiary uppercase">Avg Satisfaction</div>
          <div className="text-xl sm:text-2xl font-black text-text-primary mt-0.5 flex items-center gap-1">
            <span>★</span> {metrics.averageRating}
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">Out of 5 Stars</div>
        </div>

        {/* KPI 4: Total Reviews */}
        <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
          <div className="text-[11px] font-bold text-text-tertiary uppercase">Total Reviews</div>
          <div className="text-xl sm:text-2xl font-black text-primary mt-0.5">
            {metrics.totalReviews}
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">Verified Cases</div>
        </div>
      </div>

      {/* Department Breakdown */}
      {metrics.byDepartment && Object.keys(metrics.byDepartment).length > 0 && (
        <div className="pt-2 border-t border-border-primary/50 space-y-2">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Department Performance
          </div>
          <div className="space-y-1.5">
            {Object.entries(metrics.byDepartment).map(([dept, stats]) => (
              <div
                key={dept}
                className="flex items-center justify-between text-xs p-2 rounded bg-surface-primary border border-border-primary/50"
              >
                <span className="font-semibold text-text-primary truncate max-w-[200px]">{dept}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">{stats.confirmationRate}% confirmed</span>
                  <span className="text-text-tertiary">★ {stats.averageRating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
