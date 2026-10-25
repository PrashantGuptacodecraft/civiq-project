'use client';
import React, { useEffect } from 'react';
import { CATEGORY_LABELS } from './types.js';

export function HotspotDetailDrawer({ hotspot, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!hotspot) return null;

  const {
    name,
    primaryWard,
    intensityScore,
    intensityLevel,
    incidentCount,
    radiusMeters,
    centroid,
    dominantCategory,
    trend,
    categoryBreakdown,
    incidents = [],
    disclaimer,
  } = hotspot;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-lg bg-surface-primary h-full shadow-2xl flex flex-col border-l border-border-primary overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-surface-primary/95 backdrop-blur z-10 px-6 py-4 border-b border-border-primary flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
              {primaryWard}
            </span>
            <h2 id="drawer-title" className="text-lg font-bold text-text-primary mt-0.5">
              {name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close hotspot drill-down"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Mandatory Analytical Non-Causal Banner */}
          <div
            className="rounded-xl bg-status-info/10 border border-status-info/20 p-4"
            role="note"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-status-info shrink-0 mt-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-status-info uppercase tracking-wider">
                  Analytical Observation • Not Causal Proof
                </h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {disclaimer}
                </p>
              </div>
            </div>
          </div>

          {/* Spatial & Intensity Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Cluster Intensity</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-text-primary">{intensityScore}</span>
                <span className="text-xs font-bold text-text-secondary">/ 100</span>
              </div>
              <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    intensityLevel === 'CRITICAL'
                      ? 'bg-red-500'
                      : intensityLevel === 'HIGH'
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${intensityScore}%` }}
                />
              </div>
            </div>

            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Spatial Extent</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-text-primary">{incidentCount}</span>
                <span className="text-xs text-text-secondary">incidents</span>
              </div>
              <span className="text-xs text-text-tertiary block mt-1">
                ~{radiusMeters}m radius (Centroid: {centroid.latitude}, {centroid.longitude})
              </span>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
              Category Breakdown
            </h3>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.categoryId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-text-primary">
                      {CATEGORY_LABELS[cat.categoryId] || cat.categoryId.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-secondary font-semibold">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constituent Incidents List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Constituent Incidents ({incidents.length})
              </h3>
              <span className="text-xs text-text-tertiary">Aggregated within spatial window</span>
            </div>

            <div className="space-y-2.5">
              {incidents.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-xl border border-border-primary bg-surface-elevated text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-text-primary truncate">
                      {issue.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-secondary text-text-secondary">
                      {issue.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-tertiary text-[11px]">
                    <span className="truncate">{issue.address || 'Address provided'}</span>
                    <span className="shrink-0">{issue.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
