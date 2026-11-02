'use client';

import React, { useState } from 'react';
import { EventCommandHeader } from './event-command-header.jsx';
import { PostEventMetricsCards } from './post-event-metrics-cards.jsx';
import { ImpactClustersPanel } from './impact-clusters-panel.jsx';
import { BlockedRoutesPanel } from './blocked-routes-panel.jsx';
import { ResponseTasksPanel } from './response-tasks-panel.jsx';
import { NeedsResourcesPanel } from './needs-resources-panel.jsx';
import { EventTimelinePanel } from './event-timeline-panel.jsx';
import { AfterActionReviewPanel } from './after-action-review-panel.jsx';
import { SITUATION_ROOM_TABS } from './types.js';

export function SituationRoomDashboard({
  initialDisaster,
  initialAlerts = [],
  initialImpactClusters = [],
  initialBlockedRoutes = [],
  initialNeeds = [],
  initialResources = [],
  initialResponseTasks = [],
  initialTimeline = [],
  initialMetrics = null,
  initialAar = null,
  onTaskCreate,
  onTaskStatusUpdate,
  onGenerateAar,
  onApproveAar,
}) {
  const [activeTab, setActiveTab] = useState(SITUATION_ROOM_TABS.COMMAND_OVERVIEW);
  const [responseTasks, setResponseTasks] = useState(initialResponseTasks);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [aar, setAar] = useState(initialAar);
  const [toastMessage, setToastMessage] = useState('');
  const [isGeneratingAar, setIsGeneratingAar] = useState(false);
  const [isApprovingAar, setIsApprovingAar] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Handler for creating a task
  const handleTaskCreate = async (taskData) => {
    let created;
    if (onTaskCreate) {
      created = await onTaskCreate(taskData);
    } else {
      created = {
        ...taskData,
        id: `task-${Date.now()}`,
        taskNumber: `TASK-2026-${String(responseTasks.length + 1).padStart(4, '0')}`,
        status: 'DISPATCHED',
        dispatchedAt: new Date().toISOString(),
      };
    }
    setResponseTasks((prev) => [created, ...prev]);
    showToast(`Task ${created.taskNumber || created.id} dispatched successfully.`);
  };

  // Handler for updating task status
  const handleTaskStatusUpdate = async (taskId, newStatus, notes = '') => {
    if (onTaskStatusUpdate) {
      await onTaskStatusUpdate(taskId, newStatus, notes);
    }
    setResponseTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, lastUpdatedAt: new Date().toISOString() } : t))
    );
    showToast(`Task status updated to ${newStatus.replace(/_/g, ' ')}.`);
  };

  // Handler for AI AAR generation
  const handleGenerateAar = async () => {
    setIsGeneratingAar(true);
    try {
      let generated;
      if (onGenerateAar) {
        generated = await onGenerateAar();
      } else {
        generated = {
          id: `aar-${Date.now()}`,
          title: `After-Action Review: ${initialDisaster?.title || 'Flood Operation'}`,
          status: 'DRAFT_AI_ASSISTED',
          isAuthoritative: false,
          executiveSummary:
            `[AI_DRAFT: NON_AUTHORITATIVE] Multi-agency coordination review. [SOURCE: SACHET_NDMA_ALERT] Early warning alerted 45 mins prior to peak inundation. [SOURCE: MUNICIPAL_DISPATCH_RECORD] 5 tasks completed with zero critical life casualties.`,
          operationalChronologySummary:
            `1. [SOURCE: SACHET_NDMA_ALERT] 04:00Z - Flash flood alert issued.\n2. [SOURCE: FIELD_INSPECTION] 04:45Z - Shelter opened.\n3. [SOURCE: MUNICIPAL_DISPATCH_RECORD] 05:25Z - Boat unit dispatched.`,
          strengthsObserved: [
            `[SOURCE: SACHET_NDMA_ALERT] Rapid ingestion of CAP warnings allowed early shelter readiness.`,
            `[SOURCE: MUNICIPAL_DISPATCH_RECORD] Motorized inflatable dinghies extracted vulnerable residents within 15 minutes.`,
          ],
          challengesAndBottlenecks: [
            `[SOURCE: FIELD_INSPECTION] Low-level causeways lacked automatic barriers.`,
            `[SOURCE: CITIZEN_VERIFIED_REPORT] Telecom network throttling delayed mobile photo reports.`,
          ],
          recommendations: [
            `[AI_DRAFT: NON_AUTHORITATIVE] Upgrade low bridges with automated telemetry-linked flood gates.`,
            `[AI_DRAFT: NON_AUTHORITATIVE] Deploy offline-first SMS distress beacons.`,
          ],
          sourceCitations: [
            { label: '[SOURCE: SACHET_NDMA_ALERT]', detail: 'SACHET CAP Alert Stream' },
            { label: '[SOURCE: MUNICIPAL_DISPATCH_RECORD]', detail: 'CivIQ Situation Room Logs' },
          ],
        };
      }
      setAar(generated);
      showToast('AI After-Action Review draft generated with verified source labels.');
    } finally {
      setIsGeneratingAar(false);
    }
  };

  // Handler for coordinator AAR approval
  const handleApproveAar = async (approvalData) => {
    setIsApprovingAar(true);
    try {
      let approved;
      if (onApproveAar) {
        approved = await onApproveAar(approvalData);
      } else {
        approved = {
          ...aar,
          status: 'APPROVED_PUBLISHED',
          reviewedBy: {
            id: 'coord-user',
            role: 'DISASTER_COORDINATOR',
            reviewedAt: new Date().toISOString(),
            notes: approvalData.approvalNotes,
          },
        };
      }
      setAar(approved);
      showToast('After-Action Review formally approved and signed off.');
    } finally {
      setIsApprovingAar(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary py-6 px-3 sm:px-6 lg:px-8 space-y-6">
      {/* ─── Toast Notification ─── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-in-right bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-elevation-4 border border-white/10 text-xs font-bold flex items-center gap-2 min-w-[220px]">
          <span className="w-4 h-4 rounded-full bg-status-success flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Command Header with Statutory Warning & Alert Ticker */}
        <EventCommandHeader
          disaster={initialDisaster}
          activeAlerts={initialAlerts}
        />

        {/* Post-Event / Dynamic Operational Metrics Overview */}
        <PostEventMetricsCards metrics={metrics} />

        {/* Command Navigation Tabs */}
        <nav aria-label="Situation Room tabs" className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-border-primary">
          <button
            type="button"
            onClick={() => setActiveTab(SITUATION_ROOM_TABS.COMMAND_OVERVIEW)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 min-h-[44px] ${
              activeTab === SITUATION_ROOM_TABS.COMMAND_OVERVIEW
                ? 'bg-text-primary text-white shadow-elevation-1'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-tertiary border border-border-primary'
            }`}
          >
            Command Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(SITUATION_ROOM_TABS.RESPONSE_TASKS)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 min-h-[44px] flex items-center gap-1.5 ${
              activeTab === SITUATION_ROOM_TABS.RESPONSE_TASKS
                ? 'bg-text-primary text-white shadow-elevation-1'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-tertiary border border-border-primary'
            }`}
          >
            <span>Response Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-status-info/15 text-status-info font-bold">
              {responseTasks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(SITUATION_ROOM_TABS.NEEDS_RESOURCES)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 min-h-[44px] ${
              activeTab === SITUATION_ROOM_TABS.NEEDS_RESOURCES
                ? 'bg-text-primary text-white shadow-elevation-1'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-tertiary border border-border-primary'
            }`}
          >
            Needs &amp; Resources
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(SITUATION_ROOM_TABS.EVENT_TIMELINE)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 min-h-[44px] ${
              activeTab === SITUATION_ROOM_TABS.EVENT_TIMELINE
                ? 'bg-text-primary text-white shadow-elevation-1'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-tertiary border border-border-primary'
            }`}
          >
            Event Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(SITUATION_ROOM_TABS.AFTER_ACTION_REVIEW)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 min-h-[44px] flex items-center gap-1.5 ${
              activeTab === SITUATION_ROOM_TABS.AFTER_ACTION_REVIEW
                ? 'bg-accent text-white shadow-elevation-1'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-tertiary border border-border-primary'
            }`}
          >
            <span aria-hidden="true">✨</span>
            <span>After-Action Review</span>
          </button>
        </nav>

        {/* Tab Content — fade-up on each panel switch */}
        {activeTab === SITUATION_ROOM_TABS.COMMAND_OVERVIEW && (
          <div key="command-overview" className="animate-fade-up space-y-6">
            <ImpactClustersPanel clusters={initialImpactClusters} />
            <BlockedRoutesPanel routes={initialBlockedRoutes} />
          </div>
        )}

        {activeTab === SITUATION_ROOM_TABS.RESPONSE_TASKS && (
          <div key="response-tasks" className="animate-fade-up">
            <ResponseTasksPanel
              tasks={responseTasks}
              onStatusUpdate={handleTaskStatusUpdate}
              onTaskCreate={handleTaskCreate}
            />
          </div>
        )}

        {activeTab === SITUATION_ROOM_TABS.NEEDS_RESOURCES && (
          <div key="needs-resources" className="animate-fade-up">
            <NeedsResourcesPanel
              needs={initialNeeds}
              resources={initialResources}
            />
          </div>
        )}

        {activeTab === SITUATION_ROOM_TABS.EVENT_TIMELINE && (
          <div key="event-timeline" className="animate-fade-up">
            <EventTimelinePanel timeline={timeline} />
          </div>
        )}

        {activeTab === SITUATION_ROOM_TABS.AFTER_ACTION_REVIEW && (
          <div key="after-action-review" className="animate-fade-up">
            <AfterActionReviewPanel
              aar={aar}
              onGenerateAar={handleGenerateAar}
              onApproveAar={handleApproveAar}
              isGenerating={isGeneratingAar}
              isApproving={isApprovingAar}
            />
          </div>
        )}
      </div>
    </div>
  );
}
