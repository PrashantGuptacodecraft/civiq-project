'use client';

import React, { useState } from 'react';
import { AAR_SOURCE_LABELS, DISASTER_OPS_DISCLAIMER } from './types.js';

export function AfterActionReviewPanel({
  aar,
  onGenerateAar,
  onApproveAar,
  isGenerating = false,
  isApproving = false,
}) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!onApproveAar) return;
    await onApproveAar({
      approvalNotes: approvalNotes || 'Formally signed off by authorized disaster coordinator for municipal archive.',
    });
    setShowApprovalModal(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6">
      {/* Header & Generation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              After-Action Review (AAR) & Post-Incident Report
            </h2>
            {aar && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  aar.status === 'APPROVED_PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {aar.status === 'APPROVED_PUBLISHED' ? 'Approved & Published' : 'Coordinator Review Draft'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Multi-source post-incident evaluation with explicit source attribution and coordinator sign-off
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateAar && (
            <button
              type="button"
              onClick={onGenerateAar}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all min-h-[44px] flex items-center gap-2 disabled:opacity-50"
            >
              <span>✨</span>
              <span>{isGenerating ? 'Synthesizing...' : 'Generate AI Review Draft'}</span>
            </button>
          )}

          {aar && aar.status !== 'APPROVED_PUBLISHED' && onApproveAar && (
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              disabled={isApproving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all min-h-[44px] flex items-center gap-2"
            >
              <span>✓</span>
              <span>Coordinator Sign-Off</span>
            </button>
          )}
        </div>
      </div>

      {/* Advisory Notice Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <span className="text-indigo-600 font-mono text-sm">{AAR_SOURCE_LABELS.AI_DRAFT}</span>
          <span>Source-Attributed Decision Support Notice</span>
        </div>
        <p className="leading-relaxed">
          {DISASTER_OPS_DISCLAIMER}
        </p>
      </div>

      {/* Coordinator Approval Modal */}
      {showApprovalModal && (
        <form
          onSubmit={handleApproveSubmit}
          className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-950">
              Sign-Off After-Action Review (Coordinator Authority)
            </h3>
            <button
              type="button"
              onClick={() => setShowApprovalModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800 p-1 min-h-[36px]"
            >
              ✕
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Coordinator Approval Notes & Statutory Remarks
            </label>
            <textarea
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Record review observations, inter-agency endorsements, and DDMA compliance..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowApprovalModal(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isApproving}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg min-h-[44px]"
            >
              Confirm Official Approval
            </button>
          </div>
        </form>
      )}

      {/* AAR Content Display */}
      {!aar ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <p className="text-sm font-medium">No After-Action Review compiled yet.</p>
          <p className="text-xs">Click "Generate AI Review Draft" above to assemble verified event timeline and operational metrics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Executive Summary */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>1. Executive Summary</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold">
                {AAR_SOURCE_LABELS.AI_DRAFT}
              </span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {aar.executiveSummary}
            </div>
          </section>

          {/* Section 2: Operational Chronology Summary */}
          {aar.operationalChronologySummary && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Operational Chronology & Verified Alerts
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-line">
                {aar.operationalChronologySummary}
              </div>
            </section>
          )}

          {/* Section 3: Strengths Observed */}
          {aar.strengthsObserved && aar.strengthsObserved.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Operational Strengths & Effective Responses
              </h3>
              <ul className="space-y-2">
                {aar.strengthsObserved.map((str, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 text-xs text-emerald-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section 4: Challenges and Bottlenecks */}
          {aar.challengesAndBottlenecks && aar.challengesAndBottlenecks.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Operational Challenges & Bottlenecks
              </h3>
              <ul className="space-y-2">
                {aar.challengesAndBottlenecks.map((chal, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg border border-amber-100 bg-amber-50/50 text-xs text-amber-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-amber-600 font-bold mt-0.5">!</span>
                    <span>{chal}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section 5: Actionable Recommendations */}
          {aar.recommendations && aar.recommendations.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>5. Lessons Learned & Actionable Recommendations</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold">
                  {AAR_SOURCE_LABELS.AI_DRAFT}
                </span>
              </h3>
              <ul className="space-y-2">
                {aar.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/40 text-xs text-indigo-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-indigo-600 font-bold mt-0.5">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section 6: Source Citations & Sign-off Details */}
          {aar.sourceCitations && aar.sourceCitations.length > 0 && (
            <section className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Source Attribution & Evidence Provenance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {aar.sourceCitations.map((cit, idx) => (
                  <div key={idx} className="p-2 rounded border border-slate-200 bg-white">
                    <span className="font-mono font-bold text-indigo-700 block">{cit.label}</span>
                    <span className="text-slate-600">{cit.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sign-off metadata footer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800">Review Sign-Off: </span>
              {aar.reviewedBy ? (
                <span>
                  {aar.reviewedBy.role} ({aar.reviewedBy.id}) at{' '}
                  {new Date(aar.reviewedBy.reviewedAt).toLocaleString()}
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">Pending Coordinator Approval</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Report ID: {aar.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
