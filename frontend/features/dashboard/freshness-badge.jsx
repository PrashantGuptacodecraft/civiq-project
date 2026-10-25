'use client';
import React from 'react';
import { SOURCE_LABELS } from './types.js';

export function FreshnessBadge({
  lastUpdated = new Date(),
  onRefresh,
  isRefreshing = false,
  sourceLabel = SOURCE_LABELS.PRIMARY,
}) {
  const formattedTime = new Date(lastUpdated).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-secondary border border-border-primary rounded-xl text-xs text-text-secondary"
      aria-live="polite"
    >
      {/* Source & Freshness Metadata */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
        </span>

        <span className="font-semibold text-text-primary">
          Data Freshness:
        </span>
        <span className="font-mono text-text-secondary">
          {formattedTime} IST
        </span>

        <span className="text-border-secondary hidden sm:inline">•</span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-primary border border-border-secondary font-mono text-[10px] text-text-tertiary">
          <svg className="w-3 h-3 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Source: {sourceLabel}
        </span>
      </div>

      {/* Manual Refresh Action */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary bg-surface-primary hover:bg-surface-tertiary active:bg-surface-secondary text-text-primary text-xs font-semibold transition-colors disabled:opacity-50 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        aria-label="Refresh command dashboard metrics"
      >
        <svg
          className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-text-secondary'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isRefreshing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
