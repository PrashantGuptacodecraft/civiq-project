'use client';
import React from 'react';

export function KpiCard({
  title,
  value,
  unit = '',
  sublabel,
  trend,
  trendPositive = true,
  statusColor = 'primary', // 'primary' | 'warning' | 'error' | 'success' | 'neutral'
  icon,
  onClickDrillDown,
  isActive = false,
}) {
  const colorMap = {
    primary: {
      badgeBg: 'bg-primary/10 text-primary',
      accentBorder: 'border-l-primary',
      hoverRing: 'hover:border-primary',
    },
    warning: {
      badgeBg: 'bg-status-warning/15 text-status-warning',
      accentBorder: 'border-l-status-warning',
      hoverRing: 'hover:border-status-warning',
    },
    error: {
      badgeBg: 'bg-priority-critical/10 text-priority-critical',
      accentBorder: 'border-l-priority-critical',
      hoverRing: 'hover:border-priority-critical',
    },
    success: {
      badgeBg: 'bg-status-success/10 text-status-success',
      accentBorder: 'border-l-status-success',
      hoverRing: 'hover:border-status-success',
    },
    neutral: {
      badgeBg: 'bg-surface-tertiary text-text-secondary',
      accentBorder: 'border-l-border-secondary',
      hoverRing: 'hover:border-border-secondary',
    },
  };

  const scheme = colorMap[statusColor] || colorMap.primary;

  return (
    <div
      onClick={onClickDrillDown}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClickDrillDown) onClickDrillDown();
        }
      }}
      className={`relative p-5 rounded-2xl bg-surface-primary border border-l-4 ${scheme.accentBorder} shadow-elevation-1 transition-all cursor-pointer ${
        isActive
          ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-elevation-2'
          : `border-border-primary hover:shadow-elevation-2 ${scheme.hoverRing}`
      }`}
      aria-label={`${title}: ${value} ${unit}. Tap to drill down into issues.`}
    >
      {/* Top Header: Title & Icon */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg ${scheme.badgeBg}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-text-secondary">
            {unit}
          </span>
        )}
      </div>

      {/* Sublabel context */}
      <p className="text-xs text-text-secondary mt-1 font-medium">
        {sublabel}
      </p>

      {/* Footer: Trend and Drill-Down Callout */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-primary/60 text-xs">
        {trend ? (
          <span
            className={`font-semibold inline-flex items-center gap-1 ${
              trendPositive ? 'text-status-success' : 'text-priority-critical'
            }`}
          >
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary">Real-time KPI</span>
        )}

        <span className="text-primary font-semibold hover:underline flex items-center gap-1">
          Drill Down →
        </span>
      </div>
    </div>
  );
}
