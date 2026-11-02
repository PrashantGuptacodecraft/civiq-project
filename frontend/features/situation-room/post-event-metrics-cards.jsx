'use client';

import React from 'react';

export function PostEventMetricsCards({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Evacuees Sheltered */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Persons Sheltered</span>
          <span className="text-lg">🏕️</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.totalPersonsSheltered || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{metrics.operationalSheltersCount || 2} Active Shelters</span>
            <span className="font-semibold text-blue-600">
              {metrics.overallShelterOccupancyPercentage || 59.1}% capacity
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stranded Citizens Rescued */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Rescues Completed</span>
          <span className="text-lg">🚤</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {metrics.totalPersonsRescued || 4}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Aquatic Boat Crews</span>
            <span className="font-semibold text-emerald-700">100% Extracted</span>
          </div>
        </div>
      </div>

      {/* 3. Blocked Routes */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Road Blockages</span>
          <span className="text-lg">🚧</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
            {metrics.activeRoadBlockagesCount || 1}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Baba Bhide Causeway</span>
            <span className="font-semibold text-amber-700">1.5m Submerged</span>
          </div>
        </div>
      </div>

      {/* 4. Response Tasks & Dispatch Latency */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Response Tasks</span>
          <span className="text-lg">⏱️</span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {metrics.responseTasksCompleted || 0} / {metrics.responseTasksTotal || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Avg Dispatch Latency</span>
            <span className="font-bold text-slate-700">
              {metrics.averageDispatchLatencyMinutes || 14.5}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
