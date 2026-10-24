'use client';
import React, { useState } from 'react';
import {
  MOCK_PROPOSED_RESOLUTIONS,
  MOCK_QUALITY_METRICS,
  ResolutionReviewCard,
  QualityMetricsWidget,
} from '@/features/resolution-review';

export default function ResolutionReviewPage() {
  const [resolutions, setResolutions] = useState(MOCK_PROPOSED_RESOLUTIONS);
  const [selectedId, setSelectedId] = useState(MOCK_PROPOSED_RESOLUTIONS[0]?.issueId || null);
  const [metrics, setMetrics] = useState(MOCK_QUALITY_METRICS);

  const selectedResolution = resolutions.find((r) => r.issueId === selectedId);

  const handleConfirm = async ({ issueId, rating, feedbackComments }) => {
    // Optimistically update
    setResolutions((prev) => prev.filter((r) => r.issueId !== issueId));
    setMetrics((prev) => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
      confirmedCount: prev.confirmedCount + 1,
      confirmationRate: Number((((prev.confirmedCount + 1) / (prev.totalReviews + 1)) * 100).toFixed(1)),
    }));
  };

  const handleReopen = async ({ issueId, reopenReason, evidenceUrls }) => {
    setResolutions((prev) => prev.filter((r) => r.issueId !== issueId));
    setMetrics((prev) => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
      reopenedCount: prev.reopenedCount + 1,
      reopenRate: Number((((prev.reopenedCount + 1) / (prev.totalReviews + 1)) * 100).toFixed(1)),
    }));
  };

  return (
    <main className="min-h-screen bg-surface-secondary text-text-primary p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-20">
      {/* Page Header */}
      <div className="border-b border-border-primary pb-3">
        <h1 className="text-xl sm:text-2xl font-black text-text-primary">
          Citizen Resolution Verification
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Review remediations performed by municipal field teams. Confirm successful work or request rework with photo proof.
        </p>
      </div>

      {/* Live Quality Metrics Banner */}
      <QualityMetricsWidget metrics={metrics} />

      {/* Pending Reviews Tabs */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          Pending Verification ({resolutions.length})
        </h2>

        {resolutions.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {resolutions.map((res) => (
              <button
                key={res.issueId}
                type="button"
                onClick={() => setSelectedId(res.issueId)}
                className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap border transition-all ${
                  selectedId === res.issueId
                    ? 'bg-primary text-text-inverse border-primary shadow-sm'
                    : 'bg-surface-elevated text-text-primary border-border-primary hover:bg-slate-100'
                }`}
              >
                #{res.issueId} • {res.categoryName}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface-elevated rounded-xl border border-border-primary text-center space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="text-base font-bold text-text-primary">All Proposed Resolutions Verified!</h3>
            <p className="text-xs text-text-secondary">You have no remaining issues awaiting resolution verification.</p>
          </div>
        )}

        {selectedResolution && (
          <ResolutionReviewCard
            resolution={selectedResolution}
            onConfirm={handleConfirm}
            onReopen={handleReopen}
          />
        )}
      </div>
    </main>
  );
}
