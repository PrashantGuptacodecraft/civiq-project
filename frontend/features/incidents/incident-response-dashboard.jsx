'use client';

import React, { useState, useEffect } from 'react';
import { EmergencyHandoffBanner } from './emergency-handoff-banner.jsx';
import { RapidIncidentForm } from './rapid-incident-form.jsx';
import { IncidentTimelineView } from './incident-timeline-view.jsx';
import { IncidentResponderControls } from './incident-responder-controls.jsx';
import { IncidentNotificationsFeed } from './incident-notifications-feed.jsx';
import {
  MOCK_INCIDENTS,
  MOCK_TIMELINES,
  MOCK_NOTIFICATIONS,
} from './mock-incidents-data.js';
import {
  STATUS_BADGE_CLASSES,
  SEVERITY_BADGE_CLASSES,
} from './types.js';

/**
 * Phase 56: Critical Accident Response Workflow Dashboard
 * Connects rapid emergency submission, unverified intake, Call 112 handoff,
 * responder confirmation, closure, timeline, and notification feeds.
 */
export function IncidentResponseDashboard({
  initialIncidents = MOCK_INCIDENTS,
  initialTimelines = MOCK_TIMELINES,
  initialNotifications = MOCK_NOTIFICATIONS,
}) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [timelines, setTimelines] = useState(initialTimelines);
  const [notifications, setNotifications] = useState(initialNotifications);

  const [selectedIncidentId, setSelectedIncidentId] = useState(
    initialIncidents[0]?.id || 'inc-pune-005'
  );
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'report'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNVERIFIED' | 'CONFIRMED' | 'ACTIVE'

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Auto-dismiss success toast after 4s
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId) || incidents[0];
  const activeTimeline = (selectedIncident ? timelines[selectedIncident.id] : []) || [];
  const activeNotifications = (selectedIncident ? notifications[selectedIncident.id] : []) || [];

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'UNVERIFIED') {
      return inc.status === 'UNVERIFIED' || inc.verificationStatus === 'UNVERIFIED';
    }
    if (statusFilter === 'CONFIRMED') {
      return inc.status === 'RESPONDER_CONFIRMED' || inc.verificationStatus === 'CONFIRMED';
    }
    if (statusFilter === 'ACTIVE') {
      return inc.status !== 'CLOSED' && inc.status !== 'RESOLVED' && inc.status !== 'FALSE_ALARM';
    }
    return true;
  });

  // Handler: Rapid Report Submission
  const handleRapidSubmit = async (formData) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // In real browser runtime, attempt POST /incidents/rapid with fallback to local state
      let newInc;
      try {
        const res = await fetch('/api/incidents/rapid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const body = await res.json();
          newInc = body.incident;
        }
      } catch {
        // Fallback
      }

      if (!newInc) {
        // Generate client-side entity
        const now = new Date().toISOString();
        const year = new Date().getFullYear();
        const randId = `inc-pune-${Date.now().toString(36)}`;
        newInc = {
          id: randId,
          incidentNumber: `INC-${year}-${String(incidents.length + 101).padStart(4, '0')}`,
          title: formData.title || `Emergency: ${formData.incidentType.replace(/_/g, ' ')}`,
          description: formData.description || 'Emergency incident recorded in CivIQ.',
          incidentType: formData.incidentType,
          severity: formData.casualties?.hasCasualties ? 'HIGH' : 'MEDIUM',
          status: 'UNVERIFIED',
          verificationStatus: 'UNVERIFIED',
          location: formData.location,
          casualties: formData.casualties,
          hazards: formData.hazards,
          officialResponderHandoff: formData.handoffTo112
            ? { isHandedOffTo112: true, handoffTimestamp: now, handoffChannel: 'CALL_112' }
            : { isHandedOffTo112: false },
          createdAt: now,
          updatedAt: now,
        };
      }

      // Prepend to incidents list
      setIncidents((prev) => [newInc, ...prev]);

      // Initialize timeline for new incident
      const initialEvents = [
        {
          id: `tl-${newInc.id}-1`,
          eventType: 'INCIDENT_RECORDED',
          status: 'UNVERIFIED',
          title: 'Incident Submitted (UNVERIFIED)',
          description: 'Rapid emergency incident report logged into CivIQ.',
          actorRole: 'CITIZEN',
          timestamp: new Date().toISOString(),
        },
      ];
      if (newInc.officialResponderHandoff?.isHandedOffTo112) {
        initialEvents.push({
          id: `tl-${newInc.id}-2`,
          eventType: 'CALL_112_HANDOFF_INITIATED',
          status: 'UNVERIFIED',
          title: 'Official Call 112 Handoff Initiated',
          description: 'Citizen connected to 112 emergency dispatch.',
          actorRole: 'CITIZEN',
          timestamp: new Date().toISOString(),
        });
      }

      setTimelines((prev) => ({
        ...prev,
        [newInc.id]: initialEvents,
      }));

      // Initialize notification
      setNotifications((prev) => ({
        ...prev,
        [newInc.id]: [
          {
            id: `notif-${newInc.id}-1`,
            type: 'INCIDENT_RECORDED_UNVERIFIED',
            title: 'Emergency Incident Recorded (UNVERIFIED)',
            message: `Incident #${newInc.incidentNumber} recorded in UNVERIFIED state. 112 handoff available.`,
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
      }));

      setSelectedIncidentId(newInc.id);
      setSuccessToast(`Emergency report #${newInc.incidentNumber} recorded as UNVERIFIED.`);
      return newInc;
    } catch (err) {
      setErrorMessage(err.message || 'Submission error');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Call 112 Handoff Trigger
  const handleCall112Trigger = async (hotline = '112') => {
    if (!selectedIncident) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const updatedIncident = {
        ...selectedIncident,
        officialResponderHandoff: {
          isHandedOffTo112: true,
          handoffTimestamp: now,
          handoffChannel: `CALL_${hotline}`,
        },
        updatedAt: now,
      };

      setIncidents((prev) =>
        prev.map((inc) => (inc.id === selectedIncident.id ? updatedIncident : inc))
      );

      const handoffEvent = {
        id: `tl-${selectedIncident.id}-${Date.now()}`,
        eventType: 'CALL_112_HANDOFF_INITIATED',
        status: selectedIncident.status,
        title: `Official Call ${hotline} Handoff Initiated`,
        description: `Caller initiated direct emergency dispatch link to hotline ${hotline}.`,
        actorRole: 'CITIZEN',
        timestamp: now,
      };

      setTimelines((prev) => ({
        ...prev,
        [selectedIncident.id]: [...(prev[selectedIncident.id] || []), handoffEvent],
      }));

      setSuccessToast(`Official Call ${hotline} handoff registered for #${selectedIncident.incidentNumber}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Responder Confirmation
  const handleConfirmIncident = async (incidentId, confirmationData) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const now = new Date().toISOString();
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: 'RESPONDER_CONFIRMED',
              verificationStatus: 'CONFIRMED',
              severity: confirmationData.confirmedSeverity || inc.severity,
              responderConfirmation: {
                confirmedAt: now,
                officerName: confirmationData.officerName,
                agency: confirmationData.agency,
                badgeNumber: confirmationData.badgeNumber,
                notes: confirmationData.notes,
              },
              updatedAt: now,
            };
          }
          return inc;
        })
      );

      const confirmEvent = {
        id: `tl-${incidentId}-${Date.now()}`,
        eventType: 'RESPONDER_CONFIRMED',
        status: 'RESPONDER_CONFIRMED',
        title: 'Responder Ground Confirmation',
        description: `${confirmationData.agency} Officer ${confirmationData.officerName} (${confirmationData.badgeNumber}) verified scene: ${confirmationData.notes}`,
        actorRole: confirmationData.agency,
        timestamp: now,
      };

      setTimelines((prev) => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), confirmEvent],
      }));

      setSuccessToast(`Incident verified and confirmed on scene by ${confirmationData.agency}.`);
    } catch (err) {
      setErrorMessage(err.message || 'Confirmation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Incident Closure
  const handleCloseIncident = async (incidentId, closureData) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const now = new Date().toISOString();
      const newStatus = closureData.status || 'CLOSED';

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: newStatus,
              closureReason: closureData.notes,
              closedAt: now,
              updatedAt: now,
            };
          }
          return inc;
        })
      );

      const closeEvent = {
        id: `tl-${incidentId}-${Date.now()}`,
        eventType: 'INCIDENT_CLOSED',
        status: newStatus,
        title: `Incident Marked ${newStatus}`,
        description: closureData.notes,
        actorRole: 'OFFICIAL_RESPONDER',
        timestamp: now,
      };

      setTimelines((prev) => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), closeEvent],
      }));

      setSuccessToast(`Incident marked ${newStatus}. Resolution recorded.`);
    } catch (err) {
      setErrorMessage(err.message || 'Closure failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Status transition
  const handleStatusChange = async (incidentId, newStatus) => {
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus, updatedAt: now } : inc))
      );

      const updateEvent = {
        id: `tl-${incidentId}-${Date.now()}`,
        eventType: 'STATUS_UPDATED',
        status: newStatus,
        title: `Status Changed to ${newStatus}`,
        description: `Incident moved to ${newStatus} by authorized field personnel.`,
        actorRole: 'FIRST_RESPONDER',
        timestamp: now,
      };

      setTimelines((prev) => ({
        ...prev,
        [incidentId]: [...(prev[incidentId] || []), updateEvent],
      }));

      setSuccessToast(`Incident status updated to ${newStatus}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* 1. Life-Safety Call 112 Persistent Emergency Banner */}
      <EmergencyHandoffBanner
        onHandoffTriggered={handleCall112Trigger}
        isHandedOff={Boolean(selectedIncident?.officialResponderHandoff?.isHandedOffTo112)}
      />

      {/* Success Notification Toast */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 rounded-xl text-sm font-bold flex items-center justify-between shadow-elevation-1 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-500/10 border-2 border-red-500/30 text-red-800 rounded-xl text-sm font-bold flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-700 hover:text-red-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Workflow Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border-primary pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2.5 rounded-lg text-sm font-extrabold tracking-wide min-h-[44px] transition-colors ${
              activeTab === 'browse'
                ? 'bg-primary text-white shadow-elevation-1'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            Active Incidents & Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 rounded-lg text-sm font-extrabold tracking-wide min-h-[44px] transition-colors flex items-center gap-2 ${
              activeTab === 'report'
                ? 'bg-red-600 text-white shadow-elevation-1'
                : 'bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Rapid Emergency Report
          </button>
        </div>

        {/* Count overview */}
        <div className="text-xs font-semibold text-text-secondary">
          <span>{incidents.filter((i) => i.status === 'UNVERIFIED').length} Unverified</span>
          <span className="mx-2">•</span>
          <span>{incidents.length} Total Incidents</span>
        </div>
      </div>

      {/* Tab 1: Rapid Emergency Report */}
      {activeTab === 'report' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <RapidIncidentForm onSubmit={handleRapidSubmit} isSubmitting={isProcessing} />
        </div>
      )}

      {/* Tab 2: Browse Incidents, Timeline & Controls */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Incident List & Filter */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {['ALL', 'UNVERIFIED', 'ACTIVE', 'CONFIRMED'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap min-h-[36px] ${
                    statusFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-border-primary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* List */}
            {filteredIncidents.length === 0 ? (
              <div className="p-8 bg-surface-elevated rounded-xl border border-border-primary text-center text-text-secondary">
                <p className="text-sm font-semibold">No incidents found matching &ldquo;{statusFilter}&rdquo; filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const isUnv = inc.status === 'UNVERIFIED' || inc.verificationStatus === 'UNVERIFIED';

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedIncidentId(inc.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-elevation-2 ring-2 ring-primary/30'
                          : 'border-border-primary bg-surface-elevated hover:border-border-secondary shadow-elevation-0'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded">
                            {inc.incidentNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              STATUS_BADGE_CLASSES[inc.status] || 'bg-surface-tertiary text-text-secondary'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </div>

                        {inc.severity && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              SEVERITY_BADGE_CLASSES[inc.severity] || 'bg-surface-tertiary text-text-secondary'
                            }`}
                          >
                            {inc.severity}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-text-primary line-clamp-1">
                        {inc.title}
                      </h4>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                        {inc.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-border-primary/60 flex items-center justify-between text-[11px] text-text-tertiary">
                        <span className="truncate max-w-[200px]">{inc.location?.address}</span>
                        {isUnv && (
                          <span className="text-amber-700 font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            UNVERIFIED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Selected Incident Timeline, Controls, and Notifications */}
          <div className="lg:col-span-7 space-y-6">
            <IncidentTimelineView
              incident={selectedIncident}
              timeline={activeTimeline}
              isLoading={isLoading}
              onCall112Click={() => handleCall112Trigger('112')}
            />

            <IncidentResponderControls
              incident={selectedIncident}
              onConfirmIncident={handleConfirmIncident}
              onCloseIncident={handleCloseIncident}
              onStatusChange={handleStatusChange}
              isProcessing={isProcessing}
            />

            <IncidentNotificationsFeed
              notifications={activeNotifications}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
