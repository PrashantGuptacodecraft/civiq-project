'use client';

import React from 'react';
import { FieldTask } from './types';

interface TaskCardProps {
  task: FieldTask;
  isActive?: boolean | undefined;
  onSelectTask: (taskId: string) => void;
}

const PRIORITY_BADGE_STYLE: Record<FieldTask['priority'], string> = {
  CRITICAL: 'bg-red-100 text-red-900 border-red-300',
  HIGH: 'bg-orange-100 text-orange-900 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-900 border-amber-300',
  LOW: 'bg-emerald-100 text-emerald-900 border-emerald-300',
};

const STATUS_BADGE_STYLE: Record<FieldTask['status'], string> = {
  ASSIGNED: 'bg-slate-100 text-slate-800 border-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-900 border-blue-300',
  RESOLVED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
};

export function TaskCard({ task, isActive = false, onSelectTask }: TaskCardProps) {
  // Navigation deep-link URL (Google Maps / Apple Maps / Native Geo URI)
  const mapNavUrl = `https://www.google.com/maps/search/?api=1&query=${task.location.latitude},${task.location.longitude}`;

  const isSlaBreached = task.slaStatus === 'BREACHED';
  const isSlaWarning = task.slaStatus === 'WARNING';

  const slaBadgeClass = isSlaBreached
    ? 'bg-red-600 text-white'
    : isSlaWarning
    ? 'bg-amber-500 text-slate-900'
    : 'bg-slate-100 text-slate-700';

  const slaLabel = isSlaBreached
    ? `Overdue (${Math.abs(task.slaHoursRemaining).toFixed(0)}h past SLA)`
    : `${task.slaHoursRemaining.toFixed(0)}h remaining`;

  return (
    <article
      className={`rounded-lg border p-4 shadow-elevation-1 transition-all bg-surface-elevated ${
        isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border-primary hover:border-border-secondary'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${
              PRIORITY_BADGE_STYLE[task.priority]
            }`}
          >
            {task.priority}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
              STATUS_BADGE_STYLE[task.status]
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-tight ${slaBadgeClass}`}
          title={`Target deadline: ${task.dueAt}`}
        >
          ⏱ {slaLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSelectTask(task.id)}
        className="text-left w-full group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
          {task.title}
        </h3>
        <p className="text-xs font-medium text-text-secondary mt-1 flex items-center gap-1.5">
          <span className="text-primary font-bold">📍</span>
          <span className="truncate">{task.location.address}</span>
        </p>
      </button>

      <div className="mt-4 pt-3 border-t border-border-primary/60 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-tertiary">
          #{task.id} • {task.categoryName}
        </span>

        <div className="flex items-center gap-2">
          {/* One-tap Navigation Handoff Button (min touch target >= 44px) */}
          <a
            href={mapNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Navigate to ${task.location.address}`}
            className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Navigate</span>
          </a>

          {/* View Task Button */}
          <button
            type="button"
            onClick={() => onSelectTask(task.id)}
            className="min-h-[44px] px-3.5 flex items-center justify-center text-xs font-bold text-text-primary bg-slate-100 hover:bg-slate-200 rounded-md active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Details →
          </button>
        </div>
      </div>
    </article>
  );
}
