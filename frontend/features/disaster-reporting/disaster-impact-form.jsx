'use client';

import React, { useState } from 'react';
import {
  IMPACT_TYPES,
  IMPACT_TYPE_LABELS,
  IMPACT_SEVERITY,
  IMPACT_STATUS,
  RELIEF_NEEDS_OPTIONS,
  DISASTER_IMPACT_DISCLAIMER,
} from './types.js';

/**
 * Mobile-First Disaster Impact Reporting Form
 * Phase 63: Build disaster impact reporting
 *
 * Implements:
 * - Immediate life-safety 112 handoff with min 56px touch target (docs/ux/EMERGENCY-UX.md)
 * - Emergency-fast path with mandatory initial UNVERIFIED status (ADR 0002)
 * - Citizen/field reporting for flooding, blocked roads, outages, stranded persons, and needs
 * - Accessible, responsive, mobile-first design (320px - 1440px)
 */
export function DisasterImpactForm({
  activeDisaster = null,
  onSubmitSuccess,
  apiEndpoint = '/disaster-impact/reports',
}) {
  // Form State
  const [impactType, setImpactType] = useState(IMPACT_TYPES.FLOODING_WATERLOGGING);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(activeDisaster?.centroid?.latitude || 18.4950);
  const [longitude, setLongitude] = useState(activeDisaster?.centroid?.longitude || 73.8320);
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState(activeDisaster?.affectedWards?.[0] || 'Ward 9 - Sinhagad Road');
  const [isLifeThreatening, setIsLifeThreatening] = useState(false);
  const [strandedPersonsCount, setStrandedPersonsCount] = useState(0);
  const [waterDepthMeters, setWaterDepthMeters] = useState(0);
  const [roadPassable, setRoadPassable] = useState(false);
  const [reliefNeeds, setReliefNeeds] = useState([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [handoffTriggered, setHandoffTriggered] = useState(false);

  // Toggle relief need pill
  const handleToggleNeed = (needId) => {
    setReliefNeeds((prev) =>
      prev.includes(needId) ? prev.filter((id) => id !== needId) : [...prev, needId]
    );
  };

  // Quick GPS coordinate detection
  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          // Fallback Pune municipal center coordinates if permission denied
          setLatitude(18.5204);
          setLongitude(73.8567);
        }
      );
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload = {
      disasterId: activeDisaster?.id || null,
      impactType,
      severity: isLifeThreatening || strandedPersonsCount > 0
        ? IMPACT_SEVERITY.CRITICAL_LIFE_SAFETY
        : IMPACT_SEVERITY.HIGH_URGENT,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim() || 'Reported Location',
        ward,
        jurisdictionId: activeDisaster?.jurisdictionIds?.[0] || 'mh-pune-pmc',
      },
      impactDetails: {
        title: title.trim() || IMPACT_TYPE_LABELS[impactType],
        description: description.trim(),
        isLifeThreatening,
        strandedPersonsCount: Number(strandedPersonsCount),
        waterDepthMeters: Number(waterDepthMeters),
        roadPassable,
        reliefNeeds,
      },
    };

    try {
      let result;
      // If mock environment or custom handler provided
      if (onSubmitSuccess) {
        result = await onSubmitSuccess(payload);
      } else {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to submit disaster impact report.');
        }
      }

      setSubmittedReport(result?.report || payload);
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while submitting your impact report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SUCCESS STATE: Emergency Fast-Path Confirmation
  // ─────────────────────────────────────────────────────────────
  if (submittedReport) {
    return (
      <section
        role="status"
        aria-label="Impact Report Submission Confirmation"
        className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-elevation-2 p-6 md:p-8"
      >
        {/* Top Emergency Notice */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-6">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div>
            <span className="inline-block bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded uppercase tracking-wider">
              Status: UNVERIFIED
            </span>
            <p className="text-xs md:text-sm text-amber-900 font-semibold mt-0.5">
              Recorded immediately for municipal situational awareness without automated triage delays.
            </p>
          </div>
        </div>

        {/* Life-Safety Handoff Prominence */}
        {(submittedReport.impactDetails?.isLifeThreatening || submittedReport.impactDetails?.strandedPersonsCount > 0) && (
          <aside
            role="alert"
            className="w-full bg-red-600 text-white rounded-xl p-5 mb-6 border-2 border-red-700 shadow-elevation-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-white">Critical Emergency Help Needed?</h3>
                <p className="text-sm text-red-50 mt-1">
                  CivIQ is a civic tracking platform, not an emergency dispatch service. Dial 112 immediately.
                </p>
              </div>
              <a
                href="tel:112"
                onClick={() => setHandoffTriggered(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-red-700 font-black text-lg rounded-xl shadow min-h-[56px] min-w-[160px] hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-white shrink-0"
                aria-label="Call 112 Emergency Hotline"
              >
                Call 112
              </a>
            </div>
          </aside>
        )}

        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Impact Report Recorded</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Report Reference: <strong className="text-gray-900 font-mono">{submittedReport.reportId || 'DIR-PENDING'}</strong>
          </p>
          {submittedReport.disasterTitle && (
            <p className="text-xs text-blue-700 font-semibold mt-1">
              Bound to Event: {submittedReport.disasterTitle}
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 my-6 text-left border border-gray-200 text-sm space-y-2">
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-gray-500">Hazard Category:</span>
            <span className="font-bold text-gray-800">{IMPACT_TYPE_LABELS[submittedReport.impactType] || submittedReport.impactType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-gray-500">Location:</span>
            <span className="font-semibold text-gray-800">{submittedReport.location?.ward || 'Pune Ward'} ({submittedReport.location?.latitude?.toFixed(4)}, {submittedReport.location?.longitude?.toFixed(4)})</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Report Status:</span>
            <span className="font-bold text-amber-700">{submittedReport.status || 'UNVERIFIED'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setSubmittedReport(null)}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 min-h-[48px] focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Submit Another Report
          </button>
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-6 leading-relaxed">
          {DISASTER_IMPACT_DISCLAIMER}
        </p>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // REPORT INTAKE FORM VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-elevation-2 p-5 sm:p-7 transition-all"
      aria-label="Disaster Impact Rapid Reporting Form"
    >
      {/* 1. Life Safety Handoff Banner (Always on top per docs/ux/EMERGENCY-UX.md) */}
      <aside
        role="alert"
        aria-label="Life Safety Emergency Notice"
        className="w-full bg-red-600 text-white rounded-xl p-4 sm:p-5 mb-6 border-2 border-red-700 shadow-elevation-2"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Life-Threatening Emergency?
              </h2>
              <p className="text-xs sm:text-sm text-red-100 mt-0.5 leading-snug">
                For immediate rescue, trapped persons, or medical crisis, contact 112 directly.
              </p>
            </div>
          </div>
          <a
            href="tel:112"
            onClick={() => setHandoffTriggered(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-base shrink-0 shadow-elevation-1 min-h-[56px] min-w-[140px] text-center focus:ring-4 focus:ring-white"
            aria-label="Call 112 National Emergency Hotline now (56px touch target)"
          >
            Call 112
          </a>
        </div>
      </aside>

      {/* Header and Bound Disaster Notice */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Report Disaster Impact
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Mode: UNVERIFIED Fast-Path
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {activeDisaster
            ? `Bound to active incident: ${activeDisaster.title}`
            : 'Submit localized ground-truth hazard reports for civic coordination.'}
        </p>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Impact Category Selection Tiles */}
      <fieldset className="mb-6">
        <legend className="block text-sm font-black text-gray-900 mb-2">
          Select Ground Impact Category <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Object.entries(IMPACT_TYPE_LABELS).map(([typeKey, label]) => {
            const isSelected = impactType === typeKey;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setImpactType(typeKey)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between min-h-[72px] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-pressed={isSelected}
              >
                <span className="text-xs sm:text-sm leading-snug">{label}</span>
                {isSelected && (
                  <span className="text-[10px] text-blue-700 font-extrabold uppercase mt-1">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Life Threatening & Stranded Persons Quick Toggles */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="pr-4">
            <span className="block font-black text-sm text-red-900">
              Immediate Life-Threatening Danger?
            </span>
            <span className="block text-xs text-red-700 mt-0.5">
              Check if water level is rising rapidly, people trapped, or structural collapse risk.
            </span>
          </div>
          <input
            type="checkbox"
            checked={isLifeThreatening}
            onChange={(e) => setIsLifeThreatening(e.target.checked)}
            className="w-6 h-6 text-red-600 rounded border-red-300 focus:ring-red-500 shrink-0 cursor-pointer"
          />
        </label>

        {/* Stranded Persons Counter */}
        {(isLifeThreatening || impactType === IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED) && (
          <div className="pt-3 border-t border-red-200 flex items-center justify-between">
            <label htmlFor="stranded-count" className="text-xs font-bold text-red-900">
              Estimated Stranded Persons Count:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStrandedPersonsCount((c) => Math.max(0, c - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-red-300 font-black text-red-700 flex items-center justify-center text-lg active:bg-red-100"
                aria-label="Decrease stranded count"
              >
                -
              </button>
              <input
                id="stranded-count"
                type="number"
                min="0"
                value={strandedPersonsCount}
                onChange={(e) => setStrandedPersonsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-16 text-center font-bold text-base bg-white border border-red-300 rounded-lg py-1 text-red-900"
              />
              <button
                type="button"
                onClick={() => setStrandedPersonsCount((c) => c + 1)}
                className="w-9 h-9 rounded-lg bg-white border border-red-300 font-black text-red-700 flex items-center justify-center text-lg active:bg-red-100"
                aria-label="Increase stranded count"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Location Details (GPS + Address) */}
      <fieldset className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-black text-gray-900">
            Location &amp; Coordinates <span className="text-red-500">*</span>
          </legend>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Auto-Detect GPS
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="input-lat" className="block text-xs font-semibold text-gray-600 mb-1">
              Latitude
            </label>
            <input
              id="input-lat"
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label htmlFor="input-lng" className="block text-xs font-semibold text-gray-600 mb-1">
              Longitude
            </label>
            <input
              id="input-lng"
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label htmlFor="input-address" className="block text-xs font-semibold text-gray-600 mb-1">
            Street Address or Landmark
          </label>
          <input
            id="input-address"
            type="text"
            placeholder="e.g. Near Vitthal Mandir, Sinhagad Road"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      {/* 5. Specific Impact Fields (Water Depth, Road Passability) */}
      {impactType === IMPACT_TYPES.FLOODING_WATERLOGGING && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <label htmlFor="water-depth" className="block text-xs font-bold text-blue-900">
            Water Depth Level: {waterDepthMeters} meters ({Math.round(waterDepthMeters * 3.28)} feet)
          </label>
          <input
            id="water-depth"
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={waterDepthMeters}
            onChange={(e) => setWaterDepthMeters(parseFloat(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-blue-800 font-semibold">
            <span>Ankle (0.2m)</span>
            <span>Knee (0.5m)</span>
            <span>Waist (1.0m)</span>
            <span>Chest+ (1.5m+)</span>
          </div>
        </div>
      )}

      {impactType === IMPACT_TYPES.BLOCKED_ROAD_DEBRIS && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-gray-800">Can any vehicles pass through?</span>
            <input
              type="checkbox"
              checked={roadPassable}
              onChange={(e) => setRoadPassable(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>
      )}

      {/* 6. Relief Needs Multi-Select */}
      <fieldset className="mb-6">
        <legend className="block text-xs font-black text-gray-700 mb-2">
          Urgent Ground Relief Supplies Needed
        </legend>
        <div className="flex flex-wrap gap-2">
          {RELIEF_NEEDS_OPTIONS.map((need) => {
            const isSelected = reliefNeeds.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => handleToggleNeed(need.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                aria-pressed={isSelected}
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 7. Incident Description */}
      <div className="mb-6">
        <label htmlFor="input-description" className="block text-xs font-bold text-gray-700 mb-1">
          Detailed Observations / Landmarks
        </label>
        <textarea
          id="input-description"
          rows={3}
          placeholder="Describe ground situation, road closures, or special assistance needed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Action (Fast-Path, accessible min 48px touch target) */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 rounded-xl font-black text-base md:text-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-elevation-2 min-h-[52px] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Recording Impact Report...
          </>
        ) : (
          'Submit Impact Report (Fast-Path)'
        )}
      </button>

      <p className="text-[11px] text-gray-500 text-center mt-4 leading-relaxed">
        {DISASTER_IMPACT_DISCLAIMER}
      </p>
    </form>
  );
}
