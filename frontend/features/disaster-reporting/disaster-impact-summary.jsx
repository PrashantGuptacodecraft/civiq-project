'use client';

import React from 'react';
import { IMPACT_TYPES } from './types.js';

/**
 * Disaster Impact Aggregated Metrics Summary Card
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - High-level situational rollup for municipal coordinators & response teams
 * - Stranded persons count, critical hazard counts, and unverified ratio
 */
export function DisasterImpactSummary({
  summary = null,
  reports = [],
}) {
  // If summary object provided by API, use it; otherwise compute from reports array
  const total = summary?.totalReports ?? reports.length;
  const critical =
    summary?.criticalLifeSafetyCount ??
    reports.filter((r) => r.impactDetails?.isLifeThreatening || r.impactDetails?.strandedPersonsCount > 0).length;

  const stranded =
    summary?.totalStrandedPersonsEstimated ??
    reports.reduce((acc, r) => acc + (r.impactDetails?.strandedPersonsCount || 0), 0);

  const floodingCount =
    summary?.breakdownByType?.[IMPACT_TYPES.FLOODING_WATERLOGGING] ??
    reports.filter((r) => r.impactType === IMPACT_TYPES.FLOODING_WATERLOGGING).length;

  const blockedRoadCount =
    summary?.breakdownByType?.[IMPACT_TYPES.BLOCKED_ROAD_DEBRIS] ??
    reports.filter((r) => r.impactType === IMPACT_TYPES.BLOCKED_ROAD_DEBRIS).length;

  const utilityOutageCount =
    summary?.breakdownByType?.[IMPACT_TYPES.UTILITY_OUTAGE] ??
    reports.filter((r) => r.impactType === IMPACT_TYPES.UTILITY_OUTAGE).length;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-elevation-1 p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">
            Situational Impact Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time ground situation metrics across affected wards
          </p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {summary?.disasterTitle || 'Active Disaster Area'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {/* Total Reports */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
            Total Reports
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">
            {total}
          </span>
        </div>

        {/* Life Safety Critical */}
        <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide block">
            Life Safety Risk
          </span>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            {critical}
          </span>
        </div>

        {/* Stranded Persons */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
            Stranded People
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {stranded}
          </span>
        </div>

        {/* Flooding Points */}
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide block">
            Flood Points
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {floodingCount}
          </span>
        </div>

        {/* Blocked Roads */}
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 text-center">
          <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide block">
            Blocked Roads
          </span>
          <span className="text-2xl font-black text-orange-700 mt-1 block">
            {blockedRoadCount}
          </span>
        </div>

        {/* Utility Outages */}
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 text-center">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide block">
            Power Outages
          </span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">
            {utilityOutageCount}
          </span>
        </div>
      </div>
    </div>
  );
}
