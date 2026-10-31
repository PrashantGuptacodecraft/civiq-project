/**
 * Seeded Synthetic Disaster Impact Report Fixtures
 * Phase 63: Build disaster impact reporting
 *
 * Provides realistic impact reports bound to Pune and PCMC disaster events:
 * - Mutha River Flood inundation & stranded residents
 * - Katraj Ghat landslide road blockages
 * - MIDC Bhosari hazmat plume observations
 */

import {
  IMPACT_TYPES,
  IMPACT_SEVERITY,
  IMPACT_STATUS,
  REPORTER_TYPE,
  UTILITY_TYPES,
  RELIEF_NEED_TYPES,
  DISASTER_IMPACT_DISCLAIMER,
} from './disaster-impact.types.js';

export const SEEDED_IMPACT_REPORTS = [
  // ─── 1. Sinhagad Road Vitthalwadi Inundation & Stranded Senior Citizens ───
  {
    reportId: 'DIR-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED,
    severity: IMPACT_SEVERITY.CRITICAL_LIFE_SAFETY,
    status: IMPACT_STATUS.UNVERIFIED,
    reporterType: REPORTER_TYPE.CITIZEN,
    reporter: {
      id: 'citizen-992',
      phoneMasked: '+91-98XXXX1234',
      role: 'CITIZEN',
    },
    location: {
      latitude: 18.4880,
      longitude: 73.8310,
      address: 'Swapna Nagari Society, Near Vitthal Mandir, Sinhagad Road',
      ward: 'Ward 9 - Sinhagad Road',
      jurisdictionId: 'mh-pune-pmc',
    },
    impactDetails: {
      title: 'Water 4 feet in ground floor flats; 4 elderly residents unable to evacuate',
      description:
        'Khadakwasla spillway backwater entered building lobby and ground floor residences. ' +
        'Electricity has been cut off. 4 senior citizens on ground floor require boat evacuation assistance.',
      isLifeThreatening: true,
      peopleAffectedEstimated: 12,
      strandedPersonsCount: 4,
      waterDepthMeters: 1.2,
      roadPassable: false,
      reliefNeeds: [RELIEF_NEED_TYPES.BOAT_EVACUATION, RELIEF_NEED_TYPES.DRINKING_WATER],
    },
    emergencyHandoff: {
      handoffRecommended: true,
      emergencyService: '112 / PMC Disaster Cell (020-25501269)',
      statutoryDisclaimer: DISASTER_IMPACT_DISCLAIMER,
    },
    photos: [
      {
        url: 'https://storage.civiq.local/disaster-impact/pune-flood-01.jpg',
        caption: 'Ground floor waterlogging up to waist height',
        uploadedAt: '2026-10-30T05:10:00Z',
      },
    ],
    reportedAt: '2026-10-30T05:10:00Z',
    lastUpdatedAt: '2026-10-30T05:10:00Z',
  },

  // ─── 2. Baba Bhide Bridge / Pulgate Causeway Submerged (Blocked Road) ───
  {
    reportId: 'DIR-2026-0002',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS,
    severity: IMPACT_SEVERITY.HIGH_URGENT,
    status: IMPACT_STATUS.FIELD_TRIAGED,
    reporterType: REPORTER_TYPE.FIELD_WORKER,
    reporter: {
      id: 'worker-pmc-42',
      phoneMasked: '+91-97XXXX5678',
      role: 'PMC_ROAD_INSPECTOR',
    },
    location: {
      latitude: 18.5170,
      longitude: 73.8480,
      address: 'Baba Bhide Causeway, Deccan Gymkhana to Narayan Peth link',
      ward: 'Ward 12 - Shivaji Nagar',
      jurisdictionId: 'mh-pune-pmc',
    },
    impactDetails: {
      title: 'Baba Bhide Bridge submerged under 1.5m flowing river discharge',
      description:
        'River discharge has completely submerged the low-level causeway. ' +
        'Barricades placed on Deccan side and Narayan Peth side to prevent two-wheelers and pedestrians.',
      isLifeThreatening: false,
      peopleAffectedEstimated: 5000,
      strandedPersonsCount: 0,
      waterDepthMeters: 1.5,
      roadPassable: false,
      reliefNeeds: [],
    },
    emergencyHandoff: {
      handoffRecommended: false,
      emergencyService: 'Pune Traffic Police (1095)',
      statutoryDisclaimer: DISASTER_IMPACT_DISCLAIMER,
    },
    photos: [],
    reportedAt: '2026-10-30T05:30:00Z',
    lastUpdatedAt: '2026-10-30T05:45:00Z',
  },

  // ─── 3. Katraj Ghat Old Tunnel Mudflow & Boulder Obstruction ───
  {
    reportId: 'DIR-2026-0003',
    disasterId: 'dis-pune-katraj-landslide-2026',
    impactType: IMPACT_TYPES.BLOCKED_ROAD_DEBRIS,
    severity: IMPACT_SEVERITY.HIGH_URGENT,
    status: IMPACT_STATUS.UNVERIFIED,
    reporterType: REPORTER_TYPE.CITIZEN,
    reporter: {
      id: 'citizen-katraj-12',
      phoneMasked: '+91-96XXXX9012',
      role: 'CITIZEN',
    },
    location: {
      latitude: 18.4350,
      longitude: 73.8600,
      address: 'Old Katraj Tunnel South Portal, 200m before tunnel mouth',
      ward: 'Ward 23 - Dhankawadi / Katraj',
      jurisdictionId: 'mh-pune-pmc',
    },
    impactDetails: {
      title: 'Hillside slope slip with boulders blocking both carriageways',
      description:
        'Massive rockfall and wet soil slip occurred around 5:10 AM. ' +
        'Road completely blocked. Several trucks and passenger cars stopped on road.',
      isLifeThreatening: false,
      peopleAffectedEstimated: 150,
      strandedPersonsCount: 0,
      waterDepthMeters: 0,
      roadPassable: false,
      reliefNeeds: [],
    },
    emergencyHandoff: {
      handoffRecommended: false,
      emergencyService: 'Highway Safety Patrol / NHAI Emergency: 1033',
      statutoryDisclaimer: DISASTER_IMPACT_DISCLAIMER,
    },
    photos: [],
    reportedAt: '2026-10-30T05:20:00Z',
    lastUpdatedAt: '2026-10-30T05:20:00Z',
  },

  // ─── 4. Vitthalwadi Power Substation Submersion (Utility Outage) ───
  {
    reportId: 'DIR-2026-0004',
    disasterId: 'dis-pune-mutha-flood-2026',
    impactType: IMPACT_TYPES.UTILITY_OUTAGE,
    severity: IMPACT_SEVERITY.HIGH_URGENT,
    status: IMPACT_STATUS.UNVERIFIED,
    reporterType: REPORTER_TYPE.CITIZEN,
    reporter: {
      id: 'citizen-pune-77',
      phoneMasked: '+91-99XXXX3344',
      role: 'CITIZEN',
    },
    location: {
      latitude: 18.4850,
      longitude: 73.8290,
      address: 'Vitthalwadi MSEDCL 11kV Feeder Pillar',
      ward: 'Ward 9 - Sinhagad Road',
      jurisdictionId: 'mh-pune-pmc',
    },
    impactDetails: {
      title: 'Power switched off preemptively across Sinhagad road sectors 1 to 4',
      description:
        'Feeder pillars inundated up to transformer base. Preemptive shutdown initiated to avoid electrocution.',
      isLifeThreatening: false,
      peopleAffectedEstimated: 12000,
      strandedPersonsCount: 0,
      waterDepthMeters: 0.8,
      roadPassable: false,
      utilityType: UTILITY_TYPES.ELECTRICITY_POWER,
      reliefNeeds: [RELIEF_NEED_TYPES.DRINKING_WATER],
    },
    emergencyHandoff: {
      handoffRecommended: false,
      emergencyService: 'MSEDCL Emergency Call Center: 1912',
      statutoryDisclaimer: DISASTER_IMPACT_DISCLAIMER,
    },
    photos: [],
    reportedAt: '2026-10-30T05:40:00Z',
    lastUpdatedAt: '2026-10-30T05:40:00Z',
  },
];
