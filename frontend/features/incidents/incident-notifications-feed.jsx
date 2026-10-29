'use client';

import React from 'react';

/**
 * Incident Notifications Feed
 * Displays in-app notifications generated during incident lifecycle (UNVERIFIED intake, 112 handoff, responder confirmation, closure).
 */
export function IncidentNotificationsFeed({ notifications = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-4 animate-pulse space-y-3">
        <div className="h-4 bg-surface-tertiary rounded w-1/4" />
        <div className="h-12 bg-surface-tertiary rounded w-full" />
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-4 md:p-6 shadow-elevation-1 space-y-3">
      <h4 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center gap-2">
        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Incident Notification Log ({notifications.length})
      </h4>

      {notifications.length === 0 ? (
        <p className="text-xs text-text-secondary italic">No notifications generated yet for this incident.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, idx) => (
            <div
              key={notif.id || idx}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                notif.read
                  ? 'bg-surface-secondary/70 border-border-primary text-text-secondary'
                  : 'bg-primary/5 border-primary/20 text-text-primary font-medium'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-text-primary">
                  {notif.title}
                </span>
                <span className="text-[10px] text-text-tertiary font-mono">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {notif.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
