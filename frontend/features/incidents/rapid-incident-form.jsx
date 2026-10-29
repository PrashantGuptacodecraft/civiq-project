'use client';

import React, { useState } from 'react';
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  INCIDENT_HAZARDS,
  HAZARD_LABELS,
} from './types.js';

/**
 * Rapid Emergency Incident Submission Form
 * Low friction, minimal required fields, sets UNVERIFIED status, promotes Call 112.
 */
export function RapidIncidentForm({ onSubmit, isSubmitting = false }) {
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT);
  const [address, setAddress] = useState('FC Road near Goodluck Chowk, Pune');
  const [latitude, setLatitude] = useState(18.5204);
  const [longitude, setLongitude] = useState(73.8567);
  const [jurisdictionId, setJurisdictionId] = useState('mh-pune-pmc');
  const [hasCasualties, setHasCasualties] = useState(false);
  const [injuredCount, setInjuredCount] = useState(1);
  const [trappedCount, setTrappedCount] = useState(0);
  const [requiresAmbulance, setRequiresAmbulance] = useState(true);
  const [selectedHazards, setSelectedHazards] = useState([INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE]);
  const [description, setDescription] = useState('');
  const [handoffTo112, setHandoffTo112] = useState(true);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [validationError, setValidationError] = useState('');

  const toggleHazard = (hazardKey) => {
    setSelectedHazards((prev) =>
      prev.includes(hazardKey)
        ? prev.filter((h) => h !== hazardKey)
        : [...prev, hazardKey]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!address.trim()) {
      setValidationError('Location address or landmark is required for emergency dispatch.');
      return;
    }

    const payload = {
      incidentType,
      location: {
        latitude: Number(latitude) || 18.5204,
        longitude: Number(longitude) || 73.8567,
        address: address.trim(),
        jurisdictionId,
      },
      casualties: hasCasualties
        ? {
            hasCasualties: true,
            injuredCount: Number(injuredCount) || 1,
            trappedCount: Number(trappedCount) || 0,
            requiresAmbulance: Boolean(requiresAmbulance),
          }
        : { hasCasualties: false },
      hazards: selectedHazards.length > 0 ? selectedHazards : [INCIDENT_HAZARDS.NONE],
      description: description.trim() || undefined,
      handoffTo112,
    };

    try {
      if (onSubmit) {
        const result = await onSubmit(payload);
        if (result && result.incident) {
          setSubmittedIncident(result.incident);
        } else if (result && result.id) {
          setSubmittedIncident(result);
        }
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to submit emergency report.');
    }
  };

  const handleReset = () => {
    setSubmittedIncident(null);
    setDescription('');
    setHasCasualties(false);
  };

  // Immediate Confirmation Screen with UNVERIFIED state and official 112 guidance
  if (submittedIncident) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-surface-elevated rounded-xl border-2 border-amber-500/40 p-6 md:p-8 shadow-elevation-2 animate-fade-in"
      >
        <div className="flex items-center gap-3 text-amber-700 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-lg">
            !
          </div>
          <div>
            <span className="inline-block bg-amber-500/20 text-amber-900 border border-amber-500/40 text-xs font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
              STATUS: UNVERIFIED
            </span>
            <h3 className="text-xl font-extrabold text-text-primary">
              Emergency Incident Recorded in CivIQ
            </h3>
          </div>
        </div>

        <div className="bg-surface-secondary rounded-lg p-4 mb-6 border border-border-primary space-y-2">
          <p className="text-sm text-text-primary">
            <strong>Incident Number:</strong> <span className="font-mono text-primary font-bold">{submittedIncident.incidentNumber}</span>
          </p>
          <p className="text-sm text-text-primary">
            <strong>Title:</strong> {submittedIncident.title}
          </p>
          <p className="text-sm text-text-primary">
            <strong>Location:</strong> {submittedIncident.location?.address}
          </p>
          <p className="text-sm text-text-secondary">
            <strong>Official 112 Handoff:</strong>{' '}
            {submittedIncident.officialResponderHandoff?.isHandedOffTo112
              ? 'Initiated (CAD reference active)'
              : 'Direct Call Available Below'}
          </p>
        </div>

        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 md:p-5 mb-6 text-red-950">
          <h4 className="font-bold text-red-800 text-sm md:text-base flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Life Safety Instructions
          </h4>
          <p className="text-xs md:text-sm text-red-900 mt-1 leading-relaxed">
            This incident has been recorded in CivIQ as <strong>UNVERIFIED</strong> to prevent blocking official response efforts.
            CivIQ is not an authorized emergency dispatch center. If anyone is in immediate physical danger, contact emergency services directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="tel:112"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-elevation-1 min-h-[48px]"
            >
              Dial 112 Now
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-lg bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-primary font-semibold text-sm min-h-[48px]"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Rapid Emergency Incident Submission Form"
      className="w-full bg-surface-elevated rounded-xl border border-border-primary p-4 md:p-6 shadow-elevation-1 space-y-6"
    >
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-extrabold text-text-primary flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" aria-hidden="true" />
            Rapid Emergency Report
          </h3>
          <span className="text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
            UNVERIFIED INTAKE
          </span>
        </div>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          Fast-path reporting for immediate accidents, collapses, live wire hazards, and structural risks.
        </p>
      </div>

      {validationError && (
        <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs md:text-sm text-red-700 font-semibold">
          {validationError}
        </div>
      )}

      {/* 1. Incident Type Quick Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-text-primary">
          Select Incident Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(INCIDENT_TYPE_LABELS).map(([key, label]) => {
            const isSelected = incidentType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIncidentType(key)}
                className={`p-3 rounded-lg border text-left text-xs md:text-sm font-semibold transition-colors min-h-[48px] flex items-center justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 font-bold'
                    : 'border-border-primary bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                <span>{label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-primary shrink-0 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Rapid Location & Jurisdiction */}
      <div className="space-y-3">
        <label htmlFor="incident-address" className="block text-sm font-bold text-text-primary">
          Incident Location / Landmark <span className="text-red-500">*</span>
        </label>
        <input
          id="incident-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., Paud Road Flyover Ramp, Kothrud"
          className="w-full px-3.5 py-2.5 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px] focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <label htmlFor="incident-lat" className="text-text-secondary block mb-1">Latitude</label>
            <input
              id="incident-lat"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full px-3 py-1.5 rounded border border-border-primary bg-surface-secondary text-text-primary text-xs"
            />
          </div>
          <div>
            <label htmlFor="incident-lng" className="text-text-secondary block mb-1">Longitude</label>
            <input
              id="incident-lng"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="w-full px-3 py-1.5 rounded border border-border-primary bg-surface-secondary text-text-primary text-xs"
            />
          </div>
          <div>
            <label htmlFor="incident-jur" className="text-text-secondary block mb-1">Jurisdiction</label>
            <select
              id="incident-jur"
              value={jurisdictionId}
              onChange={(e) => setJurisdictionId(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-border-primary bg-surface-secondary text-text-primary text-xs"
            >
              <option value="mh-pune-pmc">Pune (PMC)</option>
              <option value="mh-pune-pcmc">Pimpri Chinchwad (PCMC)</option>
              <option value="mh-mumbai-bmc">Mumbai (BMC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Life-Safety Casualties Quick Toggles */}
      <div className="space-y-3 bg-surface-secondary/70 p-4 rounded-xl border border-border-primary">
        <div className="flex items-center justify-between">
          <label htmlFor="has-casualties-toggle" className="text-sm font-bold text-text-primary cursor-pointer">
            Are there any injuries or trapped persons?
          </label>
          <input
            id="has-casualties-toggle"
            type="checkbox"
            checked={hasCasualties}
            onChange={(e) => setHasCasualties(e.target.checked)}
            className="w-5 h-5 text-red-600 rounded border-border-secondary focus:ring-red-500 cursor-pointer"
          />
        </div>

        {hasCasualties && (
          <div className="pt-2 border-t border-border-primary/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            <div>
              <label htmlFor="injured-count" className="block text-xs font-semibold text-text-secondary mb-1">
                Injured Count
              </label>
              <input
                id="injured-count"
                type="number"
                min="1"
                value={injuredCount}
                onChange={(e) => setInjuredCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 rounded border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="trapped-count" className="block text-xs font-semibold text-text-secondary mb-1">
                Trapped Persons
              </label>
              <input
                id="trapped-count"
                type="number"
                min="0"
                value={trappedCount}
                onChange={(e) => setTrappedCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded border border-border-primary bg-surface-primary text-text-primary text-sm min-h-[44px]"
              />
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-6">
              <input
                id="ambulance-needed"
                type="checkbox"
                checked={requiresAmbulance}
                onChange={(e) => setRequiresAmbulance(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-border-secondary"
              />
              <label htmlFor="ambulance-needed" className="text-xs font-bold text-red-700 cursor-pointer">
                Ambulance Needed (108)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Hazards Checkboxes */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-text-primary">
          Immediate Hazards Present
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(HAZARD_LABELS).map(([hazardKey, hazardLabel]) => {
            const isChecked = selectedHazards.includes(hazardKey);
            return (
              <label
                key={hazardKey}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors min-h-[44px] ${
                  isChecked
                    ? 'border-red-500/40 bg-red-500/10 text-red-800 font-bold'
                    : 'border-border-primary bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleHazard(hazardKey)}
                  className="w-4 h-4 text-red-600 rounded border-border-secondary focus:ring-red-500 shrink-0"
                />
                <span>{hazardLabel}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Brief Notes (Optional) */}
      <div className="space-y-1">
        <label htmlFor="incident-notes" className="block text-xs font-semibold text-text-secondary">
          Additional Description (Optional)
        </label>
        <textarea
          id="incident-notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what happened (vehicles involved, blocked lanes, smoke intensity)..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border-primary bg-surface-primary text-text-primary text-sm focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {/* 6. Official Call 112 Handoff Checkbox */}
      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            id="handoff-112-toggle"
            type="checkbox"
            checked={handoffTo112}
            onChange={(e) => setHandoffTo112(e.target.checked)}
            className="w-5 h-5 text-red-600 rounded border-border-secondary focus:ring-red-500 cursor-pointer"
          />
          <label htmlFor="handoff-112-toggle" className="text-xs md:text-sm font-bold text-red-800 cursor-pointer">
            Initiate Official Call 112 Emergency Handoff
          </label>
        </div>
        <span className="text-xs text-red-700 font-semibold hidden sm:inline">
          Official Police/Fire/EMS
        </span>
      </div>

      {/* 7. Action Button - 56px touch target */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-base md:text-lg tracking-wide shadow-elevation-2 min-h-[56px] transition-colors focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Recording Emergency Report...' : 'Submit Rapid Emergency Report (UNVERIFIED)'}
        </button>
      </div>
    </form>
  );
}
