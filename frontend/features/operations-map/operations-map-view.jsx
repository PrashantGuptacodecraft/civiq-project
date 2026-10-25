'use client';
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { clusterMarkers } from './clustering.js';

// Pilot Viewport bounds covering Pune (PMC) and Pimpri-Chinchwad (PCMC)
const VIEWPORT = {
  minLat: 18.44,
  maxLat: 18.66,
  minLng: 73.74,
  maxLng: 73.96,
};

// Colors mapping for statuses
const STATUS_COLORS = {
  SUBMITTED: { bg: '#F59E0B', text: '#FFFFFF', ring: '#D97706' },
  ASSIGNED: { bg: '#6366F1', text: '#FFFFFF', ring: '#4F46E5' },
  IN_PROGRESS: { bg: '#3B82F6', text: '#FFFFFF', ring: '#2563EB' },
  RESOLVED: { bg: '#10B981', text: '#FFFFFF', ring: '#059669' },
  CLOSED: { bg: '#64748B', text: '#FFFFFF', ring: '#475569' },
  REOPENED: { bg: '#EF4444', text: '#FFFFFF', ring: '#DC2626' },
};

// Priority size scale (larger = higher priority as required by MAP-UX-SPECIFICATION.md)
const PRIORITY_SIZES = {
  CRITICAL: 36,
  HIGH: 32,
  MEDIUM: 28,
  LOW: 24,
};

export function OperationsMapView({
  issues = [],
  selectedIssue = null,
  onSelectIssue,
  isClustered = true,
  isLoading = false,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 });

  // Geographic (lat, lng) to SVG percentage coordinates (0% to 100%)
  const geoToPercent = useCallback((lat, lng) => {
    const x = ((lng - VIEWPORT.minLng) / (VIEWPORT.maxLng - VIEWPORT.minLng)) * 100;
    const y = ((VIEWPORT.maxLat - lat) / (VIEWPORT.maxLat - VIEWPORT.minLat)) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  // Compute clustered vs individual markers based on current zoom
  const displayMarkers = useMemo(() => {
    if (!isClustered) {
      return issues.map((issue) => ({
        id: `point-${issue.id}`,
        isCluster: false,
        issue,
        latitude: issue.latitude,
        longitude: issue.longitude,
        status: issue.status,
        severity: issue.severity,
        department: issue.department,
        verificationStatus: issue.verificationStatus,
      }));
    }
    return clusterMarkers(issues, zoom);
  }, [issues, isClustered, zoom]);

  // Handle zoom in / out
  const handleZoomIn = () => setZoom((z) => Math.min(parseFloat((z + 0.35).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(parseFloat((z - 0.35).toFixed(2)), 0.8));
  const handleReset = () => {
    setZoom(1);
    setCenterOffset({ x: 0, y: 0 });
  };

  // Center on user location simulation
  const handleMyLocation = () => {
    setZoom(1.3);
    // Center around Pune PMC headquarters (18.528, 73.852)
    const pos = geoToPercent(18.528, 73.852);
    setCenterOffset({ x: 50 - pos.x, y: 50 - pos.y });
  };

  // Border between PMC and PCMC is at latitude ~ 18.575
  const borderLineY = geoToPercent(18.575, 73.85).y;

  return (
    <div className="relative w-full rounded-2xl border border-border-primary bg-surface-secondary overflow-hidden select-none shadow-elevation-1">
      {/* Map Canvas */}
      <div
        ref={containerRef}
        role="application"
        tabIndex={0}
        aria-label="CivIQ Operational Jurisdiction Map. Interactive vector map showing issues and clusters."
        className="relative w-full h-[360px] sm:h-[460px] lg:h-[540px] overflow-hidden bg-[#F1F5F9] cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {/* Transform container for zoom and pan */}
        <div
          className="w-full h-full relative transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${centerOffset.x}%, ${centerOffset.y}%)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Base SVG Map Layer */}
          <svg
            className="w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Subtle Coordinate Grid Lines */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="#CBD5E1" strokeWidth="0.25" strokeDasharray="1,2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#CBD5E1" strokeWidth="0.25" strokeDasharray="1,2" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#CBD5E1" strokeWidth="0.25" strokeDasharray="1,2" />
            <line x1="0" y1="33" x2="100" y2="33" stroke="#CBD5E1" strokeWidth="0.25" strokeDasharray="1,2" />
            <line x1="0" y1="66" x2="100" y2="66" stroke="#CBD5E1" strokeWidth="0.25" strokeDasharray="1,2" />

            {/* PCMC (Northern Jurisdiction Polygon) */}
            <polygon
              points="0,0 100,0 100,38 0,38"
              fill="#8B5CF6"
              fillOpacity="0.08"
              stroke="#8B5CF6"
              strokeWidth="0.5"
            />

            {/* PMC (Southern Jurisdiction Polygon) */}
            <polygon
              points="0,38 100,38 100,100 0,100"
              fill="#2563EB"
              fillOpacity="0.08"
              stroke="#2563EB"
              strokeWidth="0.5"
            />

            {/* Ambiguity Buffer Zone along Mula/Mutha River Border (Lat ~ 18.575) */}
            <rect
              x="0"
              y={borderLineY - 2.5}
              width="100"
              height="5"
              fill="#F59E0B"
              fillOpacity="0.18"
              stroke="#F59E0B"
              strokeWidth="0.4"
              strokeDasharray="2,1"
            />

            {/* Jurisdiction Text Labels */}
            <text x="3" y="12" fill="#6B21A8" fontSize="3.2" fontWeight="700">
              PCMC (Pimpri-Chinchwad)
            </text>
            <text x="3" y="88" fill="#1E40AF" fontSize="3.2" fontWeight="700">
              PMC (Pune Municipal Corp)
            </text>
            <text x="28" y={borderLineY + 1} fill="#B45309" fontSize="2.5" fontWeight="600">
              ⚡ Ambiguity Buffer Zone (Mula River Border)
            </text>
          </svg>

          {/* Interactive Markers Layer */}
          {displayMarkers.map((marker) => {
            const pos = geoToPercent(marker.latitude, marker.longitude);

            if (marker.isCluster) {
              // CLUSTER MARKER
              const isClusterCritical = marker.dominantSeverity === 'CRITICAL';
              const statusStyle = STATUS_COLORS[marker.dominantStatus] || STATUS_COLORS.SUBMITTED;

              return (
                <div
                  key={marker.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform hover:scale-110 active:scale-95"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => {
                    // Zoom into cluster on click
                    setZoom((z) => Math.min(z + 0.45, 2.5));
                    if (marker.issues?.[0]) {
                      onSelectIssue(marker.issues[0]);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Cluster of ${marker.count} issues with dominant status ${marker.dominantStatus}. Tap to zoom.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setZoom((z) => Math.min(z + 0.45, 2.5));
                      if (marker.issues?.[0]) onSelectIssue(marker.issues[0]);
                    }
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring for critical issues */}
                    {isClusterCritical && (
                      <span className="absolute inline-flex h-11 w-11 rounded-full bg-priority-critical opacity-70 animate-ping pointer-events-none" />
                    )}

                    {/* Cluster Circle Body */}
                    <div
                      className="w-10 h-10 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-elevation-3 border-2 border-surface-primary"
                      style={{
                        backgroundColor: isClusterCritical ? '#DC2626' : statusStyle.bg,
                        color: '#FFFFFF',
                      }}
                    >
                      <span>{marker.count}</span>
                    </div>

                    {/* Dominant Severity Pill */}
                    <span
                      className="absolute -bottom-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow-elevation-1 uppercase tracking-wider text-text-inverse"
                      style={{
                        backgroundColor:
                          marker.dominantSeverity === 'CRITICAL'
                            ? '#DC2626'
                            : marker.dominantSeverity === 'HIGH'
                            ? '#EA580C'
                            : '#475569',
                      }}
                    >
                      {marker.dominantSeverity}
                    </span>
                  </div>
                </div>
              );
            }

            // SINGLE ISSUE MARKER
            const issue = marker.issue;
            const isSelected = selectedIssue?.id === issue.id;
            const size = PRIORITY_SIZES[issue.severity] || 28;
            const isCritical = issue.severity === 'CRITICAL';
            const statusConfig = STATUS_COLORS[issue.status] || STATUS_COLORS.SUBMITTED;

            return (
              <div
                key={marker.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-115 z-20'
                }`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => onSelectIssue(issue)}
                role="button"
                tabIndex={0}
                aria-label={`${issue.severity} priority issue: ${issue.title}. Status: ${issue.status}. Department: ${issue.department}.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectIssue(issue);
                  }
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Pulsing indicator for active critical emergency */}
                  {isCritical && (
                    <span className="absolute inline-flex h-9 w-9 rounded-full bg-priority-critical opacity-60 animate-ping pointer-events-none" />
                  )}

                  {/* Marker Pin */}
                  <div
                    className={`rounded-full flex items-center justify-center shadow-elevation-3 transition-all ${
                      isSelected
                        ? 'ring-4 ring-primary ring-offset-2 scale-110'
                        : 'border-2 border-surface-primary'
                    }`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: isCritical ? '#DC2626' : statusConfig.bg,
                      color: '#FFFFFF',
                    }}
                  >
                    {/* Category Icon */}
                    {issue.categoryId?.includes('manhole') ? (
                      <span className="text-xs font-bold" aria-hidden="true">⚠️</span>
                    ) : issue.categoryId?.includes('water') ? (
                      <span className="text-xs font-bold" aria-hidden="true">💧</span>
                    ) : issue.categoryId?.includes('lighting') ? (
                      <span className="text-xs font-bold" aria-hidden="true">💡</span>
                    ) : issue.categoryId?.includes('waste') ? (
                      <span className="text-xs font-bold" aria-hidden="true">🗑️</span>
                    ) : (
                      <span className="text-xs font-bold" aria-hidden="true">📍</span>
                    )}
                  </div>

                  {/* Selected Marker Label Tooltip */}
                  {isSelected && (
                    <div className="absolute bottom-full mb-1.5 px-2 py-1 bg-text-primary text-text-inverse text-[11px] font-medium rounded shadow-elevation-2 whitespace-nowrap pointer-events-none">
                      {issue.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-surface-primary/60 backdrop-blur-[1px] flex items-center justify-center z-40">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-elevated rounded-lg border border-border-primary shadow-elevation-2 text-text-primary text-sm font-medium">
              <svg className="animate-spin w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Updating operational map points...
            </div>
          </div>
        )}
      </div>

      {/* Floating Map Controls Overlay (Target touch minimum 44x44px) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 bg-surface-elevated/95 backdrop-blur-sm p-1.5 rounded-xl border border-border-primary shadow-elevation-2 z-30">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in operational map"
          title="Zoom In"
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded-lg font-bold text-lg min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out operational map"
          title="Zoom Out"
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded-lg font-bold text-lg min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleMyLocation}
          aria-label="Center map on my location"
          title="My Location"
          className="w-11 h-11 flex items-center justify-center text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded-lg min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset map viewport center"
          title="Reset View"
          className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded-lg min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {/* Map Legend & Status Footer */}
      <div className="px-4 py-2 bg-surface-primary border-t border-border-primary flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-text-primary">Markers:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-priority-critical inline-block" /> Critical
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-status-info inline-block" /> In Progress
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-status-success inline-block" /> Resolved
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-status-warning inline-block" /> Submitted
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-text-tertiary">
          <span>Scale: ~1:50,000</span>
          <span>•</span>
          <span>Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}
