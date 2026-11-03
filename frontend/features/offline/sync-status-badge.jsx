'use client';
import React from 'react';
import { SYNC_STATUS } from './offline-sync.js';

/**
 * SyncStatusBadge component
 * Shows real-time sync status, offline indicators, and pending mutation counts
 * Follows CivIQ Design System & Motion Tokens with accessible contrast.
 */
export function SyncStatusBadge({
  isOffline,
  queuedCount = 0,
  syncStatus = SYNC_STATUS.IDLE,
  onManualSync,
  lastSyncedAt = null,
}) {
  const isSyncing = syncStatus === SYNC_STATUS.SYNCING;

  // Format timestamp safely without throwing RangeError on invalid dates
  const formattedLastSync = (() => {
    if (!lastSyncedAt) return 'Not yet synced';
    try {
      const d = new Date(lastSyncedAt);
      if (isNaN(d.getTime())) return 'Not yet synced';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Not yet synced';
    }
  })();

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Offline synchronization status"
      className={`w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm font-medium border-b transition-colors duration-200 ${
        isOffline
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : queuedCount > 0
          ? 'bg-blue-50 border-blue-200 text-blue-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
            isOffline
              ? 'bg-amber-500 animate-pulse'
              : queuedCount > 0
              ? 'bg-blue-500'
              : 'bg-emerald-600'
          }`}
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold">
            {isOffline
              ? 'Working Offline'
              : queuedCount > 0
              ? 'Online with pending sync'
              : 'Synced with HQ'}
          </span>
          <span className="text-xs opacity-80">
            {isOffline
              ? 'Field tasks cached locally. Updates will sync automatically.'
              : `Last synced: ${formattedLastSync}`}
          </span>
        </div>

        {queuedCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-current shadow-sm">
            {queuedCount} {queuedCount === 1 ? 'change pending' : 'changes pending'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {queuedCount > 0 && onManualSync && (
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing || isOffline}
            aria-label="Sync queued field mutations now"
            className="min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md bg-white border border-current shadow-sm hover:bg-slate-50 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <span className="inline-flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing...
              </span>
            ) : (
              'Sync Now'
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
