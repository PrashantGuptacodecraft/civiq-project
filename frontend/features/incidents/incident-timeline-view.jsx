'use client';

import React from 'react';
import {
  STATUS_BADGE_CLASSES,
  SEVERITY_BADGE_CLASSES,
} from './types.js';

/**
 * Chronological Incident Timeline & Lifecycle Event View
 * Shows incident intake (UNVERIFIED), Call 112 handoffs, responder confirmations, and closure.
 */
export function IncidentTimelineView({
  incident,
  timeline = [],
  isLoading = false,
  onCall112Click,
}) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-6 animate-pulse space-y-4">
        <div className="h-6 bg-surface-tertiary rounded w-1/3" />
        <div className="h-20 bg-surface-tertiary rounded w-full" />
        <div className="h-16 bg-surface-tertiary rounded w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-8 text-center text-text-secondary">
        <p className="text-sm">Select an incident to view its response workflow and chronological timeline.</p>
      </div>
    );
  }

  const isUnverified = incident.status === 'UNVERIFIED' || incident.verificationStatus === 'UNVERIFIED';

  return (
    <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-4 md:p-6 shadow-elevation-1 space-y-6">
      {/* Header with Title, Incident Number, and Badges */}
      <div className="border-b border-border-primary pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs md:text-sm font-bold text-text-secondary bg-surface-secondary px-2.5 py-1 rounded border border-border-primary">
              {incident.incidentNumber}
            </span>

            {/* Prominent UNVERIFIED or Lifecycle Status Badge */}
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                STATUS_BADGE_CLASSES[incident.status] || 'bg-surface-secondary text-text-secondary'
              }`}
            >
              {incident.status}
            </span>

            {/* Severity Badge */}
            {incident.severity && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  SEVERITY_BADGE_CLASSES[incident.severity] || 'bg-surface-secondary text-text-secondary'
                }`}
              >
                {incident.severity}
              </span>
            )}
          </div>

          <span className="text-xs text-text-tertiary">
            Reported: {new Date(incident.reportedAt || incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h3 className="text-lg md:text-xl font-extrabold text-text-primary tracking-tight">
          {incident.title}
        </h3>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          {incident.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1 font-medium">
            <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {incident.location?.address}
          </span>
          <span>•</span>
          <span>Ward: {incident.location?.ward || 'General'}</span>
          <span>•</span>
          <span>Jurisdiction: {incident.location?.jurisdictionId}</span>
        </div>
      </div>

      {/* Emergency Unverified Warning Banner if Unverified */}
      {isUnverified && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl text-amber-900 text-xs md:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-extrabold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
              Status: UNVERIFIED by Official First Responders
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              This report is held in an unverified state to maintain rapid intake without blocking life-safety response.
            </p>
          </div>
          <button
            type="button"
            onClick={onCall112Click}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg shrink-0 text-xs shadow-elevation-1 min-h-[44px]"
          >
            Trigger 112 Handoff
          </button>
        </div>
      )}

      {/* Casualties & Hazards Badges */}
      {(incident.casualties?.hasCasualties || (incident.hazards && incident.hazards.length > 0)) && (
        <div className="p-3.5 bg-surface-secondary rounded-lg border border-border-primary space-y-2">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Reported Ground Conditions
          </h4>
          <div className="flex flex-wrap gap-2">
            {incident.casualties?.hasCasualties && (
              <span className="text-xs px-2.5 py-1 rounded bg-red-600/15 text-red-800 font-bold border border-red-600/30">
                Casualties: {incident.casualties.injuredCount} Injured
                {incident.casualties.trappedCount > 0 && ` (${incident.casualties.trappedCount} Trapped)`}
              </span>
            )}
            {incident.casualties?.requiresAmbulance && (
              <span className="text-xs px-2.5 py-1 rounded bg-red-600/15 text-red-800 font-bold border border-red-600/30">
                Ambulance 108 Requested
              </span>
            )}
            {incident.hazards?.map((h) => (
              <span key={h} className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-800 border border-amber-500/25">
                Hazard: {h.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Timeline */}
      <div className="space-y-4">
        <h4 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Chronological Response Timeline ({timeline.length} events)
        </h4>

        {timeline.length === 0 ? (
          <p className="text-xs text-text-secondary italic">No timeline entries recorded yet.</p>
        ) : (
          <ol className="relative border-l border-border-secondary ml-3 space-y-6">
            {timeline.map((event, idx) => {
              const isHandoff = event.eventType === 'CALL_112_HANDOFF_INITIATED';
              const isConfirmed = event.eventType === 'RESPONDER_CONFIRMED';
              const isClosed = event.eventType === 'INCIDENT_CLOSED';
              const isUnverifiedEvent = event.status === 'UNVERIFIED';

              return (
                <li key={event.id || idx} className="ml-6 group">
                  {/* Timeline bullet */}
                  <span
                    className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-surface-primary ${
                      isHandoff
                        ? 'bg-red-600 text-white'
                        : isConfirmed
                        ? 'bg-emerald-600 text-white'
                        : isClosed
                        ? 'bg-slate-700 text-white'
                        : isUnverifiedEvent
                        ? 'bg-amber-500 text-white'
                        : 'bg-primary text-white'
                    }`}
                  >
                    <span className="text-[10px] font-black">{idx + 1}</span>
                  </span>

                  <div className="bg-surface-secondary/80 p-3.5 rounded-lg border border-border-primary hover:border-border-secondary transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-extrabold text-text-primary">
                          {event.title}
                        </span>
                        {event.status && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              STATUS_BADGE_CLASSES[event.status] || 'bg-surface-tertiary text-text-secondary'
                            }`}
                          >
                            {event.status}
                          </span>
                        )}
                      </div>

                      <time className="text-[11px] text-text-tertiary font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-border-primary/60 flex items-center justify-between text-[11px] text-text-tertiary">
                      <span>Actor: <strong>{event.actorRole || 'Official'}</strong> ({event.actorId || 'system'})</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Sensitive Media Evidence Verification Notice */}
      {Array.isArray(incident.evidence) && incident.evidence.length > 0 && (
        <div className="border-t border-border-primary pt-4 space-y-2">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Incident Photographic Evidence ({incident.evidence.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incident.evidence.map((ev, i) => {
              if (ev.isGraphicOrSensitive || ev.isContentRestricted) {
                return (
                  <div
                    key={ev.id || i}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-800"
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sensitive Trauma / Graphic Content Restricted
                    </p>
                    <p className="text-[11px] text-red-700 mt-1">
                      {ev.caption ? `${ev.caption} — ` : ''}Accident victim injury evidence protected per CivIQ Privacy and Ethics Policy.
                    </p>
                  </div>
                );
              }
              return (
                <div key={ev.id || i} className="p-3 bg-surface-secondary rounded-lg border border-border-primary text-xs">
                  <p className="font-semibold text-text-primary">{ev.caption || 'Scene Overview'}</p>
                  <p className="text-[11px] text-text-tertiary font-mono truncate mt-0.5">{ev.mediaUrl}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
