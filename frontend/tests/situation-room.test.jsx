/**
 * Phase 66 Exit Checks: Disaster Situation Room Frontend Tests
 *
 * Validates:
 * 1. EventCommandHeader: Disaster title, severity badge, lifecycle state, statutory disclaimer, and SACHET alerts
 * 2. PostEventMetricsCards: Dynamic operational metrics, shelter capacity, and dispatch latency
 * 3. ImpactClustersPanel: Ground impact clusters with critical flags and affected counts
 * 4. BlockedRoutesPanel: Impassable roads, submerged bridges, and detour information
 * 5. ResponseTasksPanel: Task board, priority tags, assigned units, and touch-friendly status action buttons
 * 6. NeedsResourcesPanel: Verified shelters with capacity bars and civic relief needs
 * 7. EventTimelinePanel: Chronological milestone sequence with source provenance labels
 * 8. AfterActionReviewPanel: AI-assisted review draft, non-authoritative badge, source citations, and coordinator approval
 * 9. SituationRoomDashboard: Root integration, mobile-first responsive layout, and tab navigation
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SituationRoomDashboard,
  EventCommandHeader,
  PostEventMetricsCards,
  ImpactClustersPanel,
  BlockedRoutesPanel,
  ResponseTasksPanel,
  NeedsResourcesPanel,
  EventTimelinePanel,
  AfterActionReviewPanel,
  SITUATION_ROOM_TABS,
  AAR_SOURCE_LABELS,
  DISASTER_OPS_DISCLAIMER,
} from '../features/situation-room/index.js';

const MOCK_DISASTER = {
  id: 'dis-pune-mutha-flood-2026',
  disasterNumber: 'DIS-2026-0001',
  title: 'Khadakwasla Dam Spillway Discharge & Mutha River Inundation',
  description: 'Emergency discharge of 45,000 cusecs causing riverside community flooding.',
  severity: 'SEVERE_EMERGENCY',
  lifecycleState: 'ACTIVE_RESPONSE',
  jurisdictionIds: ['mh-pune-pmc'],
  declaredAt: '2026-10-30T04:30:00Z',
  officialAlertReferences: [
    {
      authority: 'SACHET_NDMA',
      externalAlertId: 'CAP-IN-MH-2026-1030-001',
      alertHeadline: 'Severe Flood Warning for Mutha Basin',
    },
  ],
};

const MOCK_METRICS = {
  disasterId: 'dis-pune-mutha-flood-2026',
  totalPersonsSheltered: 292,
  totalPersonsRescued: 4,
  totalMealsDistributed: 3200,
  activeRoadBlockagesCount: 1,
  operationalSheltersCount: 2,
  overallShelterOccupancyPercentage: 59.1,
  responseTasksTotal: 5,
  responseTasksCompleted: 2,
  responseTasksActive: 3,
  averageDispatchLatencyMinutes: 14.5,
};

const MOCK_CLUSTERS = [
  {
    impactType: 'STRANDED_PERSONS_RESCUE_NEEDED',
    count: 1,
    criticalCount: 1,
    peopleAffectedEstimated: 12,
    strandedPersonsCount: 4,
    reports: [
      {
        reportId: 'DIR-2026-0001',
        impactDetails: { title: '4 elderly residents trapped on ground floor' },
      },
    ],
  },
  {
    impactType: 'BLOCKED_ROAD_DEBRIS',
    count: 1,
    criticalCount: 0,
    peopleAffectedEstimated: 5000,
    strandedPersonsCount: 0,
    reports: [
      {
        reportId: 'DIR-2026-0002',
        impactDetails: { title: 'Baba Bhide Causeway submerged under 1.5m water' },
      },
    ],
  },
];

const MOCK_BLOCKED_ROUTES = [
  {
    reportId: 'DIR-2026-0002',
    title: 'Baba Bhide Bridge submerged under 1.5m flowing river discharge',
    description: 'River discharge has completely submerged low-level causeway.',
    waterDepthMeters: 1.5,
    location: { address: 'Baba Bhide Causeway, Deccan to Narayan Peth' },
    reportedAt: '2026-10-30T05:30:00Z',
  },
];

const MOCK_TASKS = [
  {
    id: 'task-pune-flood-001',
    taskNumber: 'TASK-2026-0001',
    title: 'Deploy inflatable rescue boat to evacuate 4 trapped senior citizens',
    taskType: 'RESCUE_EVACUATION',
    priority: 'CRITICAL_P0',
    status: 'COMPLETED',
    assignedUnit: { name: 'PMC Rescue Boats Division', contactPhoneMasked: '+91-98XXXX8899' },
    location: { address: 'Swapna Nagari Society, Sinhagad Road' },
  },
  {
    id: 'task-pune-flood-002',
    taskNumber: 'TASK-2026-0002',
    title: 'Deploy high-discharge diesel pumps to Katraj Ghat low bypass',
    taskType: 'DEWATERING_PUMPING',
    priority: 'HIGH_P1',
    status: 'ON_SCENE',
    assignedUnit: { name: 'Katraj Dewatering Depot', contactPhoneMasked: '+91-98XXXX7766' },
    location: { address: 'NH-48 Katraj Bypass' },
  },
];

const MOCK_TIMELINE = [
  {
    timestamp: '2026-10-30T04:00:00Z',
    stage: 'OFFICIAL_ALERT',
    title: 'SACHET Flash Flood Alert Ingested',
    description: 'Mutha basin alert issued to PMC and civil defense.',
    source: AAR_SOURCE_LABELS.SACHET_NDMA_ALERT,
  },
  {
    timestamp: '2026-10-30T04:30:00Z',
    stage: 'COMMAND_ACTIVATION',
    title: 'Disaster Event Declared — Active Response Initiated',
    description: 'Situation Room activated by Pune DDMA coordinator.',
    source: AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD,
  },
  {
    timestamp: '2026-10-30T05:10:00Z',
    stage: 'CITIZEN_IMPACT_REPORT',
    title: 'Citizen Urgent Rescue Report: 4 Trapped Seniors',
    description: 'Swapna Nagari ground floor flooding.',
    source: AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT,
  },
];

const MOCK_AAR = {
  id: 'aar-pune-flood-2026',
  title: 'After-Action Review: Khadakwasla Dam Spillway Discharge',
  status: 'DRAFT_AI_ASSISTED',
  isAuthoritative: false,
  executiveSummary:
    `${AAR_SOURCE_LABELS.AI_DRAFT} Multi-agency disaster coordination review. ${AAR_SOURCE_LABELS.SACHET_NDMA_ALERT} Early warning enabled advance shelter prep. ${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} 5 response tasks mobilized.`,
  operationalChronologySummary: '1. 04:00Z Alert\n2. 04:30Z Activation\n3. 05:25Z Dispatch',
  strengthsObserved: [
    `${AAR_SOURCE_LABELS.SACHET_NDMA_ALERT} 45-minute advance warning lead time.`,
  ],
  challengesAndBottlenecks: [
    `${AAR_SOURCE_LABELS.FIELD_INSPECTION} Low causeways lacked automated barriers.`,
  ],
  recommendations: [
    `${AAR_SOURCE_LABELS.AI_DRAFT} Upgrade low bridges with automated flood gates.`,
  ],
  sourceCitations: [
    { label: AAR_SOURCE_LABELS.SACHET_NDMA_ALERT, detail: 'SACHET CAP stream' },
  ],
};

describe('Phase 66: Disaster Situation Room Frontend Tests', () => {
  // ─── 1. EventCommandHeader ───
  describe('1. EventCommandHeader Component', () => {
    it('renders disaster title, severity, lifecycle state, and statutory notice', () => {
      const html = renderToStaticMarkup(
        <EventCommandHeader
          disaster={MOCK_DISASTER}
          activeAlerts={MOCK_DISASTER.officialAlertReferences}
        />
      );

      expect(html).toContain('Khadakwasla Dam Spillway Discharge');
      expect(html).toContain('SEVERE_EMERGENCY');
      expect(html).toContain('ACTIVE_RESPONSE');
      expect(html).toContain('mh-pune-pmc');
      expect(html).toContain('SITUATION ROOM LIVE');
      // Statutory disclaimer must be present (handling XML escaping of &)
      expect(html).toContain('Disaster Management Act, 2005');
      // SACHET alert ticker
      expect(html).toContain('OFFICIAL SACHET ALERT');
      expect(html).toContain('Severe Flood Warning for Mutha Basin');
    });
  });

  // ─── 2. PostEventMetricsCards ───
  describe('2. PostEventMetricsCards Component', () => {
    it('renders metrics cards with persons sheltered, rescues, and dispatch latency', () => {
      const html = renderToStaticMarkup(<PostEventMetricsCards metrics={MOCK_METRICS} />);

      expect(html).toContain('292');
      expect(html).toContain('59.1% capacity');
      expect(html).toContain('Rescues Completed');
      expect(html).toContain('4');
      expect(html).toContain('Road Blockages');
      expect(html).toContain('1');
      expect(html).toContain('14.5m');
    });
  });

  // ─── 3. ImpactClustersPanel ───
  describe('3. ImpactClustersPanel Component', () => {
    it('renders impact clusters with critical counts and report headlines', () => {
      const html = renderToStaticMarkup(<ImpactClustersPanel clusters={MOCK_CLUSTERS} />);

      expect(html).toContain('Ground Impact Clusters (2)');
      expect(html).toContain('Stranded Residents &amp; Rescue Inundation');
      expect(html).toContain('1 Critical');
      expect(html).toContain('4 elderly residents trapped on ground floor');
      expect(html).toContain('Submerged Causeways &amp; Road Debris');
    });
  });

  // ─── 4. BlockedRoutesPanel ───
  describe('4. BlockedRoutesPanel Component', () => {
    it('renders impassable routes with water depth badges and location details', () => {
      const html = renderToStaticMarkup(<BlockedRoutesPanel routes={MOCK_BLOCKED_ROUTES} />);

      expect(html).toContain('Impassable Corridors &amp; Blocked Routes');
      expect(html).toContain('Baba Bhide Bridge submerged');
      expect(html).toContain('1.5m Water Depth');
      expect(html).toContain('Baba Bhide Causeway, Deccan to Narayan Peth');
    });
  });

  // ─── 5. ResponseTasksPanel ───
  describe('5. ResponseTasksPanel Component', () => {
    it('renders task cards with priority tags and assigned unit contacts', () => {
      const html = renderToStaticMarkup(
        <ResponseTasksPanel tasks={MOCK_TASKS} onStatusUpdate={() => {}} onTaskCreate={() => {}} />
      );

      expect(html).toContain('Emergency Response Tasks (2)');
      expect(html).toContain('CRITICAL_P0');
      expect(html).toContain('HIGH_P1');
      expect(html).toContain('PMC Rescue Boats Division');
      expect(html).toContain('+91-98XXXX8899');
      expect(html).toContain('COMPLETED');
      expect(html).toContain('ON SCENE');
    });
  });

  // ─── 6. NeedsResourcesPanel ───
  describe('6. NeedsResourcesPanel Component', () => {
    it('renders verified shelters with capacity and open relief needs', () => {
      const mockResources = [
        {
          id: 'res-shelter-01',
          resourceNumber: 'RES-2026-0001',
          title: 'Vitthalwadi Shelter',
          resourceType: 'EMERGENCY_SHELTER',
          status: 'ACTIVE_OPERATIONAL',
          capacity: { totalCapacity: 350, currentOccupancy: 280, availableCapacity: 70, occupancyPercentage: 80 },
          location: { address: 'Sinhagad Road' },
        },
      ];
      const mockNeeds = [
        {
          id: 'need-01',
          needNumber: 'NEED-2026-0001',
          title: 'Boat rescue needed',
          needType: 'BOAT_EVACUATION',
          quantity: 2,
          unit: 'BOATS',
          severity: 'CRITICAL_LIFE_SAFETY',
          status: 'OPEN_PENDING',
        },
      ];

      const html = renderToStaticMarkup(
        <NeedsResourcesPanel needs={mockNeeds} resources={mockResources} />
      );

      expect(html).toContain('Vitthalwadi Shelter');
      expect(html).toContain('80.0%');
      expect(html).toContain('Boat rescue needed');
      expect(html).toContain('CRITICAL_LIFE_SAFETY');
    });
  });

  // ─── 7. EventTimelinePanel ───
  describe('7. EventTimelinePanel Component', () => {
    it('renders chronological milestone sequence with explicit source provenance labels', () => {
      const html = renderToStaticMarkup(<EventTimelinePanel timeline={MOCK_TIMELINE} />);

      expect(html).toContain('Operational Event Chronology (3 Milestones)');
      expect(html).toContain('SACHET Flash Flood Alert Ingested');
      expect(html).toContain(AAR_SOURCE_LABELS.SACHET_NDMA_ALERT);
      expect(html).toContain(AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD);
      expect(html).toContain(AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT);
    });
  });

  // ─── 8. AfterActionReviewPanel ───
  describe('8. AfterActionReviewPanel Component', () => {
    it('renders AI review draft with non-authoritative badge, source citations, and sign-off button', () => {
      const html = renderToStaticMarkup(
        <AfterActionReviewPanel
          aar={MOCK_AAR}
          onGenerateAar={() => {}}
          onApproveAar={() => {}}
        />
      );

      expect(html).toContain('After-Action Review (AAR) &amp; Post-Incident Report');
      expect(html).toContain(AAR_SOURCE_LABELS.AI_DRAFT);
      expect(html).toContain('Coordinator Review Draft');
      expect(html).toContain('Coordinator Sign-Off');
      expect(html).toContain(AAR_SOURCE_LABELS.SACHET_NDMA_ALERT);
      expect(html).toContain('Lessons Learned &amp; Actionable Recommendations');
      expect(html).toContain('Disaster Management Act, 2005');
    });
  });

  // ─── 9. SituationRoomDashboard ───
  describe('9. SituationRoomDashboard Root Component', () => {
    it('renders complete situation room layout with responsive command tabs', () => {
      const html = renderToStaticMarkup(
        <SituationRoomDashboard
          initialDisaster={MOCK_DISASTER}
          initialAlerts={MOCK_DISASTER.officialAlertReferences}
          initialImpactClusters={MOCK_CLUSTERS}
          initialBlockedRoutes={MOCK_BLOCKED_ROUTES}
          initialResponseTasks={MOCK_TASKS}
          initialTimeline={MOCK_TIMELINE}
          initialMetrics={MOCK_METRICS}
          initialAar={MOCK_AAR}
        />
      );

      expect(html).toContain('Command Overview');
      expect(html).toContain('Response Tasks');
      expect(html).toContain('Needs &amp; Resources');
      expect(html).toContain('Event Timeline');
      expect(html).toContain('After-Action Review');
      // Sub-panels rendered in initial Command Overview tab
      expect(html).toContain('Ground Impact Clusters (2)');
      expect(html).toContain('Impassable Corridors &amp; Blocked Routes');
    });
  });
});
