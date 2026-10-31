'use client';

import React, { useState } from 'react';
import {
  IMPACT_TYPES,
  IMPACT_TYPE_LABELS,
  IMPACT_STATUS,
} from './types.js';

/**
 * Disaster Impact Live Ground Feed
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - Real-time stream of incoming ground reports
 * - Prominent UNVERIFIED status badges
 * - Category filtering (Flooding, Stranded, Outages, Blocked Roads)
 */
export function DisasterImpactFeed({
  reports = [],
  isLoading = false,
  onRefresh,
}) {
  const [filterType, setFilterType] = useState('ALL');

  const filteredReports =
    filterType === 'ALL'
      ? reports
      : reports.filter((r) => r.impactType === filterType);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-elevation-1 p-5 sm:p-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            Ground Impact Feed
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {filteredReports.length} Reports
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Incoming citizen and responder field observations
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
            filterType === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Impacts
        </button>
        {Object.entries(IMPACT_TYPE_LABELS).map(([typeKey, label]) => (
          <button
            key={typeKey}
            type="button"
            onClick={() => setFilterType(typeKey)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
              filterType === typeKey
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold">Loading live impact reports...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredReports.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-bold text-gray-700">No reports in this category</p>
          <p className="text-xs text-gray-400 mt-1">Ground observations will appear here when submitted.</p>
        </div>
      )}

      {/* Reports List */}
      {!isLoading && filteredReports.length > 0 && (
        <div className="divide-y divide-gray-100 mt-2 space-y-3">
          {filteredReports.map((report) => {
            const isUnverified = report.status === IMPACT_STATUS.UNVERIFIED;
            const isCritical = report.impactDetails?.isLifeThreatening || report.impactDetails?.strandedPersonsCount > 0;

            return (
              <article
                key={report.reportId}
                className={`pt-3 pb-3 rounded-xl p-3 border transition-all ${
                  isCritical
                    ? 'border-red-200 bg-red-50/40'
                    : 'border-gray-100 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* UNVERIFIED badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                          isUnverified
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {report.status}
                      </span>

                      {/* Critical Risk Flag */}
                      {isCritical && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                          Life Safety Risk
                        </span>
                      )}

                      <span className="text-xs text-gray-400 font-mono">
                        {report.reportId}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {report.impactDetails?.title || IMPACT_TYPE_LABELS[report.impactType]}
                    </h3>

                    {report.impactDetails?.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {report.impactDetails.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {report.location?.ward || 'Ward Area'}
                      </span>

                      {report.impactDetails?.waterDepthMeters > 0 && (
                        <span className="font-bold text-blue-700">
                          Depth: {report.impactDetails.waterDepthMeters}m
                        </span>
                      )}

                      {report.impactDetails?.strandedPersonsCount > 0 && (
                        <span className="font-black text-red-700">
                          {report.impactDetails.strandedPersonsCount} Stranded
                        </span>
                      )}

                      <span className="text-gray-400">
                        {new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
