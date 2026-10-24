'use client';

import React from 'react';

interface OfflineBannerProps {
  isOffline;
  queuedCount;
  isSyncing?;
  onManualSync?() => void;
}

export function OfflineBanner({
  isOffline,
  queuedCount,
  isSyncing = false,
  onManualSync,
}) {
  if (!isOffline && queuedCount === 0) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm font-medium border-b transition-colors ${
        isOffline
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-blue-50 border-blue-200 text-blue-900'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isOffline ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
          }`}
          aria-hidden="true"
        />
        <span>
          {isOffline
            ? 'You are offline. Changes will sync when connected.'
            : 'Online. Pending background sync.'}
        </span>
        {queuedCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white/80 border border-current shadow-sm">
            {queuedCount} queued
          </span>
        )}
      </div>

      {queuedCount > 0 && onManualSync && (
        <button
          type="button"
          onClick={onManualSync}
          disabled={isSyncing}
          className="min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md bg-white border border-current shadow-sm hover:bg-slate-50 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </aside>
  );
}