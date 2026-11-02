'use client';

import React from 'react';
import { DISASTER_OPS_DISCLAIMER } from './types.js';

export function EventCommandHeader({ disaster, activeAlerts = [] }) {
  if (!disaster) return null;

  return (
    <header className="bg-slate-900 text-white rounded-2xl shadow-xl p-5 border border-slate-800 space-y-4">
      {/* Top Banner: Statutory Precedence Notice */}
      <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5">⚠️</span>
        <p className="text-xs text-amber-200 leading-relaxed font-medium">
          {DISASTER_OPS_DISCLAIMER}
        </p>
      </div>

      {/* Main Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
              {disaster.severity || 'SEVERE_EMERGENCY'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {disaster.lifecycleState || 'ACTIVE_RESPONSE'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              {disaster.jurisdictionIds?.[0] || 'mh-pune-pmc'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {disaster.disasterNumber || disaster.id}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {disaster.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {disaster.description}
          </p>
        </div>

        {/* Live System Beacon */}
        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 self-start md:self-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">SITUATION ROOM LIVE</div>
            <div className="text-[10px] text-slate-400">
              Declared: {new Date(disaster.declaredAt || disaster.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Official Alert Flash Ticker if available */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-red-700 text-white font-black text-[10px] tracking-wider uppercase">
              OFFICIAL SACHET ALERT
            </span>
            <span className="text-red-200 font-medium truncate max-w-xl">
              {activeAlerts[0].headline || activeAlerts[0].alertHeadline || 'Severe flood warning active for Mutha Basin'}
            </span>
          </div>
          <span className="text-[11px] text-red-300 shrink-0 font-mono">
            {activeAlerts[0].authority || 'SACHET / NDMA'}
          </span>
        </div>
      )}
    </header>
  );
}
