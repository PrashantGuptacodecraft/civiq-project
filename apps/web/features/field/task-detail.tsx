'use client';

import React, { useState } from 'react';
import { FieldTask, FieldWorkerProfile } from './types';

interface TaskDetailProps {
  task: FieldTask;
  currentWorker: FieldWorkerProfile;
  onBack: () => void;
  onStartProgress: (taskId: string) => Promise<void>;
  onUpdateNotes: (taskId: string, notes: string) => Promise<void>;
  onResolveTask: (taskId: string, resolutionNotes: string) => Promise<void>;
}

export function TaskDetail({
  task,
  currentWorker,
  onBack,
  onStartProgress,
  onUpdateNotes,
  onResolveTask,
}: TaskDetailProps) {
  const [fieldNotes, setFieldNotes] = useState(task.notes || '');
  const [resolutionNotes, setResolutionNotes] = useState(task.resolutionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Authorization Check: Data restricted to assigned jurisdiction/worker
  const isAuthorized =
    task.jurisdictionId === currentWorker.jurisdictionId ||
    task.assignedWorkerId === currentWorker.id;

  const mapNavUrl = `https://www.google.com/maps/search/?api=1&query=${task.location.latitude},${task.location.longitude}`;

  if (!isAuthorized) {
    return (
      <main className="p-4 max-w-lg mx-auto" aria-labelledby="auth-denied-title">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 text-sm font-bold text-primary flex items-center gap-1 mb-4 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Back to Tasks
        </button>

        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center space-y-3">
          <div className="text-3xl">🚫</div>
          <h2 id="auth-denied-title" className="text-lg font-bold text-red-900">
            Access Restricted
          </h2>
          <p className="text-sm text-red-800">
            This task belongs to jurisdiction <strong>{task.jurisdictionName}</strong> (#{task.jurisdictionId}) and worker <strong>{task.assignedWorkerName}</strong>.
          </p>
          <p className="text-xs text-red-700">
            You are logged in as <strong>{currentWorker.name}</strong> ({currentWorker.jurisdictionName}). Data access is strictly compartmentalized to your assigned jurisdiction.
          </p>
        </div>
      </main>
    );
  }

  const handleStartWork = async () => {
    setIsSubmitting(true);
    try {
      await onStartProgress(task.id);
      setSuccessMessage('Task marked as IN PROGRESS. Stay safe in the field!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateNotes(task.id, fieldNotes);
      setSuccessMessage('Field notes saved.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;

    setIsSubmitting(true);
    try {
      await onResolveTask(task.id, resolutionNotes);
      setShowResolveModal(false);
      setSuccessMessage('Task marked as RESOLVED! Field report submitted.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4 pb-24" aria-labelledby="task-detail-title">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border-primary">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 text-sm font-bold text-primary flex items-center gap-1.5 rounded-md hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Back
        </button>
        <span className="text-xs font-mono font-bold text-text-tertiary">
          #{task.id}
        </span>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="alert"
          className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-sm font-semibold flex items-center gap-2 animate-fadeIn"
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Primary Header Card */}
      <div className="p-4 bg-surface-elevated rounded-lg border border-border-primary shadow-elevation-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-slate-900 text-white">
            {task.priority} Priority
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold border bg-blue-50 text-blue-800 border-blue-200">
            {task.status.replace('_', ' ')}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 ml-auto">
            ⏱ Due: {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h1 id="task-detail-title" className="text-lg md:text-xl font-bold text-text-primary leading-tight pt-1">
          {task.title}
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed">
          {task.description}
        </p>

        <div className="pt-2 text-xs font-medium text-text-tertiary border-t border-border-primary/50">
          Category: <span className="text-text-primary font-bold">{task.categoryName}</span> • Dept: {task.departmentName}
        </div>
      </div>

      {/* Navigation Handoff Card (GPS & Map Deep-link) */}
      <div className="p-4 bg-surface-elevated rounded-lg border border-border-primary shadow-elevation-1 space-y-3">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
          <span>📍</span> Location &amp; Navigation
        </h2>

        <div className="bg-surface-secondary p-3 rounded-md border border-border-primary text-sm space-y-1">
          <div className="font-bold text-text-primary">{task.location.address}</div>
          {task.location.landmark && (
            <div className="text-xs text-text-secondary">
              Landmark: {task.location.landmark}
            </div>
          )}
          <div className="text-xs font-mono text-text-tertiary pt-1">
            GPS: {task.location.latitude.toFixed(5)}, {task.location.longitude.toFixed(5)}
          </div>
        </div>

        {/* Large Navigation Button (56px minimum per FIELD-WORKER-UX.md) */}
        <a
          href={mapNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[56px] px-6 py-3 bg-primary hover:bg-primary-hover text-text-inverse font-bold text-base rounded-lg flex items-center justify-center gap-2 shadow-elevation-1 active:scale-[0.98] transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Open in Google Maps</span>
        </a>
      </div>

      {/* Field Notes & Remarks Card */}
      <div className="p-4 bg-surface-elevated rounded-lg border border-border-primary shadow-elevation-1 space-y-3">
        <label htmlFor="field-notes" className="text-sm font-bold text-text-primary block uppercase tracking-wide">
          📝 Field Notes &amp; Observations
        </label>
        <textarea
          id="field-notes"
          rows={3}
          value={fieldNotes}
          onChange={(e) => setFieldNotes(e.target.value)}
          placeholder="Record site conditions, required materials, or blockers..."
          className="w-full p-3 text-sm rounded-md border border-border-primary bg-surface-secondary text-text-primary placeholder:text-text-tertiary outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md bg-slate-800 text-white hover:bg-slate-900 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-50"
        >
          Save Notes
        </button>
      </div>

      {/* Resolution Summary (If already resolved) */}
      {task.status === 'RESOLVED' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>✓</span> Task Resolved
          </div>
          <p className="text-sm text-emerald-950 font-medium">
            {task.resolutionNotes || 'Task marked resolved by field worker.'}
          </p>
          {task.resolvedAt && (
            <div className="text-xs text-emerald-700">
              Resolved on: {new Date(task.resolvedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Fixed Sticky Action Bar at Bottom of Screen (56px min buttons) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-primary/95 backdrop-blur border-t border-border-primary shadow-elevation-3 z-30">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {task.status === 'ASSIGNED' && (
            <button
              type="button"
              onClick={handleStartWork}
              disabled={isSubmitting}
              className="w-full min-h-[56px] px-6 py-3 bg-primary hover:bg-primary-hover text-text-inverse font-black text-base uppercase tracking-wider rounded-lg shadow-elevation-2 active:scale-[0.98] transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Starting...' : 'Start Work Now ➔'}
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              disabled={isSubmitting}
              className="w-full min-h-[56px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base uppercase tracking-wider rounded-lg shadow-elevation-2 active:scale-[0.98] transition-all outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 disabled:opacity-50"
            >
              Mark Task Resolved ✓
            </button>
          )}

          {task.status === 'RESOLVED' && (
            <div className="w-full min-h-[44px] flex items-center justify-center text-sm font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
              Work Completed &amp; Verified
            </div>
          )}
        </div>
      </div>

      {/* Resolution Submission Modal */}
      {showResolveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-modal-title"
          className="fixed inset-0 bg-surface-overlay flex items-end sm:items-center justify-center p-4 z-50 animate-fadeIn"
        >
          <div className="bg-surface-elevated rounded-t-xl sm:rounded-xl p-6 w-full max-w-lg shadow-elevation-4 space-y-4">
            <h2 id="resolve-modal-title" className="text-lg font-bold text-text-primary">
              Submit Task Resolution
            </h2>
            <p className="text-xs text-text-secondary">
              Describe the remedial actions taken at the site to resolve this issue.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label htmlFor="res-notes" className="text-xs font-bold text-text-primary block mb-1 uppercase tracking-wide">
                  Resolution Remarks (Required)
                </label>
                <textarea
                  id="res-notes"
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cleared 10m blockage in stormwater pipe. Road surface clear."
                  className="w-full p-3 text-sm rounded-md border border-border-primary bg-surface-secondary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md border border-border-primary text-text-secondary hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resolutionNotes.trim()}
                  className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
