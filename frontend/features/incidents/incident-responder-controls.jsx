'use client';

import React, { useState } from 'react';
import {
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  OFFICIAL_RESPONDER_AGENCIES,
} from './types.js';

/**
 * Incident Responder Confirmation & Lifecycle Control Console
 * Authorized actions for first responders, traffic police, disaster coordinators, and admins.
 */
export function IncidentResponderControls({
  incident,
  onConfirmIncident,
  onCloseIncident,
  onStatusChange,
  isProcessing = false,
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Confirm Form State
  const [officerName, setOfficerName] = useState('Inspector K. Patil');
  const [agency, setAgency] = useState('TRAFFIC_POLICE');
  const [badgeNumber, setBadgeNumber] = useState('PUNE-TP-09');
  const [confirmedSeverity, setConfirmedSeverity] = useState(incident?.severity || INCIDENT_SEVERITY.HIGH);
  const [confirmNotes, setConfirmNotes] = useState('Collision confirmed on-scene; first aid and traffic cordon active.');

  // Close Form State
  const [closureNotes, setClosureNotes] = useState('');
  const [closureStatus, setClosureStatus] = useState(INCIDENT_STATUS.CLOSED);
  const [formError, setFormError] = useState('');

  if (!incident) return null;

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!confirmNotes.trim() || confirmNotes.trim().length < 5) {
      setFormError('Confirmation notes are required and must be at least 5 characters long.');
      return;
    }

    try {
      if (onConfirmIncident) {
        await onConfirmIncident(incident.id, {
          officerName: officerName.trim(),
          agency,
          badgeNumber: badgeNumber.trim(),
          confirmedSeverity,
          notes: confirmNotes.trim(),
        });
      }
      setShowConfirmModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to confirm incident.');
    }
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!closureNotes.trim() || closureNotes.trim().length < 5) {
      setFormError('Closure reason or notes are required and must be at least 5 characters long.');
      return;
    }

    try {
      if (onCloseIncident) {
        await onCloseIncident(incident.id, {
          notes: closureNotes.trim(),
          status: closureStatus,
        });
      }
      setShowCloseModal(false);
      setClosureNotes('');
    } catch (err) {
      setFormError(err.message || 'Failed to close incident.');
    }
  };

  const isClosed = incident.status === INCIDENT_STATUS.CLOSED || incident.status === INCIDENT_STATUS.RESOLVED;
  const isConfirmed = incident.status === INCIDENT_STATUS.RESPONDER_CONFIRMED || incident.verificationStatus === 'CONFIRMED';

  return (
    <div className="w-full bg-surface-elevated rounded-xl border border-border-primary p-4 md:p-6 shadow-elevation-1 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-primary pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Official Responder Action Console
          </h4>
          <p className="text-xs text-text-secondary">
            Ground truth confirmation and resolution workflows for authorized personnel.
          </p>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-primary">
          Current: {incident.status}
        </span>
      </div>

      {formError && (
        <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-700 font-semibold">
          {formError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Ground Truth Confirmation Action */}
        {!isConfirmed && !isClosed && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowConfirmModal(true);
            }}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-elevation-1 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            Confirm Ground Truth
          </button>
        )}

        {/* 2. Quick Lifecycle Transition Buttons */}
        {!isClosed && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange && onStatusChange(incident.id, INCIDENT_STATUS.RESPONDER_EN_ROUTE)}
              disabled={isProcessing || incident.status === INCIDENT_STATUS.RESPONDER_EN_ROUTE}
              className="px-4 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-primary font-semibold text-xs min-h-[44px] transition-colors disabled:opacity-40"
            >
              Mark En Route
            </button>
            <button
              type="button"
              onClick={() => onStatusChange && onStatusChange(incident.id, INCIDENT_STATUS.ON_SCENE)}
              disabled={isProcessing || incident.status === INCIDENT_STATUS.ON_SCENE}
              className="px-4 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-primary font-semibold text-xs min-h-[44px] transition-colors disabled:opacity-40"
            >
              Mark On Scene
            </button>
            <button
              type="button"
              onClick={() => onStatusChange && onStatusChange(incident.id, INCIDENT_STATUS.CONTAINED)}
              disabled={isProcessing || incident.status === INCIDENT_STATUS.CONTAINED}
              className="px-4 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-primary font-semibold text-xs min-h-[44px] transition-colors disabled:opacity-40"
            >
              Mark Contained
            </button>
          </>
        )}

        {/* 3. Closure Action Button */}
        {!isClosed && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowCloseModal(true);
            }}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold text-sm tracking-wide shadow-elevation-1 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:opacity-50 ml-auto"
          >
            Close Incident
          </button>
        )}

        {isClosed && (
          <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg text-xs text-slate-700 font-semibold w-full">
            Incident is CLOSED. Resolution reason: {incident.closureReason || 'Incident cleared and verified.'}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-surface-elevated rounded-xl border border-border-primary p-6 max-w-lg w-full shadow-elevation-3 space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 id="confirm-modal-title" className="text-base font-bold text-text-primary">
                Confirm Incident Ground Truth
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label htmlFor="confirm-officer-name" className="block text-xs font-bold text-text-secondary mb-1">
                  Officer / Responder Name
                </label>
                <input
                  id="confirm-officer-name"
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="confirm-agency" className="block text-xs font-bold text-text-secondary mb-1">
                    Agency
                  </label>
                  <select
                    id="confirm-agency"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
                  >
                    <option value="TRAFFIC_POLICE">Traffic Police</option>
                    <option value="POLICE">Police</option>
                    <option value="FIRE">Fire & Rescue</option>
                    <option value="AMBULANCE">Ambulance (108)</option>
                    <option value="DISASTER_MANAGEMENT">Disaster Management</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="confirm-badge" className="block text-xs font-bold text-text-secondary mb-1">
                    Unit / Badge Number
                  </label>
                  <input
                    id="confirm-badge"
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-severity" className="block text-xs font-bold text-text-secondary mb-1">
                  Confirmed Ground Severity
                </label>
                <select
                  id="confirm-severity"
                  value={confirmedSeverity}
                  onChange={(e) => setConfirmedSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
                >
                  <option value={INCIDENT_SEVERITY.CRITICAL}>CRITICAL (Mass casualties / extreme risk)</option>
                  <option value={INCIDENT_SEVERITY.HIGH}>HIGH (Active hazards / blocked corridors)</option>
                  <option value={INCIDENT_SEVERITY.MEDIUM}>MEDIUM (Moderate disruption)</option>
                  <option value={INCIDENT_SEVERITY.LOW}>LOW (Minor collision / clearable)</option>
                </select>
              </div>

              <div>
                <label htmlFor="confirm-notes" className="block text-xs font-bold text-text-secondary mb-1">
                  Responder Field Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="confirm-notes"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-border-primary bg-surface-secondary text-text-secondary font-semibold text-xs min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px]"
                >
                  Submit Ground Confirmation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closure Modal */}
      {showCloseModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-surface-elevated rounded-xl border border-border-primary p-6 max-w-lg w-full shadow-elevation-3 space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 id="close-modal-title" className="text-base font-bold text-text-primary">
                Close Incident: {incident.incidentNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-4">
              <div>
                <label htmlFor="closure-status-select" className="block text-xs font-bold text-text-secondary mb-1">
                  Final Resolution State
                </label>
                <select
                  id="closure-status-select"
                  value={closureStatus}
                  onChange={(e) => setClosureStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
                >
                  <option value={INCIDENT_STATUS.CLOSED}>CLOSED (Scene fully cleared, vehicles moved)</option>
                  <option value={INCIDENT_STATUS.RESOLVED}>RESOLVED (Action complete)</option>
                  <option value={INCIDENT_STATUS.FALSE_ALARM}>FALSE ALARM (No incident found on scene)</option>
                </select>
              </div>

              <div>
                <label htmlFor="closure-notes-input" className="block text-xs font-bold text-text-secondary mb-1">
                  Closure Reason & Resolution Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="closure-notes-input"
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Detail final actions (towing, medical handoff, debris removal, traffic restoration)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-border-primary bg-surface-secondary text-text-secondary font-semibold text-xs min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs min-h-[44px]"
                >
                  Confirm Incident Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
