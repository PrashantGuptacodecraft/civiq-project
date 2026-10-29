/**
 * Phase 56 Exit Checks: Emergency UX and Safety-Path Tests
 * Validates rapid incident submission, UNVERIFIED state, prominent Call 112 handoff,
 * responder ground truth confirmation, closure, timeline, and notifications.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  EmergencyHandoffBanner,
  RapidIncidentForm,
  IncidentTimelineView,
  IncidentResponderControls,
  IncidentNotificationsFeed,
  IncidentResponseDashboard,
  MOCK_INCIDENTS,
  MOCK_TIMELINES,
  MOCK_NOTIFICATIONS,
} from '../features/incidents/index.js';

describe('Phase 56: Accident Response Workflow & Emergency UX', () => {
  describe('1. EmergencyHandoffBanner (Safety Path & 112 Handoff)', () => {
    it('renders prominent life-safety emergency banner with official 112 hotline link', () => {
      const html = renderToStaticMarkup(<EmergencyHandoffBanner />);
      expect(html).toContain('Life-Threatening Accident or Hazard?');
      expect(html).toContain('Call 112 Now');
      expect(html).toContain('href="tel:112"');
      expect(html).toContain('min-h-[56px]');
    });

    it('enforces clear CivIQ boundary disclaimer stating it is not an emergency dispatch service', () => {
      const html = renderToStaticMarkup(<EmergencyHandoffBanner />);
      expect(html).toContain('not an official emergency dispatch service');
      expect(html).toContain('contact emergency responders immediately');
    });

    it('includes alternative emergency helpline numbers for ambulance, fire, and police', () => {
      const html = renderToStaticMarkup(<EmergencyHandoffBanner />);
      expect(html).toContain('108 (Ambulance)');
      expect(html).toContain('101 (Fire)');
      expect(html).toContain('100 (Police)');
      expect(html).toContain('href="tel:108"');
    });

    it('displays CAD-112 handoff confirmation indicator when already handed off', () => {
      const html = renderToStaticMarkup(<EmergencyHandoffBanner isHandedOff={true} />);
      expect(html).toContain('Official emergency handoff registered with CAD-112');
      expect(html).toContain('UNVERIFIED state');
    });
  });

  describe('2. RapidIncidentForm (Low Friction Intake & UNVERIFIED State)', () => {
    it('renders rapid emergency submission form with UNVERIFIED intake badge', () => {
      const html = renderToStaticMarkup(<RapidIncidentForm />);
      expect(html).toContain('Rapid Emergency Report');
      expect(html).toContain('UNVERIFIED INTAKE');
      expect(html).toContain('Road Traffic Accident');
      expect(html).toContain('Incident Location / Landmark');
    });

    it('includes life-safety casualty toggles and active hazard checkboxes', () => {
      const html = renderToStaticMarkup(<RapidIncidentForm />);
      expect(html).toContain('Are there any injuries or trapped persons?');
      expect(html).toContain('Immediate Hazards Present');
      expect(html).toContain('Fuel / Gas Leak');
      expect(html).toContain('Live Wires / Electric Hazard');
      expect(html).toContain('Major Traffic Blockage');
    });

    it('provides prominent Call 112 handoff toggle and min 56px touch target submit button', () => {
      const html = renderToStaticMarkup(<RapidIncidentForm />);
      expect(html).toContain('Initiate Official Call 112 Emergency Handoff');
      expect(html).toContain('Submit Rapid Emergency Report (UNVERIFIED)');
      expect(html).toContain('min-h-[56px]');
    });
  });

  describe('3. IncidentTimelineView (Chronological Timeline & Sensitive Data Protection)', () => {
    const testIncident = MOCK_INCIDENTS[0]; // inc-pune-005 (UNVERIFIED)
    const testTimeline = MOCK_TIMELINES['inc-pune-005'];

    it('renders prominent UNVERIFIED badge and warning for unconfirmed incident', () => {
      const html = renderToStaticMarkup(
        <IncidentTimelineView incident={testIncident} timeline={testTimeline} />
      );

      expect(html).toContain('INC-2026-0005');
      expect(html).toContain('UNVERIFIED');
      expect(html).toContain('Status: UNVERIFIED by Official First Responders');
      expect(html).toContain('Trigger 112 Handoff');
    });

    it('renders chronological lifecycle events including submission and 112 handoff', () => {
      const html = renderToStaticMarkup(
        <IncidentTimelineView incident={testIncident} timeline={testTimeline} />
      );

      expect(html).toContain('Chronological Response Timeline');
      expect(html).toContain('Emergency Incident Recorded (UNVERIFIED)');
      expect(html).toContain('Official Call 112 Handoff Completed');
      expect(html).toContain('CAD-112-MH-2026-1188');
    });

    it('restricts graphic accident trauma evidence from public view', () => {
      const sensitiveIncident = MOCK_INCIDENTS[1]; // inc-pune-001 (has graphic evidence)
      const html = renderToStaticMarkup(
        <IncidentTimelineView incident={sensitiveIncident} timeline={MOCK_TIMELINES['inc-pune-001']} />
      );

      expect(html).toContain('Sensitive Trauma / Graphic Content Restricted');
      expect(html).toContain('Accident victim injury evidence protected per CivIQ Privacy and Ethics Policy');
      expect(html).not.toContain('/protected-evidence/paud_flyover_injury_trauma_close.jpg');
    });
  });

  describe('4. IncidentResponderControls (Confirmation & Closure Console)', () => {
    const unverifiedIncident = MOCK_INCIDENTS[0];
    const resolvedIncident = {
      ...MOCK_INCIDENTS[1],
      status: 'CLOSED',
      closureReason: 'Debris cleared and traffic restored',
    };

    it('renders ground truth confirmation action for unconfirmed incident', () => {
      const html = renderToStaticMarkup(
        <IncidentResponderControls incident={unverifiedIncident} />
      );

      expect(html).toContain('Official Responder Action Console');
      expect(html).toContain('Confirm Ground Truth');
      expect(html).toContain('Mark En Route');
      expect(html).toContain('Mark On Scene');
      expect(html).toContain('Close Incident');
    });

    it('displays closed notice when incident is already closed', () => {
      const html = renderToStaticMarkup(
        <IncidentResponderControls incident={resolvedIncident} />
      );

      expect(html).toContain('Incident is CLOSED');
      expect(html).toContain('Debris cleared and traffic restored');
      expect(html).not.toContain('Confirm Ground Truth');
    });
  });

  describe('5. IncidentNotificationsFeed', () => {
    it('renders in-app incident notification items', () => {
      const notifs = MOCK_NOTIFICATIONS['inc-pune-005'];
      const html = renderToStaticMarkup(
        <IncidentNotificationsFeed notifications={notifs} />
      );

      expect(html).toContain('Incident Notification Log (2)');
      expect(html).toContain('Critical Incident Recorded (UNVERIFIED)');
      expect(html).toContain('112 Emergency Dispatch Alert');
    });
  });

  describe('6. IncidentResponseDashboard (Unified Master Workspace)', () => {
    it('renders complete dashboard with emergency banner, tabs, incident list, and UNVERIFIED badges', () => {
      const html = renderToStaticMarkup(
        <IncidentResponseDashboard
          initialIncidents={MOCK_INCIDENTS}
          initialTimelines={MOCK_TIMELINES}
          initialNotifications={MOCK_NOTIFICATIONS}
        />
      );

      expect(html).toContain('Life-Threatening Accident or Hazard?');
      expect(html).toContain('Call 112 Now');
      expect(html).toContain('Active Incidents &amp; Timeline');
      expect(html).toContain('Rapid Emergency Report');
      expect(html).toContain('INC-2026-0005');
      expect(html).toContain('UNVERIFIED');
      expect(html).toContain('Chronological Response Timeline');
    });

    it('renders filter pills for triage (ALL, UNVERIFIED, ACTIVE, CONFIRMED)', () => {
      const html = renderToStaticMarkup(
        <IncidentResponseDashboard initialIncidents={MOCK_INCIDENTS} />
      );

      expect(html).toContain('ALL');
      expect(html).toContain('UNVERIFIED');
      expect(html).toContain('ACTIVE');
      expect(html).toContain('CONFIRMED');
    });
  });
});
