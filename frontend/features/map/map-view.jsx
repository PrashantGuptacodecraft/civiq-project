'use client';
import React, { useRef, useState, useCallback } from 'react';
// Bounding box for interactive pilot viewport (covering Pune PMC & PCMC)
const VIEWPORT = {
    minLat: 18.44,
    maxLat: 18.66,
    minLng: 73.74,
    maxLng: 73.96,
};
export function MapView({ center, selectedPoint, onSelectPoint, isAmbiguous = false, disabled = false, }) {
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    // Converts geographic (lat, lng) to percentage coordinates (0% to 100%) inside the SVG
    const geoToPercent = useCallback((lat, lng) => {
        const x = ((lng - VIEWPORT.minLng) / (VIEWPORT.maxLng - VIEWPORT.minLng)) * 100;
        // Latitude increases upwards, so y is inverted
        const y = ((VIEWPORT.maxLat - lat) / (VIEWPORT.maxLat - VIEWPORT.minLat)) * 100;
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    }, []);
    // Converts pixel coordinates from click/tap into geographic (lat, lng)
    const handleMapClick = (e) => {
        if (disabled || !containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const percentX = Math.max(0, Math.min(1, clickX / rect.width));
        const percentY = Math.max(0, Math.min(1, clickY / rect.height));
        const lng = parseFloat((VIEWPORT.minLng + percentX * (VIEWPORT.maxLng - VIEWPORT.minLng)).toFixed(6));
        const lat = parseFloat((VIEWPORT.maxLat - percentY * (VIEWPORT.maxLat - VIEWPORT.minLat)).toFixed(6));
        onSelectPoint({ latitude: lat, longitude: lng });
    };
    // Keyboard navigation for accessible pin placement
    const handleKeyDown = (e) => {
        if (disabled)
            return;
        const stepLat = 0.002;
        const stepLng = 0.002;
        const currentLat = selectedPoint?.latitude ?? center.latitude;
        const currentLng = selectedPoint?.longitude ?? center.longitude;
        let newLat = currentLat;
        let newLng = currentLng;
        switch (e.key) {
            case 'ArrowUp':
                newLat = Math.min(VIEWPORT.maxLat, currentLat + stepLat);
                break;
            case 'ArrowDown':
                newLat = Math.max(VIEWPORT.minLat, currentLat - stepLat);
                break;
            case 'ArrowLeft':
                newLng = Math.max(VIEWPORT.minLng, currentLng - stepLng);
                break;
            case 'ArrowRight':
                newLng = Math.min(VIEWPORT.maxLng, currentLng + stepLng);
                break;
            default:
                return;
        }
        e.preventDefault();
        onSelectPoint({
            latitude: parseFloat(newLat.toFixed(6)),
            longitude: parseFloat(newLng.toFixed(6)),
        });
    };
    const pinPos = selectedPoint
        ? geoToPercent(selectedPoint.latitude, selectedPoint.longitude)
        : geoToPercent(center.latitude, center.longitude);
    // Divide line between PMC and PCMC is at latitude 18.575
    const borderLineY = geoToPercent(18.575, 73.85).y;
    return (<div className="relative w-full rounded-xl border border-border-primary bg-surface-secondary overflow-hidden select-none">
      {/* Map Interactive Canvas */}
      <div ref={containerRef} role="application" tabIndex={disabled ? -1 : 0} aria-label="Interactive jurisdiction map. Click or use arrow keys to place location pin." onClick={handleMapClick} onKeyDown={handleKeyDown} className={`relative w-full h-[240px] sm:h-[300px] cursor-crosshair focus:outline-none focus:ring-2 focus:ring-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
        {/* SVG Vector Map Rendering */}
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {/* Subtle Grid Lines */}
          <line x1="25" y1="0" x2="25" y2="100" stroke="#CBD5E1" strokeWidth="0.3" strokeDasharray="1,2"/>
          <line x1="50" y1="0" x2="50" y2="100" stroke="#CBD5E1" strokeWidth="0.3" strokeDasharray="1,2"/>
          <line x1="75" y1="0" x2="75" y2="100" stroke="#CBD5E1" strokeWidth="0.3" strokeDasharray="1,2"/>
          <line x1="0" y1="33" x2="100" y2="33" stroke="#CBD5E1" strokeWidth="0.3" strokeDasharray="1,2"/>
          <line x1="0" y1="66" x2="100" y2="66" stroke="#CBD5E1" strokeWidth="0.3" strokeDasharray="1,2"/>

          {/* PCMC Northern Municipality Polygon */}
          <polygon points="0,0 100,0 100,38 0,38" fill="#8B5CF6" fillOpacity="0.08" stroke="#8B5CF6" strokeWidth="0.6"/>

          {/* PMC Southern Municipality Polygon */}
          <polygon points="0,38 100,38 100,100 0,100" fill="#2563EB" fillOpacity="0.08" stroke="#2563EB" strokeWidth="0.6"/>

          {/* Ambiguous Border Buffer Zone along River / Border Line (Lat 18.575) */}
          <rect x="0" y={borderLineY - 3} width="100" height="6" fill="#F59E0B" fillOpacity="0.22" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2,1"/>

          {/* Boundary Text Labels */}
          <text x="5" y="15" fill="#6B21A8" fontSize="3.5" fontWeight="bold">
            PCMC (Pimpri-Chinchwad)
          </text>
          <text x="5" y="85" fill="#1E40AF" fontSize="3.5" fontWeight="bold">
            PMC (Pune Municipal Corp)
          </text>
          <text x="35" y={borderLineY + 1} fill="#B45309" fontSize="2.8" fontWeight="600">
            ⚠ Ambiguity Buffer (River Border)
          </text>
        </svg>

        {/* Selected Pin Marker */}
        {selectedPoint && (<div className="absolute -translate-x-1/2 -translate-y-full transition-all duration-150 pointer-events-none" style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}>
            <div className="flex flex-col items-center">
              {/* Pin Icon */}
              <div className={`p-1.5 rounded-full shadow-elevation-2 border-2 ${isAmbiguous
                ? 'bg-status-warning border-surface-primary text-text-primary'
                : 'bg-primary border-surface-primary text-text-inverse'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>

              {/* Pin Drop Shadow */}
              <div className="w-2.5 h-1 bg-text-primary/25 rounded-full blur-[1px] mt-0.5"/>
            </div>
          </div>)}
      </div>

      {/* Map Controls Overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-surface-elevated/95 backdrop-blur-sm p-1 rounded-lg border border-border-primary shadow-elevation-1">
        <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.25, 2))} aria-label="Zoom in map" className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded font-bold text-sm min-h-[32px] transition-colors">
          +
        </button>
        <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))} aria-label="Zoom out map" className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded font-bold text-sm min-h-[32px] transition-colors">
          -
        </button>
        <button type="button" onClick={() => {
            setZoom(1);
            onSelectPoint(center);
        }} aria-label="Reset map center" title="Reset map view" className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-tertiary active:bg-surface-primary rounded text-xs min-h-[32px] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </button>
      </div>

      {/* Map Instructions Footer */}
      <div className="px-3 py-1.5 bg-surface-primary border-t border-border-primary flex items-center justify-between text-[11px] text-text-secondary">
        <span>Tap anywhere to drop pin or adjust coordinates</span>
        <span className="font-mono text-[10px]">WGS-84</span>
      </div>
    </div>);
}
