'use client';

import React from 'react';

export function EventTimelinePanel({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500">
        <p className="text-sm">No timeline events recorded yet for this disaster event.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-extrabold text-slate-900">
          Operational Event Chronology ({timeline.length} Milestones)
        </h2>
        <p className="text-xs text-slate-500">
          Source-verified milestone sequence from alert detection to active response and relief
        </p>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-3 sm:ml-4 space-y-6 py-2">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative pl-6 space-y-1.5">
            {/* Timeline Node Icon */}
            <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm"></div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase bg-slate-100 text-slate-700 tracking-wider">
                {item.stage || 'OPERATION'}
              </span>
              {item.source && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {item.source}
                </span>
              )}
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {item.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
