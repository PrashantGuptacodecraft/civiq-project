'use client';
import React from 'react';

export function EmergencyBanner() {
  return (
    <aside
      role="alert"
      aria-label="Emergency Services Notice"
      className="relative overflow-hidden bg-gradient-to-r from-red-500/10 via-red-500/5 to-orange-500/10 border border-red-500/25 rounded-2xl p-4 sm:p-5 mb-6 text-text-primary shadow-sm"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
            aria-hidden="true"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-red-700 tracking-tight">
                Is this a life-threatening emergency?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              CivIQ is an asynchronous municipal triage platform, <strong>not an emergency dispatch service</strong>.
              If you are reporting an active fire, crime in progress, gas leak, or critical accident, contact emergency responders immediately.
            </p>
          </div>
        </div>

        <a
          href="tel:112"
          className="btn-press inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm tracking-wide shrink-0 transition-all shadow-md shadow-red-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 min-h-[44px] min-w-[124px]"
          aria-label="Call 112 National Emergency Hotline immediately"
        >
          <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          Call 112
        </a>
      </div>
    </aside>
  );
}
