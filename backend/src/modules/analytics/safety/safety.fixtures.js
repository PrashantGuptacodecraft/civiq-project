/**
 * Road-Safety Correlation Analytics Synthetic Fixtures
 * Phase 57: Add road-safety correlation analytics
 */

import {
  INVESTIGATION_PRIORITY,
  CORRELATION_LEVELS,
  SAFETY_CORRELATION_DISCLAIMER,
} from './safety.types.js';

export const SYNTHETIC_CIVIC_ISSUES_SAFETY = [
  // ─── Paud Road Corridor Defects (Near Paud Road Flyover Ramp) ───
  {
    id: 'iss-pune-safe-101',
    title: 'Cluster of deep potholes on Paud Road flyover approach incline',
    category: 'roads_pothole',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    latitude: 18.5076,
    longitude: 73.8079,
    address: 'Paud Road Flyover Ramp Incline, Kothrud, Pune',
    jurisdictionId: 'mh-pune-pmc',
    reportedAt: '2026-09-15T10:30:00Z',
    resolvedAt: null,
  },
  {
    id: 'iss-pune-safe-102',
    title: 'Asphalt rutting and sunken expansion joint causing two-wheeler destabilization',
    category: 'roads_surface_damage',
    severity: 'HIGH',
    status: 'SUBMITTED',
    latitude: 18.5073,
    longitude: 73.8075,
    address: 'Near Paud Road Flyover Ramp, Kothrud',
    jurisdictionId: 'mh-pune-pmc',
    reportedAt: '2026-10-02T14:15:00Z',
    resolvedAt: null,
  },
  {
    id: 'iss-pune-safe-103',
    title: 'Streetlights out across 200m section on flyover approach ramp',
    category: 'lighting_streetlight_out',
    severity: 'MEDIUM',
    status: 'ASSIGNED',
    latitude: 18.5078,
    longitude: 73.8081,
    address: 'Paud Road Flyover Eastbound Lane, Kothrud',
    jurisdictionId: 'mh-pune-pmc',
    reportedAt: '2026-10-18T20:00:00Z',
    resolvedAt: null,
  },

  // ─── FC Road / Goodluck Chowk Corridor Defects ───
  {
    id: 'iss-pune-safe-201',
    title: 'Pedestrian crossing signal countdown timer defective and flashing erratically',
    category: 'traffic_signal_failure',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    latitude: 18.5205,
    longitude: 73.8568,
    address: 'Goodluck Chowk, FC Road, Shivaji Nagar, Pune',
    jurisdictionId: 'mh-pune-pmc',
    reportedAt: '2026-10-05T09:00:00Z',
    resolvedAt: null,
  },
  {
    id: 'iss-pune-safe-202',
    title: 'Sunken storm culvert trench across pedestrian zebra crossing',
    category: 'drainage_waterlogging',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    latitude: 18.5202,
    longitude: 73.8565,
    address: 'FC Road opposite Goodluck Cafe, Shivaji Nagar',
    jurisdictionId: 'mh-pune-pmc',
    reportedAt: '2026-09-20T11:45:00Z',
    resolvedAt: '2026-10-10T16:00:00Z',
  },

  // ─── Bhosari MIDC Industrial Access Road Defects ───
  {
    id: 'iss-pcmc-safe-301',
    title: 'Exposed distribution cable conduit and unpaved shoulder ditch',
    category: 'electricity_wires_exposed',
    severity: 'CRITICAL',
    status: 'ASSIGNED',
    latitude: 18.6299,
    longitude: 73.7998,
    address: 'Chinchwad Station Road near MIDC Junction, PCMC',
    jurisdictionId: 'mh-pune-pcmc',
    reportedAt: '2026-10-20T08:00:00Z',
    resolvedAt: null,
  },
];

export const SYNTHETIC_OFFICIAL_ACCIDENT_DATA = [
  {
    externalRecordId: 'MH-PUNE-TRAFFIC-FIR-2026-8891',
    sourceAgency: 'PUNE_TRAFFIC_POLICE',
    occurredAt: '2026-10-14T21:30:00Z',
    latitude: 18.5075,
    longitude: 73.8078,
    corridorName: 'Paud Road Flyover Ramp',
    severity: 'SERIOUS_INJURY',
    vehiclesInvolved: ['TWO_WHEELER', 'CAR'],
    casualtyCount: 2,
    contributingConditionsNoted: 'Low ambient illumination, road surface unevenness',
  },
  {
    externalRecordId: 'MH-PUNE-TRAFFIC-FIR-2026-9042',
    sourceAgency: 'PUNE_TRAFFIC_POLICE',
    occurredAt: '2026-10-22T19:45:00Z',
    latitude: 18.5072,
    longitude: 73.8076,
    corridorName: 'Paud Road Flyover Ramp',
    severity: 'FATALITY',
    vehiclesInvolved: ['TWO_WHEELER', 'HEAVY_VEHICLE'],
    casualtyCount: 1,
    contributingConditionsNoted: 'Pothole swerve maneuver',
  },
];

export const SYNTHETIC_SAFETY_HOTSPOTS = [
  // ─── 1. Paud Road Flyover Ramp Corridor (Critical Investigation Recommended) ───
  {
    id: 'safe-spot-pune-001',
    hotspotName: 'Paud Road Flyover Approach Ramp Cluster',
    corridorOrRoadName: 'Paud Road',
    ward: 'Ward 5 - Kothrud',
    jurisdictionId: 'mh-pune-pmc',
    centroid: {
      latitude: 18.5074,
      longitude: 73.8077,
    },
    radiusMeters: 250,
    correlationScore: 0.86,
    correlationLevel: CORRELATION_LEVELS.HIGH,
    isInvestigationRecommended: true,
    investigationPriority: INVESTIGATION_PRIORITY.CRITICAL,
    disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    observationSummary:
      'High statistical concentration of two-wheeler crashes co-located with multiple open pothole reports, ' +
      'sunken expansion joints, and recurring streetlight outages within 120m radius.',
    investigationRecommendation: {
      recommendedAction:
        'Urgent joint engineering inspection by Pune Municipal Road Department and Traffic Police Safety Cell.',
      suggestedRemediationFocus: [
        'Resurface approach incline and level sunken bridge expansion joints',
        'Restore street lighting luminaire lux levels to IRC standards',
        'Install reflective hazard markers and advance rumble strips before flyover ramp',
      ],
      estimatedUrgencyDays: 3,
    },
    correlatedIncidentsCount: 3,
    correlatedCivicIssuesCount: 3,
    officialAccidentRecordsCount: 2,
    correlatedIncidentIds: ['inc-pune-001', 'inc-pune-005'],
    correlatedIssueIds: ['iss-pune-safe-101', 'iss-pune-safe-102', 'iss-pune-safe-103'],
    primaryCorrelatedAsset: {
      assetId: 'AST-MH-PUN-RD-001',
      assetName: 'Paud Road Flyover Ramp & Deck',
      assetType: 'FLYOVER',
      conditionScore: 42,
    },
    temporalSpanDays: 45,
    metrics: {
      totalCasualties: 6,
      fatalitiesCount: 1,
      injuredCount: 5,
      severeCollisionsCount: 3,
      twoWheelerInvolvedRatio: 0.80,
      nighttimeIncidentRatio: 0.67,
    },
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },

  // ─── 2. FC Road / Goodluck Chowk Corridor (High Investigation Recommended) ───
  {
    id: 'safe-spot-pune-002',
    hotspotName: 'Goodluck Chowk Pedestrian & Junction Collision Cluster',
    corridorOrRoadName: 'FC Road',
    ward: 'Ward 12 - Shivaji Nagar',
    jurisdictionId: 'mh-pune-pmc',
    centroid: {
      latitude: 18.5204,
      longitude: 73.8567,
    },
    radiusMeters: 200,
    correlationScore: 0.74,
    correlationLevel: CORRELATION_LEVELS.MODERATE,
    isInvestigationRecommended: true,
    investigationPriority: INVESTIGATION_PRIORITY.HIGH,
    disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    observationSummary:
      'Spatial correlation between junction collisions and malfunctioning pedestrian signal timer ' +
      'alongside drainage culvert settlement.',
    investigationRecommendation: {
      recommendedAction:
        'Signal timing re-synchronization and pedestrian refuge zone audit by Traffic Engineering Branch.',
      suggestedRemediationFocus: [
        'Replace defective signal countdown controller',
        'Repave pedestrian crossing trench to remove trip/wheel-catch hazard',
        'Review junction turning radius and speed-calming table top',
      ],
      estimatedUrgencyDays: 7,
    },
    correlatedIncidentsCount: 2,
    correlatedCivicIssuesCount: 2,
    officialAccidentRecordsCount: 0,
    correlatedIncidentIds: ['inc-pune-002'],
    correlatedIssueIds: ['iss-pune-safe-201', 'iss-pune-safe-202'],
    primaryCorrelatedAsset: {
      assetId: 'AST-MH-PUN-SIG-04',
      assetName: 'Goodluck Chowk Signal Controller Unit',
      assetType: 'TRAFFIC_SIGNAL',
      conditionScore: 58,
    },
    temporalSpanDays: 30,
    metrics: {
      totalCasualties: 1,
      fatalitiesCount: 0,
      injuredCount: 1,
      severeCollisionsCount: 1,
      twoWheelerInvolvedRatio: 0.50,
      nighttimeIncidentRatio: 0.33,
    },
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },

  // ─── 3. Bhosari MIDC Industrial Access Road (High Priority) ───
  {
    id: 'safe-spot-pcmc-003',
    hotspotName: 'Chinchwad MIDC Utility & Heavy Vehicle Safety Cluster',
    corridorOrRoadName: 'Chinchwad Station Road',
    ward: 'Ward 18 - Chinchwad',
    jurisdictionId: 'mh-pune-pcmc',
    centroid: {
      latitude: 18.6298,
      longitude: 73.7997,
    },
    radiusMeters: 250,
    correlationScore: 0.78,
    correlationLevel: CORRELATION_LEVELS.HIGH,
    isInvestigationRecommended: true,
    investigationPriority: INVESTIGATION_PRIORITY.HIGH,
    disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    observationSummary:
      'Co-location of overhead electrical line arcing hazard with heavy vehicle industrial access turning risks and unpaved shoulder ditch.',
    investigationRecommendation: {
      recommendedAction:
        'Joint utility audit with MSEDCL electricity board and PCMC Industrial Infrastructure wing.',
      suggestedRemediationFocus: [
        'Encase overhead high-voltage lines in underground ducting',
        'Pave road shoulders and install concrete barriers along industrial ditches',
      ],
      estimatedUrgencyDays: 5,
    },
    correlatedIncidentsCount: 1,
    correlatedCivicIssuesCount: 1,
    officialAccidentRecordsCount: 0,
    correlatedIncidentIds: ['inc-pcmc-003'],
    correlatedIssueIds: ['iss-pcmc-safe-301'],
    primaryCorrelatedAsset: {
      assetId: 'AST-MH-PCM-PW-02',
      assetName: 'Sector 7 Power Distribution Feeder',
      assetType: 'POWER_LINE',
      conditionScore: 35,
    },
    temporalSpanDays: 14,
    metrics: {
      totalCasualties: 0,
      fatalitiesCount: 0,
      injuredCount: 0,
      severeCollisionsCount: 1,
      twoWheelerInvolvedRatio: 0.0,
      nighttimeIncidentRatio: 0.0,
    },
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },

  // ─── 4. Senapati Bapat Road Curve (Control / Low Correlation - NO Investigation Recommended) ───
  {
    id: 'safe-spot-pune-004',
    hotspotName: 'Senapati Bapat Road Minor Collision Point',
    corridorOrRoadName: 'Senapati Bapat Road',
    ward: 'Ward 9 - Model Colony',
    jurisdictionId: 'mh-pune-pmc',
    centroid: {
      latitude: 18.5350,
      longitude: 73.8300,
    },
    radiusMeters: 200,
    correlationScore: 0.28,
    correlationLevel: CORRELATION_LEVELS.LOW,
    isInvestigationRecommended: false,
    investigationPriority: INVESTIGATION_PRIORITY.NONE,
    disclaimer: SAFETY_CORRELATION_DISCLAIMER,
    observationSummary:
      'Isolated minor incident report outside known infrastructure defect clusters. No open civic issue correlations identified.',
    investigationRecommendation: null,
    correlatedIncidentsCount: 1,
    correlatedCivicIssuesCount: 0,
    officialAccidentRecordsCount: 0,
    correlatedIncidentIds: ['inc-pune-004'],
    correlatedIssueIds: [],
    primaryCorrelatedAsset: null,
    temporalSpanDays: 7,
    metrics: {
      totalCasualties: 0,
      fatalitiesCount: 0,
      injuredCount: 0,
      severeCollisionsCount: 0,
      twoWheelerInvolvedRatio: 1.0,
      nighttimeIncidentRatio: 0.0,
    },
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },
];
