'use client';

import React from 'react';

export function BlockedRoutesPanel({ routes = [] }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500">
        <p className="text-sm">All primary transit corridors and bridges are currently passable.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Impassable Corridors & Blocked Routes</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
              {routes.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time traffic safety barricades, submerged culverts, and structural obstructions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {routes.map((route, idx) => (
          <div
            key={route.reportId || idx}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⛔</span>
                <h3 className="text-sm font-bold text-slate-900">{route.title}</h3>
              </div>
              {route.waterDepthMeters && (
                <span className="px-2.5 py-1 rounded-md text-xs font-black bg-red-600 text-white self-start sm:self-auto">
                  {route.waterDepthMeters}m Water Depth
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {route.description || 'Route completely impassable to two-wheelers and passenger vehicles.'}
            </p>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-200/60">
              <span className="font-medium text-slate-700">
                📍 {route.location?.address || route.location?.ward || 'Corridor location'}
              </span>
              <span className="font-mono text-slate-400">
                Reported: {new Date(route.reportedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
