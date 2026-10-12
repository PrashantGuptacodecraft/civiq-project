'use client';

import React, { useState } from 'react';

export interface LocationData {
  address: string;
  jurisdictionId: string;
  state: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  location: LocationData;
  onChange: (data: Partial<LocationData>) => void;
  errors?: {
    address?: string;
    jurisdictionId?: string;
  };
}

const JURISDICTIONS = [
  { id: 'mh-pune', name: 'Pune Municipal Corporation (PMC)', state: 'Maharashtra', district: 'Pune', city: 'Pune' },
  { id: 'mh-mumbai', name: 'Brihanmumbai Municipal Corporation (BMC)', state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
  { id: 'dl-newdelhi', name: 'New Delhi Municipal Council (NDMC)', state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
  { id: 'ka-bengaluru', name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)', state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' },
];

export function LocationPicker({ location, onChange, errors }: LocationPickerProps) {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsMessage('Acquiring precise satellite GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        onChange({
          latitude: lat,
          longitude: lng,
        });
        setGpsStatus('success');
        setGpsMessage(`Location locked: ${lat}, ${lng} (±${Math.round(position.coords.accuracy)}m)`);
      },
      (error) => {
        setGpsStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsMessage('Location permission denied. Please enter address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsMessage('Location information unavailable. Please enter address manually.');
            break;
          case error.TIMEOUT:
            setGpsMessage('Location request timed out. Please enter address manually.');
            break;
          default:
            setGpsMessage('Could not retrieve location. Please enter address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleJurisdictionChange = (jurisdictionId: string) => {
    const selected = JURISDICTIONS.find((j) => j.id === jurisdictionId);
    if (selected) {
      onChange({
        jurisdictionId: selected.id,
        state: selected.state,
        district: selected.district,
        city: selected.city,
      });
    } else {
      onChange({ jurisdictionId });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="jurisdiction-select" className="block text-sm font-bold text-text-primary mb-1">
          Responsible Jurisdiction <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">
          Select the local government body or municipality responsible for this area.
        </p>
        <select
          id="jurisdiction-select"
          value={location.jurisdictionId}
          onChange={(e) => handleJurisdictionChange(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-lg border bg-surface-elevated text-sm text-text-primary transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary ${
            errors?.jurisdictionId ? 'border-red-500 ring-1 ring-red-500' : 'border-border-primary'
          }`}
          aria-invalid={!!errors?.jurisdictionId}
          aria-describedby={errors?.jurisdictionId ? 'jurisdiction-error' : undefined}
        >
          <option value="">-- Choose Municipal Authority --</option>
          {JURISDICTIONS.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name} ({j.state})
            </option>
          ))}
        </select>
        {errors?.jurisdictionId && (
          <p id="jurisdiction-error" className="text-xs font-semibold text-red-600 mt-1" role="alert">
            {errors.jurisdictionId}
          </p>
        )}
      </div>

      {/* GPS Detection Action */}
      <div className="bg-surface-secondary border border-border-primary rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
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
          onClick={handleDetectLocation}
          disabled={gpsStatus === 'locating'}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-tertiary active:bg-surface-primary border border-border-primary text-text-primary text-xs font-bold transition-colors shrink-0 min-h-[44px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {gpsStatus === 'locating' ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24">
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

      {location.latitude !== null && location.longitude !== null && (
        <div className="flex items-center gap-4 text-xs bg-primary/5 border border-primary/20 text-primary p-2.5 rounded-lg font-mono">
          <span>Lat: {location.latitude}</span>
          <span>Lng: {location.longitude}</span>
        </div>
      )}

      {/* Street Address / Landmark Input */}
      <div>
        <label htmlFor="address-input" className="block text-sm font-bold text-text-primary mb-1">
          Street Address / Landmark <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="address-input"
          type="text"
          value={location.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="e.g. Near Shivajinagar Junction, Opp. Modern College, Pune"
          className={`w-full px-3.5 py-2.5 rounded-lg border bg-surface-elevated text-sm text-text-primary placeholder:text-text-tertiary transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary ${
            errors?.address ? 'border-red-500 ring-1 ring-red-500' : 'border-border-primary'
          }`}
          aria-invalid={!!errors?.address}
          aria-describedby={errors?.address ? 'address-error' : undefined}
        />
        {errors?.address && (
          <p id="address-error" className="text-xs font-semibold text-red-600 mt-1" role="alert">
            {errors.address}
          </p>
        )}
      </div>
    </div>
  );
}
