'use client';

import React, { useState } from 'react';
import { DisasterImpactForm } from './disaster-impact-form.jsx';
import { DisasterImpactFeed } from './disaster-impact-feed.jsx';
import { DisasterImpactSummary } from './disaster-impact-summary.jsx';
import { SEEDED_IMPACT_REPORTS } from '../../../backend/src/modules/disaster-impact/disaster-impact.fixtures.js';

export function DisasterReportingPageContent() {
  const [reports, setReports] = useState(SEEDED_IMPACT_REPORTS);
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' | 'FEED'

  const handleReportSubmitted = async (newReportData) => {
    const newReport = {
      ...newReportData,
      reportId: `DIR-2026-${String(reports.length + 1).padStart(4, '0')}`,
      status: 'UNVERIFIED',
      reportedAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    return { success: true, report: newReport };
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs (Mobile-Friendly) */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('FORM')}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all min-h-[44px] ${
              activeTab === 'FORM'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Report Ground Impact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FEED')}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all min-h-[44px] ${
              activeTab === 'FEED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Live Ground Feed ({reports.length})
          </button>
        </div>

        {/* Overview Stats */}
        <DisasterImpactSummary reports={reports} />

        {/* Tab View */}
        {activeTab === 'FORM' ? (
          <DisasterImpactForm onSubmitSuccess={handleReportSubmitted} />
        ) : (
          <DisasterImpactFeed reports={reports} />
        )}
      </div>
    </main>
  );
}
