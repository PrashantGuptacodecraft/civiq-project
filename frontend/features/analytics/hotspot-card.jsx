'use client';
import React from 'react';
import { CATEGORY_LABELS } from './types.js';

export function HotspotCard({ hotspot, isSelected, onSelect }) {
  const {
    id,
    name,
    primaryWard,
    intensityScore,
    intensityLevel,
    incidentCount,
    radiusMeters,
    dominantCategory,
    dominantSeverity,
    trend,
  } = hotspot;

  // Intensity style mapping
  const intensityColors = {
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    LOW: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
  };

  // Trend style & icon
  const isIncreasing = trend.direction === 'INCREASING';
  const isDecreasing = trend.direction === 'DECREASING';

  return (
    <div
      role="article"
      aria-labelledby={`hotspot-title-${id}`}
      className={`rounded-xl border p-5 transition-all duration-200 bg-surface-elevated ${
        isSelected
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-border-primary hover:border-border-secondary shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
            {primaryWard}
          </span>
          <h3
            id={`hotspot-title-${id}`}
            className="text-base font-bold text-text-primary line-clamp-1 mt-0.5"
          >
            {name}
          </h3>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-full border shrink-0 ${
            intensityColors[intensityLevel] || intensityColors.MEDIUM
          }`}
          aria-label={`Intensity: ${intensityLevel} (${intensityScore}/100)`}
        >
          {intensityLevel} • {intensityScore}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-border-primary text-xs">
        <div>
          <span className="text-text-tertiary block">Concentration</span>
          <span className="font-semibold text-text-primary text-sm">
            {incidentCount} reports
          </span>
          <span className="text-text-tertiary text-[11px] block">
            ~{radiusMeters}m radius
          </span>
        </div>
        <div>
          <span className="text-text-tertiary block">Temporal Trend</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isIncreasing && (
              <span className="inline-flex items-center text-red-600 font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{trend.percentageChange}%
              </span>
            )}
            {isDecreasing && (
              <span className="inline-flex items-center text-emerald-600 font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {trend.percentageChange}%
              </span>
            )}
            {!isIncreasing && !isDecreasing && (
              <span className="inline-flex items-center text-blue-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
                </svg>
                Stable
              </span>
            )}
            <span className="text-text-tertiary text-[11px]">vs prior window</span>
          </div>
        </div>
      </div>

      {/* Category & Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-1">
        <div className="min-w-0">
          <span className="text-[11px] text-text-tertiary block">Dominant Issue</span>
          <span className="text-xs font-medium text-text-secondary truncate block">
            {CATEGORY_LABELS[dominantCategory] || dominantCategory.replace(/_/g, ' ')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(hotspot)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0 min-h-[36px]"
          aria-label={`Inspect ${name}`}
        >
          <span>Examine</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
