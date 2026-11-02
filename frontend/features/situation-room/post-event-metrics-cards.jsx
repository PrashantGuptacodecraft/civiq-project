'use client';

import React from 'react';

export function PostEventMetricsCards({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Evacuees Sheltered */}
      <div className="animate-fade-up anim-delay-50 card-hover bg-surface-elevated rounded-xl p-4 shadow-elevation-1 border border-border-primary flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-tertiary mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Persons Sheltered</span>
          <span className="text-lg" aria-hidden="true">🏕️</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {metrics.totalPersonsSheltered || 0}
          </div>
          <div className="text-[11px] text-text-tertiary mt-1 flex items-center justify-between">
            <span>{metrics.operationalSheltersCount || 2} Active Shelters</span>
            <span className="font-semibold text-status-info">
              {metrics.overallShelterOccupancyPercentage || 59.1}% capacity
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stranded Citizens Rescued */}
      <div className="animate-fade-up anim-delay-100 card-hover bg-surface-elevated rounded-xl p-4 shadow-elevation-1 border border-border-primary flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-tertiary mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Rescues Completed</span>
          <span className="text-lg" aria-hidden="true">🚤</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-status-success tracking-tight">
            {metrics.totalPersonsRescued || 4}
          </div>
          <div className="text-[11px] text-text-tertiary mt-1 flex items-center justify-between">
            <span>Aquatic Boat Crews</span>
            <span className="font-semibold text-status-success">100% Extracted</span>
          </div>
        </div>
      </div>

      {/* 3. Blocked Routes */}
      <div className="animate-fade-up anim-delay-150 card-hover bg-surface-elevated rounded-xl p-4 shadow-elevation-1 border border-border-primary flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-tertiary mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Road Blockages</span>
          <span className="text-lg" aria-hidden="true">🚧</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-status-warning tracking-tight">
            {metrics.activeRoadBlockagesCount || 1}
          </div>
          <div className="text-[11px] text-text-tertiary mt-1 flex items-center justify-between">
            <span>Baba Bhide Causeway</span>
            <span className="font-semibold text-status-warning">1.5m Submerged</span>
          </div>
        </div>
      </div>

      {/* 4. Response Tasks & Dispatch Latency */}
      <div className="animate-fade-up anim-delay-200 card-hover bg-surface-elevated rounded-xl p-4 shadow-elevation-1 border border-border-primary flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-tertiary mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Response Tasks</span>
          <span className="text-lg" aria-hidden="true">⏱️</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {metrics.responseTasksCompleted || 0} / {metrics.responseTasksTotal || 0}
          </div>
          <div className="text-[11px] text-text-tertiary mt-1 flex items-center justify-between">
            <span>Avg Dispatch Latency</span>
            <span className="font-bold text-text-secondary">
              {metrics.averageDispatchLatencyMinutes || 14.5}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
