'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapView } from './map-view';
import {
  GeoPoint,
  JurisdictionCandidate,
  JurisdictionResolutionResult,
  MapPointPickerProps,
} from './types';
import {
  CURRENT_RESOLVER_SOURCE,
  CURRENT_RESOLVER_VERSION,
} from '@civiq/shared-contracts';

// Default pilot center Municipal Corporation (Shivajinagar)
const DEFAULT_CENTER = {
  latitude: 18.5314,
  longitude: 73.8446,
};

// Client-side quick boundary resolution helper matching server logic
function resolveCoordinatesLocally(lat, lng) {
  // PMC and PCMC border line is along latitude 18.575 between lng 73.74 and 73.92
  const distanceToBorderMeters = Math.abs(lat - 18.575) * 111000;
  const isNearBorder = distanceToBorderMeters <= 75 && lng >= 73.74 && lng <= 73.92;

  const isPCMC = lat >= 18.575 && lat <= 18.68 && lng >= 73.74 && lng <= 73.92;
  const isPMC = lat >= 18.44 && lat < 18.575 && lng >= 73.78 && lng <= 73.96;
  const isAundh = lat >= 18.535 && lat < 18.575 && lng >= 73.780 && lng <= 73.830;
  const isKothrud = lat >= 18.480 && lat < 18.520 && lng >= 73.780 && lng <= 73.835;

  if (isNearBorder) {
    const primaryIsPMC = lat < 18.575;
    const candidates = [
      {
        id: 'mh-pune-pmc',
        name: 'Pune Municipal Corporation (PMC)',
        type: 'LOCAL_BODY',
        lgdCode: '250529',
        confidence: primaryIsPMC ? 0.72 : 0.65,
        distanceToBoundaryMeters.round(distanceToBorderMeters),
        isContestedOrAdjacent: !primaryIsPMC,
      },
      {
        id: 'mh-pune-pcmc',
        name: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
        type: 'LOCAL_BODY',
        lgdCode: '250530',
        confidence: primaryIsPMC ? 0.65 : 0.72,
        distanceToBoundaryMeters.round(distanceToBorderMeters),
        isContestedOrAdjacent: primaryIsPMC,
      },
    ];

    return {
      matchedJurisdiction: {
        id: primaryIsPMC ? 'mh-pune-pmc' : 'mh-pune-pcmc',
        name: primaryIsPMC ? 'Pune Municipal Corporation (PMC)' : 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
        type: 'LOCAL_BODY',
        lgdCode: primaryIsPMC ? '250529' : '250530',
        hierarchyPath: [
          { id: 'ind', name: 'India', type: 'COUNTRY' },
          { id: 'mh', name: 'Maharashtra', type: 'STATE_UT' },
          { id: 'mh-pune', name: 'Pune District', type: 'DISTRICT' },
          {
            id: primaryIsPMC ? 'mh-pune-pmc' : 'mh-pune-pcmc',
            name: primaryIsPMC ? 'Pune Municipal Corporation' : 'Pimpri-Chinchwad Municipal Corporation',
            type: 'LOCAL_BODY',
          },
        ],
      },
      resolverVersion,
      resolverSource,
      confidence: 0.68,
      isAmbiguous: true,
      ambiguityReason: `Point is within ${Math.round(distanceToBorderMeters)}m of boundary between PMC and PCMC.`,
      candidateJurisdictions: candidates,
      requiresManualConfirmation: true,
      point: { latitude: lat, longitude: lng },
      resolvedAt: new Date().toISOString(),
    };
  }

  if (isAundh) {
    return {
      matchedJurisdiction: {
        id: 'mh-pune-pmc-aundh',
        name: 'Aundh-Baner Ward (PMC)',
        type: 'WARD_VILLAGE',
        lgdCode: 'PMC-08',
        hierarchyPath: [
          { id: 'ind', name: 'India', type: 'COUNTRY' },
          { id: 'mh', name: 'Maharashtra', type: 'STATE_UT' },
          { id: 'mh-pune', name: 'Pune District', type: 'DISTRICT' },
          { id: 'mh-pune-pmc', name: 'Pune Municipal Corporation', type: 'LOCAL_BODY' },
          { id: 'mh-pune-pmc-aundh', name: 'Aundh-Baner Ward', type: 'WARD_VILLAGE' },
        ],
      },
      resolverVersion,
      resolverSource,
      confidence: 0.98,
      isAmbiguous: false,
      candidateJurisdictions: [
        {
          id: 'mh-pune-pmc-aundh',
          name: 'Aundh-Baner Ward (PMC)',
          type: 'WARD_VILLAGE',
          confidence: 0.98,
        },
      ],
      requiresManualConfirmation: false,
      point: { latitude: lat, longitude: lng },
      resolvedAt: new Date().toISOString(),
    };
  }

  if (isKothrud) {
    return {
      matchedJurisdiction: {
        id: 'mh-pune-pmc-kothrud',
        name: 'Kothrud-Bavdhan Ward (PMC)',
        type: 'WARD_VILLAGE',
        lgdCode: 'PMC-12',
        hierarchyPath: [
          { id: 'ind', name: 'India', type: 'COUNTRY' },
          { id: 'mh', name: 'Maharashtra', type: 'STATE_UT' },
          { id: 'mh-pune', name: 'Pune District', type: 'DISTRICT' },
          { id: 'mh-pune-pmc', name: 'Pune Municipal Corporation', type: 'LOCAL_BODY' },
          { id: 'mh-pune-pmc-kothrud', name: 'Kothrud-Bavdhan Ward', type: 'WARD_VILLAGE' },
        ],
      },
      resolverVersion,
      resolverSource,
      confidence: 0.98,
      isAmbiguous: false,
      candidateJurisdictions: [
        {
          id: 'mh-pune-pmc-kothrud',
          name: 'Kothrud-Bavdhan Ward (PMC)',
          type: 'WARD_VILLAGE',
          confidence: 0.98,
        },
      ],
      requiresManualConfirmation: false,
      point: { latitude: lat, longitude: lng },
      resolvedAt: new Date().toISOString(),
    };
  }

  if (isPCMC) {
    return {
      matchedJurisdiction: {
        id: 'mh-pune-pcmc',
        name: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
        type: 'LOCAL_BODY',
        lgdCode: '250530',
        hierarchyPath: [
          { id: 'ind', name: 'India', type: 'COUNTRY' },
          { id: 'mh', name: 'Maharashtra', type: 'STATE_UT' },
          { id: 'mh-pune', name: 'Pune District', type: 'DISTRICT' },
          { id: 'mh-pune-pcmc', name: 'Pimpri-Chinchwad Municipal Corporation', type: 'LOCAL_BODY' },
        ],
      },
      resolverVersion,
      resolverSource,
      confidence: 0.95,
      isAmbiguous: false,
      candidateJurisdictions: [
        {
          id: 'mh-pune-pcmc',
          name: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
          type: 'LOCAL_BODY',
          confidence: 0.95,
        },
      ],
      requiresManualConfirmation: false,
      point: { latitude: lat, longitude: lng },
      resolvedAt: new Date().toISOString(),
    };
  }

  // Fallback default Municipal Corporation
  return {
    matchedJurisdiction: {
      id: 'mh-pune-pmc',
      name: 'Pune Municipal Corporation (PMC)',
      type: 'LOCAL_BODY',
      lgdCode: '250529',
      hierarchyPath: [
        { id: 'ind', name: 'India', type: 'COUNTRY' },
        { id: 'mh', name: 'Maharashtra', type: 'STATE_UT' },
        { id: 'mh-pune', name: 'Pune District', type: 'DISTRICT' },
        { id: 'mh-pune-pmc', name: 'Pune Municipal Corporation', type: 'LOCAL_BODY' },
      ],
    },
    resolverVersion,
    resolverSource,
    confidence: 0.90,
    isAmbiguous: false,
    candidateJurisdictions: [
      {
        id: 'mh-pune-pmc',
        name: 'Pune Municipal Corporation (PMC)',
        type: 'LOCAL_BODY',
        confidence: 0.90,
      },
    ],
    requiresManualConfirmation: false,
    point: { latitude: lat, longitude: lng },
    resolvedAt: new Date().toISOString(),
  };
}

export function MapPointPicker({
  value,
  onChange,
  error,
  disabled = false,
}) {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const [resolutionResult, setResolutionResult] = useState<JurisdictionResolutionResult | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const selectedPoint{ latitude: value.latitude, longitude: value.longitude }
      ;

  // Resolve jurisdiction whenever point coordinates change
  const triggerResolution = useCallback(
    (point) => {
      setIsResolving(true);
      const res = resolveCoordinatesLocally(point.latitude, point.longitude);
      setResolutionResult(res);
      setIsResolving(false);

      onChange({
        latitude: point.latitude,
        longitude: point.longitude,
        jurisdictionId: res.matchedJurisdiction?.id ?? value.jurisdictionId,
        jurisdictionName: res.matchedJurisdiction?.name,
        resolverVersion: res.resolverVersion,
        resolverSource: res.resolverSource,
        isBoundaryAmbiguous: res.isAmbiguous,
        ambiguityReason: res.ambiguityReason,
        manualJurisdictionConfirmed: res.isAmbiguous ? false : true,
      });
    },
    [onChange, value.jurisdictionId]
  );

  // GPS Sensor Locator
  const handleDetectGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Geolocation is not supported by your browser or device.');
      return;
    }

    setGpsStatus('locating');
    setGpsMessage('Acquiring precise satellite GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setGpsStatus('success');
        setGpsMessage(`Location locked: ${lat}, ${lng} (±${Math.round(position.coords.accuracy)}m)`);
        triggerResolution({ latitude: lat, longitude: lng });
      },
      (err) => {
        setGpsStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsMessage('Location permission denied. You can click on the map to place the pin.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsMessage('Satellite GPS signal unavailable. Please select your location on the map.');
            break;
          case err.TIMEOUT:
            setGpsMessage('GPS request timed out. Please click on the map to pick location.');
            break;
          default:
            setGpsMessage('Could not retrieve GPS coordinates. Please select point on the map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // User manual confirmation of candidate jurisdiction in ambiguous zone
  const handleSelectCandidate = (candidate) => {
    onChange({
      jurisdictionId: candidate.id,
      jurisdictionName: candidate.name,
      manualJurisdictionConfirmed: true,
      isBoundaryAmbiguous: false,
    });
  };

  const currentCandidates =
    resolutionResult?.candidateJurisdictions && resolutionResult.candidateJurisdictions.length > 0
      ? resolutionResult.candidateJurisdictions
      : value.isBoundaryAmbiguous && value.latitude !== null && value.longitude !== null
      ? resolveCoordinatesLocally(value.latitude, value.longitude).candidateJurisdictions
      : [];

  const displayAmbiguityReason =
    value.ambiguityReason ??
    resolutionResult?.ambiguityReason ??
    (value.latitude !== null && value.longitude !== null
      ? resolveCoordinatesLocally(value.latitude, value.longitude).ambiguityReason
      : 'This point lies directly in the buffer zone between two municipal jurisdictions. Please select the responsible authority:');

  return (
    <div className="space-y-4">
      {/* Map View & Point Selection */}
      <div>
        <label className="block text-sm font-bold text-text-primary mb-1">
          Issue Location & Jurisdiction <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">
          Click or tap on the map to place the incident pin, or use your device GPS sensor.
        </p>

        <MapView
          center={selectedPoint ?? DEFAULT_CENTER}
          selectedPoint={selectedPoint}
          onSelectPoint={triggerResolution}
          isAmbiguous={value.isBoundaryAmbiguous}
          disabled={disabled}
        />
      </div>

      {/* GPS Action Button & Status Banner */}
      <div className="bg-surface-secondary border border-border-primary rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1">
          <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Auto-Detect GPS Location
          </span>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {gpsMessage || 'Acquire exact coordinates from your device sensor.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={disabled || gpsStatus === 'locating'}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-tertiary active:bg-surface-primary border border-border-primary text-text-primary text-xs font-bold transition-colors shrink-0 min-h-[44px] shadow-elevation-1 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {gpsStatus === 'locating' ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Locating...
            </>
          ) : (
            'Use My GPS'
          )}
        </button>
      </div>

      {/* Selected Coordinates Readout (Success State) */}
      {selectedPoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-primary/5 border border-primary/20 text-primary p-3 rounded-xl font-mono" role="status">
          <div className="flex items-center gap-3">
            <span>Lat: {selectedPoint.latitude}</span>
            <span>Lng: {selectedPoint.longitude}</span>
          </div>
          <span className="text-[11px] font-sans font-semibold bg-primary/10 px-2 py-0.5 rounded text-primary">
            ✓ Pin Locked
          </span>
        </div>
      )}

      {/* Resolving State */}
      {isResolving && (
        <div className="flex items-center gap-2 text-xs text-text-secondary p-3 bg-surface-secondary rounded-lg">
          <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Resolving municipal authority & boundary polygons...
        </div>
      )}

      {/* Ambiguous Boundary Alert & Candidate Selection */}
      {value.isBoundaryAmbiguous && !value.manualJurisdictionConfirmed && (
        <div className="border border-status-warning bg-status-warning/10 rounded-xl p-4 space-y-3" role="alert">
          <div className="flex items-start gap-2.5">
            <span className="text-status-warning text-lg shrink-0" aria-hidden="true">⚠️</span>
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                Ambiguous Boundary Detected (Within 75m)
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                {displayAmbiguityReason}
              </p>
            </div>
          </div>

          {/* Candidate Selection Buttons */}
          {currentCandidates.length > 0 && (
            <div className="space-y-2 pt-1">
              {currentCandidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className="w-full text-left p-3 rounded-lg border border-status-warning/30 bg-surface-elevated hover:bg-status-warning/20 active:bg-status-warning/30 transition-colors flex items-center justify-between min-h-[44px] focus:outline-none focus:ring-2 focus:ring-status-warning"
                >
                  <div>
                    <span className="text-xs font-bold text-text-primary block">{cand.name}</span>
                    <span className="text-[11px] text-text-secondary">
                      {cand.isContestedOrAdjacent ? 'Adjacent Municipal Authority' : 'Primary Candidate'} • Distance: ~{cand.distanceToBoundaryMeters ?? 45}m
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary px-2.5 py-1 bg-surface-secondary rounded border border-border-primary">
                    Confirm
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmed Jurisdiction Card */}
      {value.jurisdictionId && (
        <div className="bg-surface-elevated border border-border-primary rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Assigned Jurisdiction
            </span>
            {value.manualJurisdictionConfirmed ? (
              <span className="text-[11px] font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded flex items-center gap-1">
                ✓ Manually Confirmed
              </span>
            ) : (
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Auto-Resolved
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-text-primary">
            {value.jurisdictionName || value.jurisdictionId}
          </div>

          {/* Resolver Version & Source Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-primary text-[10px] text-text-tertiary">
            <span>Resolver: {value.resolverVersion || CURRENT_RESOLVER_VERSION}</span>
            <span>•</span>
            <span>Source: {value.resolverSource || CURRENT_RESOLVER_SOURCE}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs font-semibold text-status-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}