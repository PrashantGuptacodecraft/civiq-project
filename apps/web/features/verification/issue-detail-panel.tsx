'use client';

import { useState } from 'react';
import type { MockIssue, VerificationStatus } from './mock-data';
import { StatusBadge, SeverityBadge, TrustBadge } from './ui';

// Reason codes per DESIGN-SYSTEM.md — mandatory for verify/reject/request-evidence
const REASON_CODES = {
  VERIFIED: [
    'Evidence confirms report',
    'Location verified via cross-reference',
    'Multiple independent reports corroborate',
    'Field worker confirmed on-site',
  ],
  REJECTED: [
    'Insufficient evidence',
    'Location does not match description',
    'Duplicate of existing verified report',
    'False or misleading information',
    'Outside jurisdiction',
  ],
  NEEDS_EVIDENCE: [
    'Photo/video evidence required',
    'Location details unclear',
    'Description too vague to act upon',
    'Timestamp verification needed',
  ],
};

interface IssueDetailPanelProps {
  issue: MockIssue;
  onAction: (issueId: string, action: VerificationStatus, reason: string) => void;
  onClose: () => void;
}

export function IssueDetailPanel({ issue, onAction, onClose }: IssueDetailPanelProps) {
  const [selectedAction, setSelectedAction] = useState<'VERIFIED' | 'REJECTED' | 'NEEDS_EVIDENCE' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!selectedAction || !selectedReason) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onAction(issue.id, selectedAction, selectedReason);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-overlay transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides from bottom on mobile, centered on desktop */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface-elevated rounded-t-xl lg:rounded-xl shadow-elevation-4 overflow-y-auto border border-border-primary animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-surface-elevated border-b border-border-primary px-4 md:px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0 flex-1">
            <h2 id="detail-title" className="text-lg font-bold text-text-primary truncate">{issue.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <StatusBadge status={issue.verificationStatus} />
              <SeverityBadge severity={issue.severity} />
              <span className="text-xs text-text-tertiary">{issue.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md hover:bg-surface-tertiary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close detail panel"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-4 md:px-6 py-6 space-y-6">
          {/* Description */}
          <section>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
            <p className="text-text-primary leading-relaxed">{issue.description}</p>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Location</h3>
            <div className="bg-surface-secondary rounded-lg p-4 border border-border-primary">
              <p className="text-sm text-text-primary font-medium">{issue.address}</p>
              <p className="text-sm text-text-secondary">{[issue.city, issue.district, issue.state].filter(Boolean).join(', ')}</p>
              {issue.latitude && issue.longitude && (
                <p className="text-xs text-text-tertiary mt-1 font-mono">{issue.latitude.toFixed(4)}°N, {issue.longitude.toFixed(4)}°E</p>
              )}
            </div>
          </section>

          {/* Reporter Trust */}
          <section>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Reporter</h3>
            <div className="bg-surface-secondary rounded-lg p-4 border border-border-primary flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{issue.reporter.displayName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <TrustBadge level={issue.reporter.trustLevel} score={issue.reporter.trustScore} />
                </div>
              </div>
              <div className="text-right text-xs text-text-secondary space-y-1">
                <p><span className="text-status-success font-medium">{issue.reporter.validReports}</span> verified</p>
                <p><span className="text-status-error font-medium">{issue.reporter.rejectedReports}</span> rejected</p>
              </div>
            </div>
          </section>

          {/* Evidence */}
          <section>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Evidence ({issue.evidence.length})
            </h3>
            {issue.evidence.length === 0 ? (
              <div className="bg-surface-secondary rounded-lg p-4 border border-border-primary text-center">
                <p className="text-sm text-text-tertiary">No evidence attached</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issue.evidence.map((ev) => (
                  <div key={ev.id} className="bg-surface-secondary rounded-lg p-3 border border-border-primary flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                        {ev.mimeType.startsWith('image') ? (
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        ) : ev.mimeType.startsWith('video') ? (
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{ev.storageKey.split('/').pop()}</p>
                        <p className="text-xs text-text-tertiary">{formatBytes(ev.sizeBytes)} · {ev.mimeType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!ev.metadataTrusted && (
                        <span className="text-xs text-status-warning font-medium" title="EXIF metadata cannot be trusted">Unverified EXIF</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Risk Signals */}
          {issue.riskSignals.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Risk Signals</h3>
              <div className="space-y-2">
                {issue.riskSignals.map((signal, i) => (
                  <div key={i} className="bg-status-warning/5 border border-status-warning/20 rounded-lg p-3 flex items-center gap-3">
                    <svg className="w-5 h-5 text-status-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{signal.signalType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-secondary">Severity: {signal.severity} · {formatDate(signal.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Duplicate Candidates */}
          {issue.duplicateCandidateCount > 0 && (
            <section>
              <div className="bg-workflow-duplicate/5 border border-workflow-duplicate/20 rounded-lg p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-workflow-duplicate flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{issue.duplicateCandidateCount}</span> potential duplicate{issue.duplicateCandidateCount > 1 ? 's' : ''} detected
                </p>
              </div>
            </section>
          )}

          {/* AI Recommendation — clearly labeled */}
          {issue.aiRecommendation && (
            <section>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">AI Recommendation</h3>
              <div className="bg-ai-recommendation/5 border border-ai-recommendation/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-ai-recommendation" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <span className="text-xs font-bold text-ai-recommendation uppercase tracking-wider">AI-Assisted Analysis</span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{issue.aiRecommendation}</p>
                <p className="text-xs text-text-tertiary mt-2 italic">This is an AI-generated recommendation. Final verification decisions must be made by authorized officers.</p>
              </div>
            </section>
          )}

          {/* Actions */}
          {!success && (
            <section className="border-t border-border-primary pt-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Officer Actions</h3>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => { setSelectedAction('VERIFIED'); setSelectedReason(''); }}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    selectedAction === 'VERIFIED'
                      ? 'bg-status-success text-white'
                      : 'bg-status-success/10 text-status-success hover:bg-status-success/20 border border-status-success/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Verify
                </button>
                <button
                  onClick={() => { setSelectedAction('NEEDS_EVIDENCE'); setSelectedReason(''); }}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    selectedAction === 'NEEDS_EVIDENCE'
                      ? 'bg-status-warning text-white'
                      : 'bg-status-warning/10 text-status-warning hover:bg-status-warning/20 border border-status-warning/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  Request Evidence
                </button>
                <button
                  onClick={() => { setSelectedAction('REJECTED'); setSelectedReason(''); }}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    selectedAction === 'REJECTED'
                      ? 'bg-status-error text-white'
                      : 'bg-status-error/10 text-status-error hover:bg-status-error/20 border border-status-error/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Reject
                </button>
              </div>

              {/* Reason selection — mandatory */}
              {selectedAction && (
                <div className="space-y-3 animate-fade-in">
                  <label className="block text-sm font-medium text-text-primary">
                    Reason code <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full h-11 px-3 rounded-md border border-border-primary bg-surface-primary text-text-primary text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    aria-label="Select reason code"
                  >
                    <option value="">Select a reason...</option>
                    {REASON_CODES[selectedAction].map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-md h-11 px-6 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Decision'
                    )}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Success State */}
          {success && (
            <section className="border-t border-border-primary pt-6 animate-fade-in">
              <div className="bg-status-success/10 border border-status-success/20 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-status-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-status-success">Decision submitted successfully.</p>
              </div>
            </section>
          )}

          {/* Timestamp */}
          <div className="text-xs text-text-tertiary">
            Reported {formatDate(issue.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
