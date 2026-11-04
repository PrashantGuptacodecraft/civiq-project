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
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-surface-secondary border border-border-primary/70 rounded-xl text-xs"
      aria-live="polite"
    >
      {/* Source & Freshness Metadata */}
      <div className="flex flex-wrap items-center gap-2.5 text-text-tertiary">
        {/* Live dot */}
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
        </span>

        <span className="font-semibold text-text-secondary">
          Data Freshness:
        </span>
        <span className="font-mono text-text-primary font-semibold tracking-tight">
          {formattedTime} IST
        </span>

        <span className="text-border-secondary hidden sm:inline" aria-hidden="true">·</span>

        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-primary border border-border-primary font-mono text-[10px] text-text-tertiary">
          <svg className="w-3 h-3 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {sourceLabel}
        </span>
      </div>

      {/* Refresh Action */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary bg-surface-primary hover:bg-surface-tertiary text-text-primary text-xs font-semibold transition-all duration-150 disabled:opacity-50 min-h-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
        {isRefreshing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}
