import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapView, MapPointPicker } from '../features/map';
import { CURRENT_RESOLVER_SOURCE, CURRENT_RESOLVER_VERSION } from '@civiq/contracts';

describe('Map Feature UI Components', () => {
  describe('MapView', () => {
    it('renders vector map with accessible application role and boundary regions', () => {
      const html = renderToStaticMarkup(
        <MapView
          center={{ latitude: 18.5314, longitude: 73.8446 }}
          selectedPoint={null}
          onSelectPoint={() => {}}
        />
      );

      expect(html).toContain('role="application"');
      expect(html).toContain('PMC (Pune Municipal Corp)');
      expect(html).toContain('PCMC (Pimpri-Chinchwad)');
      expect(html).toContain('Ambiguity Buffer (River Border)');
      expect(html).toContain('Tap anywhere to drop pin');
    });

    it('renders pin marker at selected coordinates with accessible drop shadow', () => {
      const html = renderToStaticMarkup(
        <MapView
          center={{ latitude: 18.5314, longitude: 73.8446 }}
          selectedPoint={{ latitude: 18.555, longitude: 73.805 }}
          onSelectPoint={() => {}}
        />
      );

      // Pin marker is rendered
      expect(html).toContain('<svg');
      expect(html).toContain('clip-rule="evenodd"');
    });

    it('renders zoom in, zoom out, and recenter controls', () => {
      const html = renderToStaticMarkup(
        <MapView
          center={{ latitude: 18.5314, longitude: 73.8446 }}
          selectedPoint={null}
          onSelectPoint={() => {}}
        />
      );

      expect(html).toContain('aria-label="Zoom in map"');
      expect(html).toContain('aria-label="Zoom out map"');
      expect(html).toContain('aria-label="Reset map center"');
    });
  });

  describe('MapPointPicker', () => {
    it('renders GPS auto-detect button with accessible label', () => {
      const html = renderToStaticMarkup(
        <MapPointPicker
          value={{
            latitude: null,
            longitude: null,
            jurisdictionId: '',
          }}
          onChange={() => {}}
        />
      );

      expect(html).toContain('Auto-Detect GPS Location');
      expect(html).toContain('Use My GPS');
      expect(html).toContain('Click or tap on the map to place the incident pin');
    });

    it('renders locked coordinates readout and auto-resolved jurisdiction card', () => {
      const html = renderToStaticMarkup(
        <MapPointPicker
          value={{
            latitude: 18.555,
            longitude: 73.805,
            jurisdictionId: 'mh-pune-pmc',
            jurisdictionName: 'Pune Municipal Corporation (PMC)',
            resolverVersion: CURRENT_RESOLVER_VERSION,
            resolverSource: CURRENT_RESOLVER_SOURCE,
            isBoundaryAmbiguous: false,
          }}
          onChange={() => {}}
        />
      );

      expect(html).toContain('Lat: 18.555');
      expect(html).toContain('Lng: 73.805');
      expect(html).toContain('✓ Pin Locked');
      expect(html).toContain('Pune Municipal Corporation (PMC)');
      expect(html).toContain('Auto-Resolved');
      expect(html).toContain(`Resolver: ${CURRENT_RESOLVER_VERSION}`);
      expect(html).toContain(`Source: ${CURRENT_RESOLVER_SOURCE}`);
    });

    it('renders ambiguous boundary alert and candidate options when point is in border zone', () => {
      const html = renderToStaticMarkup(
        <MapPointPicker
          value={{
            latitude: 18.57502,
            longitude: 73.805,
            jurisdictionId: 'mh-pune-pmc',
            jurisdictionName: 'Pune Municipal Corporation (PMC)',
            resolverVersion: CURRENT_RESOLVER_VERSION,
            resolverSource: CURRENT_RESOLVER_SOURCE,
            isBoundaryAmbiguous: true,
            manualJurisdictionConfirmed: false,
            ambiguityReason: 'Point is within 25m of boundary between PMC and PCMC.',
          }}
          onChange={() => {}}
        />
      );

      // Warning alert rendered
      expect(html).toContain('role="alert"');
      expect(html).toContain('Ambiguous Boundary Detected (Within 75m)');
      expect(html).toContain('Point is within 25m of boundary between PMC and PCMC.');
    });

    it('renders manually confirmed badge when citizen confirms authority in ambiguous zone', () => {
      const html = renderToStaticMarkup(
        <MapPointPicker
          value={{
            latitude: 18.57502,
            longitude: 73.805,
            jurisdictionId: 'mh-pune-pcmc',
            jurisdictionName: 'Pimpri-Chinchwad Municipal Corporation (PCMC)',
            resolverVersion: CURRENT_RESOLVER_VERSION,
            resolverSource: CURRENT_RESOLVER_SOURCE,
            isBoundaryAmbiguous: false,
            manualJurisdictionConfirmed: true,
          }}
          onChange={() => {}}
        />
      );

      expect(html).toContain('✓ Manually Confirmed');
      expect(html).toContain('Pimpri-Chinchwad Municipal Corporation (PCMC)');
    });

    it('renders error message when error prop is provided', () => {
      const html = renderToStaticMarkup(
        <MapPointPicker
          value={{
            latitude: null,
            longitude: null,
            jurisdictionId: '',
          }}
          onChange={() => {}}
          error="Please select an incident location on the map."
        />
      );

      expect(html).toContain('Please select an incident location on the map.');
      expect(html).toContain('role="alert"');
    });
  });
});
