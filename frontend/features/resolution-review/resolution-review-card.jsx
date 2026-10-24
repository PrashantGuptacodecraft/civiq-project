'use client';
import React, { useState } from 'react';
import { ReviewDecision } from './types.js';

export function ResolutionReviewCard({
  resolution,
  onConfirm,
  onReopen,
  disabled = false,
}) {
  const [mode, setMode] = useState(null); // 'CONFIRM' | 'REOPEN' | null
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [counterEvidenceUrl, setCounterEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusResult, setStatusResult] = useState(null); // { type: 'success' | 'error', message: string }

  if (!resolution) {
    return (
      <div className="p-6 bg-surface-elevated rounded-xl border border-border-primary text-center space-y-2">
        <div className="text-3xl">📭</div>
        <h3 className="text-base font-bold text-text-primary">No Proposed Resolution Selected</h3>
        <p className="text-xs text-text-secondary">Please select an issue to review its proposed resolution.</p>
      </div>
    );
  }

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusResult(null);

    try {
      if (onConfirm) {
        await onConfirm({
          issueId: resolution.issueId,
          decision: ReviewDecision.CONFIRMED,
          rating,
          feedbackComments: comments,
        });
      }
      setStatusResult({
        type: 'success',
        message: 'Thank you! You have confirmed this resolution. Issue is now permanently CLOSED.',
      });
      setMode(null);
    } catch (err) {
      setStatusResult({
        type: 'error',
        message: err.message || 'Failed to submit confirmation. Please retry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setStatusResult({
        type: 'error',
        message: 'Please provide a clear reason describing why this issue remains unresolved.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusResult(null);

    try {
      if (onReopen) {
        await onReopen({
          issueId: resolution.issueId,
          decision: ReviewDecision.REOPENED,
          reopenReason: reopenReason.trim(),
          evidenceUrls: counterEvidenceUrl ? [counterEvidenceUrl] : [],
          feedbackComments: comments,
        });
      }
      setStatusResult({
        type: 'success',
        message: 'Issue reopened successfully. It has been routed back to the department with your remarks.',
      });
      setMode(null);
    } catch (err) {
      setStatusResult({
        type: 'error',
        message: err.message || 'Failed to reopen issue. Please retry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-surface-elevated rounded-xl border border-border-primary shadow-elevation-2 space-y-5">
      {/* Status Result Message */}
      {statusResult && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
            statusResult.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
              : 'bg-red-50 border border-red-300 text-red-950'
          }`}
        >
          <span>{statusResult.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{statusResult.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
            {resolution.categoryName}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Action Required: Citizen Verification
          </span>
          <span className="text-xs font-mono font-bold text-text-tertiary ml-auto">
            #{resolution.issueId}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-text-primary leading-tight pt-1">
          {resolution.title}
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {resolution.description}
        </p>
      </div>

      {/* Resolution Details Card */}
      <div className="p-4 bg-surface-secondary rounded-lg border border-border-primary space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wide">
            👷 Work Completed by: {resolution.proposedBy}
          </span>
          <span className="text-text-tertiary">
            {new Date(resolution.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm text-slate-800 font-medium leading-relaxed bg-surface-primary p-3 rounded border border-border-primary/50">
          "{resolution.resolutionNotes}"
        </p>
      </div>

      {/* Side-by-Side Before & After Photographic Evidence */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
          <span>📷 Photographic Proof of Remediation</span>
          {resolution.gpsVerified && (
            <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-1">
              ✓ GPS Site Matched
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Before Photo */}
          <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Before Remediation</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">Original</span>
            </div>
            <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center text-slate-400 text-xs font-mono p-2 text-center overflow-hidden">
              {resolution.beforeProofUrl ? (
                <div className="space-y-1">
                  <div className="text-emerald-400">📷 Before Proof Photo</div>
                  <div className="text-[10px] text-slate-400 truncate">{resolution.beforeProofUrl.split('/').pop()}</div>
                </div>
              ) : (
                <span>No before photo available</span>
              )}
            </div>
          </div>

          {/* After Photo */}
          <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-800">After Remediation</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Completed</span>
            </div>
            <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center text-slate-400 text-xs font-mono p-2 text-center overflow-hidden">
              {resolution.afterProofUrl ? (
                <div className="space-y-1">
                  <div className="text-emerald-400">📷 After Proof Photo</div>
                  <div className="text-[10px] text-slate-400 truncate">{resolution.afterProofUrl.split('/').pop()}</div>
                </div>
              ) : (
                <span>No after photo available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (56px min for mobile touch) */}
      {!mode && (
        <div className="pt-2 border-t border-border-primary space-y-3">
          <div className="text-xs font-bold text-text-primary text-center">
            Did this work resolve the issue to your satisfaction?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMode('CONFIRM')}
              className="w-full min-h-[56px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-lg shadow-elevation-1 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30 disabled:opacity-50"
            >
              <span>✓</span> Yes, Confirm Resolution
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMode('REOPEN')}
              className="w-full min-h-[56px] px-4 py-3 bg-surface-secondary hover:bg-red-50 text-red-700 border border-red-300 font-bold text-sm sm:text-base rounded-lg shadow-elevation-1 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-red-600/30 disabled:opacity-50"
            >
              <span>✕</span> No, Reopen Issue
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Form (Rating + Comments) */}
      {mode === 'CONFIRM' && (
        <form onSubmit={handleConfirmSubmit} className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
              Rate Your Satisfaction
            </h4>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ✕ Cancel
            </button>
          </div>

          {/* 5-Star Rating Selector */}
          <div>
            <label className="text-xs font-semibold text-emerald-900 block mb-1.5">
              How satisfied are you with the quality and speed of resolution?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`min-h-[44px] min-w-[44px] rounded-md font-bold text-lg flex items-center justify-center transition-all ${
                    rating >= star
                      ? 'bg-amber-400 text-slate-950 shadow-sm scale-105'
                      : 'bg-surface-secondary text-text-tertiary border border-border-primary'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-bold text-emerald-950 ml-2">
                {rating === 5 ? 'Excellent' : rating >= 4 ? 'Good' : rating >= 3 ? 'Average' : 'Poor'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-feedback" className="text-xs font-semibold text-emerald-900 block mb-1">
              Feedback / Appreciation for Municipal Team (Optional)
            </label>
            <textarea
              id="confirm-feedback"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Work was completed quickly and area left clean."
              className="w-full p-2.5 text-sm rounded-md border border-emerald-300 bg-white text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md border border-slate-300 bg-white text-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isSubmitting ? 'Confirming...' : 'Submit Confirmation ✓'}
            </button>
          </div>
        </form>
      )}

      {/* Reopening Form (Reason + Optional Evidence) */}
      {mode === 'REOPEN' && (
        <form onSubmit={handleReopenSubmit} className="p-4 bg-red-50/70 border border-red-300 rounded-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-red-950 uppercase tracking-wide">
              Reopen Issue with Remarks
            </h4>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ✕ Cancel
            </button>
          </div>

          <div>
            <label htmlFor="reopen-reason" className="text-xs font-bold text-red-950 block mb-1 uppercase tracking-wide">
              Mandatory Reopen Reason *
            </label>
            <textarea
              id="reopen-reason"
              rows={3}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Describe clearly what remains broken or unsatisfactory..."
              className="w-full p-2.5 text-sm rounded-md border border-red-300 bg-white text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            />
          </div>

          <div>
            <label htmlFor="counter-evidence" className="text-xs font-semibold text-red-900 block mb-1">
              Counter-Evidence Photo URL (Optional)
            </label>
            <input
              id="counter-evidence"
              type="text"
              value={counterEvidenceUrl}
              onChange={(e) => setCounterEvidenceUrl(e.target.value)}
              placeholder="https://storage.civiq.in/counter-proof.jpg"
              className="w-full p-2.5 text-sm rounded-md border border-red-300 bg-white text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md border border-slate-300 bg-white text-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reopenReason.trim()}
              className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold uppercase rounded-md bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Reopen Issue ↺'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
