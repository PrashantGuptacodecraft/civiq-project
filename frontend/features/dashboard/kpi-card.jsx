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
      iconBg: 'bg-primary/10 text-primary',
      accentBar: 'bg-primary',
      ring: 'ring-primary/40',
      activeGlow: 'shadow-glow-primary',
      valueColor: 'text-text-primary',
      hoverBorder: 'hover:border-primary/40',
    },
    warning: {
      iconBg: 'bg-status-warning/10 text-status-warning',
      accentBar: 'bg-status-warning',
      ring: 'ring-status-warning/40',
      activeGlow: 'shadow-[0_0_0_3px_rgba(245,158,11,0.15),0_4px_16px_rgba(245,158,11,0.1)]',
      valueColor: 'text-text-primary',
      hoverBorder: 'hover:border-status-warning/40',
    },
    error: {
      iconBg: 'bg-priority-critical/10 text-priority-critical',
      accentBar: 'bg-priority-critical',
      ring: 'ring-priority-critical/40',
      activeGlow: 'shadow-glow-error',
      valueColor: 'text-priority-critical',
      hoverBorder: 'hover:border-priority-critical/40',
    },
    success: {
      iconBg: 'bg-status-success/10 text-status-success',
      accentBar: 'bg-status-success',
      ring: 'ring-status-success/40',
      activeGlow: 'shadow-glow-success',
      valueColor: 'text-status-success',
      hoverBorder: 'hover:border-status-success/40',
    },
    neutral: {
      iconBg: 'bg-surface-tertiary text-text-secondary',
      accentBar: 'bg-border-secondary',
      ring: 'ring-border-secondary',
      activeGlow: 'shadow-elevation-2',
      valueColor: 'text-text-primary',
      hoverBorder: 'hover:border-border-secondary',
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
      className={`group relative flex flex-col p-5 rounded-2xl bg-surface-elevated border transition-all duration-200 cursor-pointer overflow-hidden outline-none ${
        isActive
          ? `border-primary/30 ring-2 ${scheme.ring} ${scheme.activeGlow} bg-primary/[0.02]`
          : `border-border-primary hover:shadow-card-hover ${scheme.hoverBorder} hover:border-opacity-100`
      }`}
      style={!isActive ? { boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)' } : undefined}
      aria-label={`${title}: ${value} ${unit}. Tap to drill down into issues.`}
      aria-pressed={isActive}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${scheme.accentBar} transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}
        aria-hidden="true"
      />

      {/* Subtle hover bg */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-secondary opacity-0 group-hover:opacity-60 transition-opacity duration-200 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top row: title + icon */}
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary leading-tight pt-0.5">
          {title}
        </span>
        {icon && (
          <div className={`flex-shrink-0 p-2 rounded-xl ${scheme.iconBg} transition-transform duration-150 group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>

      {/* Main metric value */}
      <div className="relative flex items-baseline gap-1.5 mb-1">
        <span className={`text-3xl sm:text-[2.25rem] font-black tracking-tight leading-none ${scheme.valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-text-tertiary">
            {unit}
          </span>
        )}
      </div>

      {/* Sublabel */}
      <p className="relative text-xs text-text-tertiary font-medium leading-relaxed flex-1">
        {sublabel}
      </p>

      {/* Footer */}
      <div className="relative flex items-center justify-between pt-3 mt-3 border-t border-border-primary/60 text-xs">
        {trend ? (
          <span
            className={`font-bold inline-flex items-center gap-1 ${
              trendPositive ? 'text-status-success' : 'text-priority-critical'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={trendPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
            {trend}
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary font-medium">Real-time KPI</span>
        )}

        <span className="inline-flex items-center gap-1 text-primary font-semibold text-[11px] group-hover:gap-1.5 transition-all duration-150">
          Drill Down →
        </span>
      </div>
    </div>
  );
}
