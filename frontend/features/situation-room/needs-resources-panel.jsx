'use client';

import React from 'react';

export function NeedsResourcesPanel({ needs = [], resources = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Verified Emergency Resources & Shelters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span>Verified Resources & Shelters</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {resources.length} Verified
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Designated evacuation shelters, medical camps, and relief depots with live capacity
          </p>
        </div>

        <div className="space-y-3">
          {resources.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No resources registered.</div>
          ) : (
            resources.map((res) => {
              const cap = res.capacity || {};
              const occPct = cap.occupancyPercentage || 0;
              const isNearing = occPct >= 80;
              const isFull = occPct >= 100 || cap.availableCapacity === 0;

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {res.resourceNumber || res.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-slate-200 text-slate-800">
                          {res.resourceType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                        {res.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isFull
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : isNearing
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {res.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  {cap.totalCapacity > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>
                          Occupancy: <strong>{cap.currentOccupancy || 0}</strong> / {cap.totalCapacity}{' '}
                          {cap.unit || 'units'}
                        </span>
                        <span className="font-bold">{occPct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isFull ? 'bg-red-600' : isNearing ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, occPct)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="truncate">📍 {res.location?.address || res.ward}</span>
                    {res.contact?.coordinatorName && (
                      <span className="shrink-0 font-medium text-slate-600">
                        Coord: {res.contact.coordinatorName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Civic Relief Needs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span>Relief & Evacuation Needs</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {needs.length} Requests
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Citizen requests and field triaged relief needs matching to resources
          </p>
        </div>

        <div className="space-y-3">
          {needs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No active relief needs.</div>
          ) : (
            needs.map((need) => (
              <div
                key={need.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {need.needNumber || need.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        {need.needType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                      {need.title}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      need.status === 'ASSIGNMENT_ACCEPTED'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : need.status === 'FULFILLED' || need.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {need.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    Required: <strong>{need.quantity}</strong> {need.unit}
                  </span>
                  <span className="text-red-600 font-semibold uppercase text-[10px]">
                    {need.severity}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate">📍 {need.location?.address || 'Site Location'}</span>
                  {need.contact?.contactName && (
                    <span className="shrink-0 font-medium">Contact: {need.contact.contactName}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
