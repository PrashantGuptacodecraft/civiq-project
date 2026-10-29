'use client';

import React from 'react';

/**
 * Emergency Call 112 Handoff Banner
 * Implements high-visibility life-safety handoff per docs/ux/EMERGENCY-UX.md.
 * Minimum 56px touch target for emergency call action.
 */
export function EmergencyHandoffBanner({ onHandoffTriggered, isHandedOff = false }) {
  return (
    <aside
      role="alert"
      aria-label="National Emergency 112 Life Safety Handoff"
      className="w-full bg-red-600 text-white rounded-xl shadow-elevation-2 p-4 md:p-6 mb-6 border-2 border-red-700 transition-all"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Icon & High-Contrast Life Safety Warning */}
        <div className="flex items-start gap-3 md:gap-4 max-w-3xl">
          <div
            className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white text-red-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Immediate Action Required
              </span>
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                Life-Threatening Accident or Hazard?
              </h2>
            </div>
            <p className="text-sm md:text-base text-red-50 mt-1 leading-relaxed">
              CivIQ is a municipal incident reporting network, <strong>not an official emergency dispatch service</strong>.
              If anyone is injured, trapped, or under active hazard (fire, gas leak, live wires), contact emergency responders immediately.
            </p>
          </div>
        </div>

        {/* Right: Large 56px Touch Target Call 112 Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          <a
            href="tel:112"
            onClick={() => onHandoffTriggered && onHandoffTriggered('112')}
            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-red-700 hover:bg-red-50 active:bg-red-100 font-black text-base md:text-lg tracking-wide shrink-0 transition-colors shadow-elevation-2 focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-700 min-h-[56px] min-w-[180px] text-center"
            aria-label="Call 112 National Emergency Hotline now (free and 24/7)"
          >
            <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>Call 112 Now</span>
          </a>

          {/* Auxiliary Helpline Shortcuts */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-100">
            <span>Alt:</span>
            <a href="tel:108" className="underline hover:text-white" title="Ambulance">108 (Ambulance)</a>
            <span>•</span>
            <a href="tel:101" className="underline hover:text-white" title="Fire">101 (Fire)</a>
            <span>•</span>
            <a href="tel:100" className="underline hover:text-white" title="Police">100 (Police)</a>
          </div>
        </div>
      </div>

      {isHandedOff && (
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-red-100 font-medium">
          <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Official emergency handoff registered with CAD-112 hotline. Local CivIQ record held in UNVERIFIED state.</span>
        </div>
      )}
    </aside>
  );
}
