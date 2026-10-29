/**
 * Critical Incident & Accident Reporting Synthetic Fixtures
 * Phase 55: Build accident/incident reporting model
 */

import {
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_HAZARDS,
  VEHICLE_TYPES,
  REPORTER_TYPES,
  INCIDENT_SOURCES,
  OFFICIAL_RESPONDER_AGENCIES,
} from './incident.types.js';

export const SYNTHETIC_INCIDENTS = [
  // ─── 1. Paud Road Flyover Multi-Vehicle Collision (Critical) ───
  {
    id: 'inc-pune-001',
    incidentNumber: 'INC-2026-0001',
    title: 'Multi-vehicle collision on Paud Road flyover approach ramp',
    description:
      'Collision involving a city transport bus, passenger auto-rickshaw, and two motorcycles. ' +
      'Fuel spill observed on carriageway creating skid hazard and flammable risk.',
    incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
    severity: INCIDENT_SEVERITY.CRITICAL,
    status: INCIDENT_STATUS.ON_SCENE,
    occurredAt: '2026-10-29T08:15:00Z',
    reportedAt: '2026-10-29T08:18:22Z',
    location: {
      latitude: 18.5074,
      longitude: 73.8077,
      accuracyMeters: 5.2,
      address: 'Near Paud Road Flyover Ramp, Kothrud, Pune',
      ward: 'Ward 5 - Kothrud',
      jurisdictionId: 'mh-pune-pmc',
      corridorOrRoadName: 'Paud Road',
    },
    hazards: [
      INCIDENT_HAZARDS.FUEL_LEAK_OR_HAZMAT,
      INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE,
      INCIDENT_HAZARDS.FIRE_OR_EXPLOSION_RISK,
    ],
    casualties: {
      hasCasualties: true,
      injuredCount: 3,
      fatalitiesCount: 0,
      trappedCount: 1,
      requiresAmbulance: true,
      medicalNotes: 'Two motorcycle riders sustained limb trauma; auto driver extracted with minor cuts.',
    },
    vehiclesInvolved: [
      VEHICLE_TYPES.BUS_OR_TRUCK,
      VEHICLE_TYPES.CAR_OR_AUTO,
      VEHICLE_TYPES.TWO_WHEELER,
    ],
    evidence: [
      {
        id: 'ev-inc-01',
        mediaUrl: '/protected-evidence/paud_flyover_scene_overview.jpg',
        mediaType: 'IMAGE',
        caption: 'Wide-angle view of bus and auto-rickshaw blocking eastbound carriageway',
        isGraphicOrSensitive: false,
        capturedAt: '2026-10-29T08:16:30Z',
      },
      {
        id: 'ev-inc-02',
        mediaUrl: '/protected-evidence/paud_flyover_injury_trauma_close.jpg',
        mediaType: 'IMAGE',
        caption: 'Close-up evidence of victim extraction and medical first-aid on road surface',
        isGraphicOrSensitive: true, // Graphic evidence must be restricted from public view
        capturedAt: '2026-10-29T08:17:10Z',
      },
    ],
    reporter: {
      reporterId: 'usr-cit-pune-441',
      reporterType: REPORTER_TYPES.CITIZEN,
      name: 'Ramesh Kulkarni',
      contactNumber: '+91 9822019483',
      isContactNumberVerified: true,
    },
    source: INCIDENT_SOURCES.CITIZEN_MOBILE_APP,
    officialResponderHandoff: {
      isHandedOffTo112: true,
      agencyNotified: OFFICIAL_RESPONDER_AGENCIES.POLICE,
      externalReferenceNumber: 'CAD-112-MH-2026-0914',
      handoffTimestamp: '2026-10-29T08:19:00Z',
    },
    statusHistory: [
      {
        status: INCIDENT_STATUS.REPORTED,
        timestamp: '2026-10-29T08:18:22Z',
        actorId: 'usr-cit-pune-441',
        notes: 'Citizen mobile incident submission',
      },
      {
        status: INCIDENT_STATUS.RESPONDER_EN_ROUTE,
        timestamp: '2026-10-29T08:21:00Z',
        actorId: 'dispatcher-112',
        notes: 'Traffic Police Patrol Car 14 and Ambulance 108 dispatched',
      },
      {
        status: INCIDENT_STATUS.ON_SCENE,
        timestamp: '2026-10-29T08:28:40Z',
        actorId: 'responder-tp-09',
        notes: 'First responders at scene, cordon established',
      },
    ],
    metadata: {
      weather: 'CLEAR',
      roadSurface: 'DRY_ASPHALT',
    },
    createdAt: '2026-10-29T08:18:22Z',
    updatedAt: '2026-10-29T08:28:40Z',
  },

  // ─── 2. Deccan Gymkhana Culvert Structural Collapse (High Severity) ───
  {
    id: 'inc-pune-002',
    incidentNumber: 'INC-2026-0002',
    title: 'Severe road cave-in and box culvert apron collapse on FC Road link',
    description:
      'Sudden structural failure of drainage culvert slab resulting in 3m deep void across left lane. ' +
      'Pedestrian footway undermined. Water main exposed.',
    incidentType: INCIDENT_TYPES.INFRASTRUCTURE_COLLAPSE,
    severity: INCIDENT_SEVERITY.HIGH,
    status: INCIDENT_STATUS.CONTAINED,
    occurredAt: '2026-10-28T16:40:00Z',
    reportedAt: '2026-10-28T16:45:10Z',
    location: {
      latitude: 18.5208,
      longitude: 73.8561,
      accuracyMeters: 3.8,
      address: 'Opposite Deccan Gymkhana Club Gate, Shivaji Nagar, Pune',
      ward: 'Ward 12 - Shivaji Nagar',
      jurisdictionId: 'mh-pune-pmc',
      corridorOrRoadName: 'FC Road',
    },
    hazards: [
      INCIDENT_HAZARDS.STRUCTURAL_INSTABILITY,
      INCIDENT_HAZARDS.OPEN_MANHOLE_OR_VOID,
      INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE,
    ],
    casualties: {
      hasCasualties: false,
      injuredCount: 0,
      fatalitiesCount: 0,
      trappedCount: 0,
      requiresAmbulance: false,
    },
    vehiclesInvolved: [],
    evidence: [
      {
        id: 'ev-inc-03',
        mediaUrl: '/protected-evidence/deccan_culvert_void_depth.jpg',
        mediaType: 'IMAGE',
        caption: 'View into 3m road cavity showing exposed storm culvert slab shear failure',
        isGraphicOrSensitive: false,
        capturedAt: '2026-10-28T16:44:00Z',
      },
    ],
    reporter: {
      reporterId: 'usr-patrol-pmc-12',
      reporterType: REPORTER_TYPES.MUNICIPAL_WORKER,
      name: 'Santosh Gaikwad',
      contactNumber: '+91 9422301988',
      isContactNumberVerified: true,
    },
    source: INCIDENT_SOURCES.MUNICIPAL_PATROL,
    officialResponderHandoff: {
      isHandedOffTo112: true,
      agencyNotified: OFFICIAL_RESPONDER_AGENCIES.DISASTER_MANAGEMENT,
      externalReferenceNumber: 'PMC-DM-2026-881',
      handoffTimestamp: '2026-10-28T16:48:00Z',
    },
    statusHistory: [
      {
        status: INCIDENT_STATUS.REPORTED,
        timestamp: '2026-10-28T16:45:10Z',
        actorId: 'usr-patrol-pmc-12',
      },
      {
        status: INCIDENT_STATUS.CONTAINED,
        timestamp: '2026-10-28T17:15:00Z',
        actorId: 'eng-pmc-drainage',
        notes: 'Hard steel barricades erected around cavity, traffic diverted',
      },
    ],
    metadata: {
      voidDepthMeters: 3.2,
      voidDiameterMeters: 2.8,
    },
    createdAt: '2026-10-28T16:45:10Z',
    updatedAt: '2026-10-28T17:15:00Z',
  },

  // ─── 3. Bhosari MIDC Live Electrical Cable Snap (Critical) ───
  {
    id: 'inc-pcmc-003',
    incidentNumber: 'INC-2026-0003',
    title: 'Snapped 11kV overhead electrical wire sparking on active roadway',
    description:
      'High-voltage distribution wire snapped and dangling onto Paud/Chinchwad industrial access road. ' +
      'Intermittent arcing and dry grass ignition risk.',
    incidentType: INCIDENT_TYPES.HAZARDOUS_UTILITY_EVENT,
    severity: INCIDENT_SEVERITY.CRITICAL,
    status: INCIDENT_STATUS.DISPATCH_PENDING,
    occurredAt: '2026-10-29T08:50:00Z',
    reportedAt: '2026-10-29T08:52:14Z',
    location: {
      latitude: 18.6298,
      longitude: 73.7997,
      accuracyMeters: 4.5,
      address: 'Chinchwad Station Road near MIDC Junction, PCMC',
      ward: 'Ward 18 - Chinchwad',
      jurisdictionId: 'mh-pune-pcmc',
      corridorOrRoadName: 'Chinchwad Station Road',
    },
    hazards: [
      INCIDENT_HAZARDS.LIVE_WIRES_OR_ELECTROCUTION,
      INCIDENT_HAZARDS.FIRE_OR_EXPLOSION_RISK,
      INCIDENT_HAZARDS.TRAFFIC_BLOCKAGE,
    ],
    casualties: {
      hasCasualties: false,
      injuredCount: 0,
      fatalitiesCount: 0,
      trappedCount: 0,
      requiresAmbulance: false,
    },
    vehiclesInvolved: [],
    evidence: [
      {
        id: 'ev-inc-04',
        mediaUrl: '/protected-evidence/bhosari_live_wire_arcing.mp4',
        mediaType: 'VIDEO',
        caption: 'Video showing snapped wire sparking against wet road surface',
        isGraphicOrSensitive: false,
        capturedAt: '2026-10-29T08:51:30Z',
      },
    ],
    reporter: {
      reporterId: 'usr-cit-pcmc-901',
      reporterType: REPORTER_TYPES.CITIZEN,
      name: 'Sunil Shinde',
      contactNumber: '+91 9765402911',
      isContactNumberVerified: true,
    },
    source: INCIDENT_SOURCES.CITIZEN_MOBILE_APP,
    officialResponderHandoff: {
      isHandedOffTo112: true,
      agencyNotified: OFFICIAL_RESPONDER_AGENCIES.FIRE,
      externalReferenceNumber: 'PCMC-FIRE-2026-302',
      handoffTimestamp: '2026-10-29T08:53:00Z',
    },
    statusHistory: [
      {
        status: INCIDENT_STATUS.REPORTED,
        timestamp: '2026-10-29T08:52:14Z',
        actorId: 'usr-cit-pcmc-901',
      },
      {
        status: INCIDENT_STATUS.DISPATCH_PENDING,
        timestamp: '2026-10-29T08:53:10Z',
        actorId: 'system-handoff',
        notes: 'Dispatched to MSEDCL Substation 4 and PCMC Fire Control',
      },
    ],
    metadata: {
      substationName: 'MIDC Sector 7 Substation',
      voltageLevel: '11kV',
    },
    createdAt: '2026-10-29T08:52:14Z',
    updatedAt: '2026-10-29T08:53:10Z',
  },

  // ─── 4. FC Road Minor Rear-End Tap (Resolved / Low Severity) ───
  {
    id: 'inc-pune-004',
    incidentNumber: 'INC-2026-0004',
    title: 'Minor two-wheeler bumper touch outside Ferguson Gate',
    description: 'Slow-speed rear-end between two mopeds in congested lane. No injuries, vehicles moved to curb.',
    incidentType: INCIDENT_TYPES.ROAD_TRAFFIC_ACCIDENT,
    severity: INCIDENT_SEVERITY.LOW,
    status: INCIDENT_STATUS.RESOLVED,
    occurredAt: '2026-10-27T11:20:00Z',
    reportedAt: '2026-10-27T11:24:05Z',
    location: {
      latitude: 18.5212,
      longitude: 73.8572,
      accuracyMeters: 6.0,
      address: 'Opposite Ferguson Gate 2, FC Road, Pune',
      ward: 'Ward 12 - Shivaji Nagar',
      jurisdictionId: 'mh-pune-pmc',
      corridorOrRoadName: 'FC Road',
    },
    hazards: [INCIDENT_HAZARDS.NONE],
    casualties: {
      hasCasualties: false,
      injuredCount: 0,
      fatalitiesCount: 0,
      trappedCount: 0,
      requiresAmbulance: false,
    },
    vehiclesInvolved: [VEHICLE_TYPES.TWO_WHEELER],
    evidence: [],
    reporter: {
      reporterId: 'usr-cit-pune-109',
      reporterType: REPORTER_TYPES.CITIZEN,
      name: 'Aditya Patil',
      contactNumber: '+91 9158002934',
      isContactNumberVerified: false,
    },
    source: INCIDENT_SOURCES.CITIZEN_MOBILE_APP,
    officialResponderHandoff: {
      isHandedOffTo112: false,
    },
    statusHistory: [
      {
        status: INCIDENT_STATUS.REPORTED,
        timestamp: '2026-10-27T11:24:05Z',
        actorId: 'usr-cit-pune-109',
      },
      {
        status: INCIDENT_STATUS.RESOLVED,
        timestamp: '2026-10-27T11:45:00Z',
        actorId: 'usr-cit-pune-109',
        notes: 'Mutual settlement, scene clear',
      },
    ],
    metadata: {},
    createdAt: '2026-10-27T11:24:05Z',
    updatedAt: '2026-10-27T11:45:00Z',
  },
];
