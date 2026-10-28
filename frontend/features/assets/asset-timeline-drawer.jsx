'use client';
import React, { useEffect } from 'react';
import {
  ASSET_INTELLIGENCE_DISCLAIMER,
  ASSET_TYPE_LABELS,
  REASON_CODE_LABELS,
  REASON_CODE_BADGES,
  RISK_LEVEL_BADGES,
  ACTION_RECOMMENDATIONS,
} from './types.js';

export function AssetTimelineDrawer({ asset, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!asset) return null;

  const {
    assetTag,
    name,
    description,
    assetType,
    department,
    ward,
    address,
    lifecycleStatus,
    conditionScore,
    ageYears,
    expectedLifespanYears,
    failureCount,
    recentFailureCount,
    totalDowntimeHours,
    daysSinceLastMaintenance,
    mtbfDays,
    riskScore,
    riskLevel,
    recommendedAction,
    reasonCodes = [],
    linkedIssues = [],
    timeline = [],
  } = asset;

  const typeLabel = ASSET_TYPE_LABELS[assetType] || assetType;
  const riskBadgeClass = RISK_LEVEL_BADGES[riskLevel] || 'bg-neutral-500/10 text-neutral-600 border-neutral-500/30';
  const actionLabel = ACTION_RECOMMENDATIONS[recommendedAction] || recommendedAction;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-drawer-title"
    >
      {/* Backdrop touch target */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-2xl bg-surface-primary h-full shadow-2xl flex flex-col border-l border-border-primary overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-surface-primary/95 backdrop-blur z-20 px-6 py-4 border-b border-border-primary flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-surface-secondary text-text-secondary border border-border-primary">
                {assetTag}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {typeLabel}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskBadgeClass}`}>
                {riskLevel} RISK ({Math.round(riskScore * 100)}%)
              </span>
            </div>
            <h2 id="asset-drawer-title" className="text-lg md:text-xl font-bold text-text-primary truncate">
              {name}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              {department} • {ward} • {address}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Close asset details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* AI Advisory Banner */}
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
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-status-info uppercase tracking-wider">
                    AI Predictive Maintenance Advisory • Decision Support Only
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 border border-amber-500/30">
                    {actionLabel}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  {ASSET_INTELLIGENCE_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>

          {/* Asset Health & Risk Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-elevated p-3.5 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Condition Index</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-black ${
                  conditionScore < 50 ? 'text-red-500' : conditionScore < 70 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {conditionScore}
                </span>
                <span className="text-xs text-text-tertiary">/ 100</span>
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    conditionScore < 50 ? 'bg-red-500' : conditionScore < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${conditionScore}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary block mt-1 uppercase font-semibold">
                Status: {lifecycleStatus}
              </span>
            </div>

            <div className="bg-surface-elevated p-3.5 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Failures / Recurrence</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-text-primary">{failureCount}</span>
                <span className="text-xs text-text-secondary">total</span>
              </div>
              <span className="text-[10px] text-red-500 font-semibold block mt-1">
                {recentFailureCount} in last 90 days
              </span>
              <span className="text-[10px] text-text-tertiary block mt-0.5">
                MTBF: ~{mtbfDays} days
              </span>
            </div>

            <div className="bg-surface-elevated p-3.5 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Cumulative Downtime</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-purple-600">{totalDowntimeHours}</span>
                <span className="text-xs text-text-secondary">hrs</span>
              </div>
              <span className="text-[10px] text-text-tertiary block mt-2">
                Last serviced: {daysSinceLastMaintenance}d ago
              </span>
            </div>

            <div className="bg-surface-elevated p-3.5 rounded-xl border border-border-primary">
              <span className="text-xs text-text-tertiary block">Service Age</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-text-primary">{ageYears}</span>
                <span className="text-xs text-text-secondary">/ {expectedLifespanYears}y</span>
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    ageYears / expectedLifespanYears >= 1 ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((ageYears / expectedLifespanYears) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary block mt-1">
                {Math.round((ageYears / expectedLifespanYears) * 100)}% design life elapsed
              </span>
            </div>
          </div>

          {/* Reason Codes */}
          {reasonCodes.length > 0 && (
            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                Predictive Risk Drivers
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {reasonCodes.map((code) => {
                  const badgeClass = REASON_CODE_BADGES[code] || 'bg-surface-secondary text-text-secondary border-border-primary';
                  const label = REASON_CODE_LABELS[code] || code;
                  return (
                    <span
                      key={code}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badgeClass}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border-primary/60 text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary block mb-0.5">Asset Overview</span>
              {description}
            </div>
          )}

          {/* Section: Linked Civic Complaints & Verified Proof */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>Linked Civic Complaints & Verified Proof</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                  {linkedIssues.length}
                </span>
              </h3>
              <span className="text-xs text-text-tertiary">Verified field evidence</span>
            </div>

            {linkedIssues.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-secondary/50 border border-dashed border-border-primary text-center text-xs text-text-tertiary">
                No active citizen complaints linked to this municipal asset.
              </div>
            ) : (
              <div className="space-y-3">
                {linkedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl bg-surface-elevated border border-border-primary hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono font-bold text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded">
                            {issue.id}
                          </span>
                          <span className="text-[11px] font-semibold text-text-tertiary uppercase">
                            {issue.category.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
                              ? 'bg-red-500/10 text-red-600 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            issue.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-text-primary">
                          {issue.title}
                        </h4>
                        <span className="text-[11px] text-text-tertiary block mt-0.5">
                          Reported on {new Date(issue.reportedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Citizen Proof Photo & Caption */}
                    {issue.proofCaption && (
                      <div className="mt-3 pt-3 border-t border-border-primary/60 flex items-start gap-3 bg-surface-secondary/40 p-2.5 rounded-lg">
                        <div className="w-12 h-12 rounded-md bg-surface-secondary border border-border-primary flex items-center justify-center shrink-0 overflow-hidden text-text-tertiary">
                          <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wide block">
                            Verified Citizen Proof Photo
                          </span>
                          <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                            {issue.proofCaption}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Chronological Asset Lifecycle & Maintenance Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>Asset Lifecycle & Maintenance History</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-surface-secondary text-text-secondary">
                  {timeline.length} events
                </span>
              </h3>
              <span className="text-xs text-text-tertiary">Chronological audit</span>
            </div>

            {timeline.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-secondary/50 border border-dashed border-border-primary text-center text-xs text-text-tertiary">
                No recorded maintenance or inspection events.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-primary">
                {timeline.map((event) => {
                  const isMaintenance = event.eventType === 'MAINTENANCE_ACTION';
                  const isIssueLinked = event.eventType === 'CIVIC_ISSUE_LINKED';
                  const isCommission = event.eventType === 'ASSET_INSTALLATION';

                  let markerColor = 'bg-primary';
                  if (isMaintenance) markerColor = 'bg-purple-600';
                  if (isIssueLinked) markerColor = 'bg-amber-500';
                  if (isCommission) markerColor = 'bg-emerald-600';

                  return (
                    <div key={event.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-surface-primary ${markerColor} ring-2 ring-border-primary/50`}
                      />

                      <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-primary">
                              {event.eventType.replace(/_/g, ' ')}
                            </span>
                            {event.workOrderNumber && (
                              <span className="text-xs font-mono font-bold text-primary">
                                {event.workOrderNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-tertiary">
                            {new Date(event.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary mt-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {event.description}
                        </p>

                        {/* Metadata row */}
                        <div className="mt-3 pt-2.5 border-t border-border-primary/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-text-tertiary">
                          {event.actionType && (
                            <span>
                              Action: <strong className="text-text-secondary">{event.actionType}</strong>
                            </span>
                          )}
                          {event.downtimeHours !== undefined && event.downtimeHours > 0 && (
                            <span>
                              Downtime: <strong className="text-purple-600 font-bold">{event.downtimeHours} hrs</strong>
                            </span>
                          )}
                          {event.conditionScore !== undefined && (
                            <span>
                              Post Condition: <strong className="text-text-primary font-bold">{event.conditionScore}/100</strong>
                            </span>
                          )}
                          {event.performedBy && (
                            <span className="truncate max-w-[200px]" title={event.performedBy}>
                              By: {event.performedBy}
                            </span>
                          )}
                          {event.linkConfidence !== undefined && (
                            <span>
                              Match Confidence: <strong className="text-emerald-600 font-bold">{Math.round(event.linkConfidence * 100)}%</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
