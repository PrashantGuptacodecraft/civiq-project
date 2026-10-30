/**
 * Seeded Synthetic Disaster Event Fixtures
 * Phase 61: Build disaster event model
 *
 * Models realistic concurrent disasters across Pune Municipal Corporation (PMC)
 * and Pimpri Chinchwad Municipal Corporation (PCMC) jurisdictions.
 */

import {
  DISASTER_TYPES,
  DISASTER_SEVERITY,
  DISASTER_LIFECYCLE_STATE,
  SIGNAL_SOURCE_TYPE,
  OFFICIAL_ALERT_AUTHORITIES,
  DISASTER_STATUTORY_DISCLAIMER,
} from './disaster.types.js';

export const SEEDED_DISASTER_EVENTS = [
  // ─── 1. Mutha River Basin & Sinhagad Road Inundation (PMC) ───
  {
    id: 'dis-pune-mutha-flood-2026',
    disasterNumber: 'DIS-2026-0001',
    title: 'Khadakwasla Dam Spillway Discharge & Mutha River Inundation',
    description:
      'Emergency discharge of 45,000 cusecs from Khadakwasla Dam due to intense catchment rainfall. ' +
      'Inundation along Sinhagad Road riverbank communities, Pulgate culvert, and Deccan riverside causeway.',
    disasterType: DISASTER_TYPES.URBAN_FLOODING_WATERLOGGING,
    severity: DISASTER_SEVERITY.SEVERE_EMERGENCY,
    lifecycleState: DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE,
    jurisdictionIds: ['mh-pune-pmc'],
    affectedWards: [
      'Ward 9 - Sinhagad Road',
      'Ward 10 - Parvati',
      'Ward 12 - Shivaji Nagar',
    ],
    affectedPolygon: {
      type: 'Polygon',
      // Mutha River corridor boundary from Vitthalwadi to Deccan
      coordinates: [
        [
          [73.8200, 18.4800],
          [73.8400, 18.4900],
          [73.8600, 18.5200],
          [73.8500, 18.5350],
          [73.8300, 18.5150],
          [73.8150, 18.4900],
          [73.8200, 18.4800],
        ],
      ],
    },
    declaredAt: '2026-10-30T04:30:00Z',
    expectedDurationHours: 48,
    officialAlertReferences: [
      {
        referenceId: 'REF-SACHET-2026-FL01',
        authority: OFFICIAL_ALERT_AUTHORITIES.SACHET_NDMA,
        externalAlertId: 'CAP-IN-MH-2026-1030-001',
        alertHeadline: 'Severe Flood Warning for Mutha Basin',
        issuedAt: '2026-10-30T04:00:00Z',
        ingestedAt: '2026-10-30T04:05:00Z',
        sourceSignatureHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
        sourceUrl: 'https://sachet.ndma.gov.in/alerts/CAP-IN-MH-2026-1030-001',
      },
      {
        referenceId: 'REF-CWC-PUN-089',
        authority: OFFICIAL_ALERT_AUTHORITIES.CWC,
        externalAlertId: 'CWC-DISCHARGE-BULLETIN-44',
        alertHeadline: 'Khadakwasla Dam Exceeds High Flood Level',
        issuedAt: '2026-10-30T04:15:00Z',
        ingestedAt: '2026-10-30T04:20:00Z',
        sourceSignatureHash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
      },
    ],
    signalsSummary: {
      officialSignalsCount: 2,
      userSignalsCount: 1,
      sensorSignalsCount: 1,
      fieldResponderSignalsCount: 0,
      totalSignalsCount: 4,
      corroborationScore: 0.95,
    },
    provenance: {
      originatingAuthority: 'District Disaster Management Authority (DDMA), Pune',
      leadRespondingAgency: 'PMC Disaster Management Cell & NDRF 5th Battalion',
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
      provenanceHash: '8e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    },
    lifecycleHistory: [
      {
        fromState: null,
        toState: DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE,
        timestamp: '2026-10-30T04:30:00Z',
        actor: { id: 'ddma-system', role: 'SYSTEM' },
        notes: 'Initial disaster declaration for Khadakwasla Dam Spillway Discharge.',
      },
    ],
    polygonHistory: [
      {
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8200, 18.4800],
              [73.8400, 18.4900],
              [73.8600, 18.5200],
              [73.8500, 18.5350],
              [73.8300, 18.5150],
              [73.8150, 18.4900],
              [73.8200, 18.4800],
            ],
          ],
        },
        timestamp: '2026-10-30T04:30:00Z',
        reason: 'Initial affected polygon boundary declaration.',
      },
    ],
    createdAt: '2026-10-30T04:30:00Z',
    lastUpdatedAt: '2026-10-30T06:00:00Z',
  },

  // ─── 2. Katraj Ghat Landslide & Slope Failure (PMC South Border - Concurrent!) ───
  {
    id: 'dis-pune-katraj-landslide-2026',
    disasterNumber: 'DIS-2026-0002',
    title: 'Katraj Ghat Old Tunnel Slope Failure & Rockfall Obstruction',
    description:
      'Massive hillside slope slip and mudflow blocking the Old Katraj Tunnel bypass. ' +
      'Structural risk to ghat road retaining wall with continuous rain seepage.',
    disasterType: DISASTER_TYPES.LANDSLIDE_DEBRIS_FLOW,
    severity: DISASTER_SEVERITY.WARNING,
    lifecycleState: DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE,
    jurisdictionIds: ['mh-pune-pmc'],
    affectedWards: ['Ward 23 - Dhankawadi / Katraj'],
    affectedPolygon: {
      type: 'Polygon',
      // Katraj Ghat hillside boundary
      coordinates: [
        [
          [73.8450, 18.4200],
          [73.8700, 18.4200],
          [73.8750, 18.4450],
          [73.8500, 18.4450],
          [73.8450, 18.4200],
        ],
      ],
    },
    declaredAt: '2026-10-30T05:15:00Z',
    expectedDurationHours: 24,
    officialAlertReferences: [
      {
        referenceId: 'REF-DDMA-PUN-LS-03',
        authority: OFFICIAL_ALERT_AUTHORITIES.PUNE_DDMA,
        externalAlertId: 'DDMA-PUN-LS-2026-03',
        alertHeadline: 'Geological Hazard Advisory for Katraj & Bhor Ghats',
        issuedAt: '2026-10-30T05:00:00Z',
        ingestedAt: '2026-10-30T05:08:00Z',
        sourceSignatureHash: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
      },
    ],
    signalsSummary: {
      officialSignalsCount: 1,
      userSignalsCount: 1,
      sensorSignalsCount: 0,
      fieldResponderSignalsCount: 0,
      totalSignalsCount: 2,
      corroborationScore: 0.87,
    },
    provenance: {
      originatingAuthority: 'State Highway Police & Pune DDMA',
      leadRespondingAgency: 'NHAI Emergency Road Clearance & Pune Traffic Police',
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
      provenanceHash: '9f5a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    },
    lifecycleHistory: [
      {
        fromState: null,
        toState: DISASTER_LIFECYCLE_STATE.ACTIVE_RESPONSE,
        timestamp: '2026-10-30T05:15:00Z',
        actor: { id: 'ddma-system', role: 'SYSTEM' },
        notes: 'Initial disaster declaration for Katraj Ghat Slope Failure.',
      },
    ],
    polygonHistory: [
      {
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8450, 18.4200],
              [73.8700, 18.4200],
              [73.8750, 18.4450],
              [73.8500, 18.4450],
              [73.8450, 18.4200],
            ],
          ],
        },
        timestamp: '2026-10-30T05:15:00Z',
        reason: 'Initial affected polygon boundary declaration.',
      },
    ],
    createdAt: '2026-10-30T05:15:00Z',
    lastUpdatedAt: '2026-10-30T05:45:00Z',
  },

  // ─── 3. MIDC Bhosari Chemical Plume (PCMC Industrial Zone - Concurrent!) ───
  {
    id: 'dis-pcmc-bhosari-hazmat-2026',
    disasterNumber: 'DIS-2026-0003',
    title: 'PCMC MIDC Bhosari Sector 7 Chlorine Vapor Emission',
    description:
      'Gaseous chlorine emission from an industrial cylinder processing yard. ' +
      'Atmospheric dispersion across 800-meter radius affecting residential fringe.',
    disasterType: DISASTER_TYPES.INDUSTRIAL_CHEMICAL_HAZMAT,
    severity: DISASTER_SEVERITY.WATCH,
    lifecycleState: DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF,
    jurisdictionIds: ['mh-pune-pcmc'],
    affectedWards: ['Ward 18 - Chinchwad / Bhosari'],
    affectedPolygon: {
      type: 'Polygon',
      // Bhosari MIDC Sector 7 industrial perimeter
      coordinates: [
        [
          [73.8300, 18.6200],
          [73.8550, 18.6200],
          [73.8550, 18.6400],
          [73.8300, 18.6400],
          [73.8300, 18.6200],
        ],
      ],
    },
    declaredAt: '2026-10-30T02:00:00Z',
    expectedDurationHours: 12,
    officialAlertReferences: [
      {
        referenceId: 'REF-PCMC-HAZ-002',
        authority: OFFICIAL_ALERT_AUTHORITIES.PCMC_DISASTER_CELL,
        externalAlertId: 'PCMC-DISASTER-HAZ-002',
        alertHeadline: 'Local Atmospheric Hazmat Containment Order',
        issuedAt: '2026-10-30T02:10:00Z',
        ingestedAt: '2026-10-30T02:12:00Z',
        sourceSignatureHash: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
      },
    ],
    signalsSummary: {
      officialSignalsCount: 1,
      userSignalsCount: 1,
      sensorSignalsCount: 0,
      fieldResponderSignalsCount: 0,
      totalSignalsCount: 2,
      corroborationScore: 0.87,
    },
    provenance: {
      originatingAuthority: 'PCMC Fire & Emergency Services',
      leadRespondingAgency: 'PCMC Hazmat Unit & Maharashtra Pollution Control Board (MPCB)',
      statutoryNotice: DISASTER_STATUTORY_DISCLAIMER,
      provenanceHash: '0a6b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    },
    lifecycleHistory: [
      {
        fromState: null,
        toState: DISASTER_LIFECYCLE_STATE.CONTAINMENT_AND_RELIEF,
        timestamp: '2026-10-30T02:00:00Z',
        actor: { id: 'ddma-system', role: 'SYSTEM' },
        notes: 'Initial disaster declaration for PCMC Bhosari Hazmat Emission.',
      },
    ],
    polygonHistory: [
      {
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8300, 18.6200],
              [73.8550, 18.6200],
              [73.8550, 18.6400],
              [73.8300, 18.6400],
              [73.8300, 18.6200],
            ],
          ],
        },
        timestamp: '2026-10-30T02:00:00Z',
        reason: 'Initial affected polygon boundary declaration.',
      },
    ],
    createdAt: '2026-10-30T02:00:00Z',
    lastUpdatedAt: '2026-10-30T05:30:00Z',
  },
];

export const SEEDED_DISASTER_SIGNALS = [
  // Signals for Flood (dis-pune-mutha-flood-2026)
  {
    signalId: 'SIG-OFFICIAL-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    sourceType: SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT,
    isOfficialGovernmentSignal: true,
    isUserReportedSignal: false,
    title: 'Severe Flood Warning for Mutha Basin',
    description: 'Official statutory advisory from SACHET_NDMA (CAP-IN-MH-2026-1030-001)',
    sourceMetadata: {
      authority: OFFICIAL_ALERT_AUTHORITIES.SACHET_NDMA,
      externalAlertId: 'CAP-IN-MH-2026-1030-001',
      sourceSignatureHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    },
    confidenceWeight: 1.0,
    signalProvenanceHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    recordedAt: '2026-10-30T04:05:00Z',
  },
  {
    signalId: 'SIG-OFFICIAL-2026-0002',
    disasterId: 'dis-pune-mutha-flood-2026',
    sourceType: SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT,
    isOfficialGovernmentSignal: true,
    isUserReportedSignal: false,
    title: 'Khadakwasla Dam Exceeds High Flood Level',
    description: 'Official statutory advisory from CWC (CWC-DISCHARGE-BULLETIN-44)',
    sourceMetadata: {
      authority: OFFICIAL_ALERT_AUTHORITIES.CWC,
      externalAlertId: 'CWC-DISCHARGE-BULLETIN-44',
      sourceSignatureHash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    },
    confidenceWeight: 1.0,
    signalProvenanceHash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    recordedAt: '2026-10-30T04:20:00Z',
  },
  {
    signalId: 'SIG-USER-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
    isOfficialGovernmentSignal: false,
    isUserReportedSignal: true,
    title: 'Water Level Rising rapidly along Sinhagad Road',
    description: 'Basement parking in Vitthalwadi flooded up to 3 feet.',
    location: { latitude: 18.4850, longitude: 73.8250, address: 'Vitthalwadi Riverside' },
    sourceMetadata: { citizenUserId: 'user-pune-881' },
    confidenceWeight: 0.65,
    signalProvenanceHash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    recordedAt: '2026-10-30T04:45:00Z',
  },
  {
    signalId: 'SIG-SENSOR-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    sourceType: SIGNAL_SOURCE_TYPE.IOT_SENSOR_SIGNAL,
    isOfficialGovernmentSignal: false,
    isUserReportedSignal: false,
    title: 'Vitthalwadi Telemetry Station High Water Alert',
    description: 'Telemetry sensor stage gauge reading 542.1m (Threshold: 540.5m)',
    location: { latitude: 18.4855, longitude: 73.8252 },
    sourceMetadata: { sensorId: 'SENSOR-VITTHALWADI-01' },
    confidenceWeight: 0.85,
    signalProvenanceHash: 'e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    recordedAt: '2026-10-30T04:50:00Z',
  },

  // Signals for Landslide (dis-pune-katraj-landslide-2026)
  {
    signalId: 'SIG-OFFICIAL-2026-0003',
    disasterId: 'dis-pune-katraj-landslide-2026',
    sourceType: SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT,
    isOfficialGovernmentSignal: true,
    isUserReportedSignal: false,
    title: 'Geological Hazard Advisory for Katraj & Bhor Ghats',
    description: 'Official statutory advisory from PUNE_DDMA (DDMA-PUN-LS-2026-03)',
    sourceMetadata: {
      authority: OFFICIAL_ALERT_AUTHORITIES.PUNE_DDMA,
      externalAlertId: 'DDMA-PUN-LS-2026-03',
      sourceSignatureHash: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    },
    confidenceWeight: 1.0,
    signalProvenanceHash: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    recordedAt: '2026-10-30T05:08:00Z',
  },
  {
    signalId: 'SIG-USER-2026-0002',
    disasterId: 'dis-pune-katraj-landslide-2026',
    sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
    isOfficialGovernmentSignal: false,
    isUserReportedSignal: true,
    title: 'Rockfall on Old Tunnel Route',
    description: 'Boulders fallen on the southern entrance blocking traffic.',
    location: { latitude: 18.4350, longitude: 73.8600 },
    sourceMetadata: { citizenUserId: 'user-katraj-44' },
    confidenceWeight: 0.65,
    signalProvenanceHash: 'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
    recordedAt: '2026-10-30T05:15:00Z',
  },

  // Signals for Hazmat (dis-pcmc-bhosari-hazmat-2026)
  {
    signalId: 'SIG-OFFICIAL-2026-0004',
    disasterId: 'dis-pcmc-bhosari-hazmat-2026',
    sourceType: SIGNAL_SOURCE_TYPE.OFFICIAL_GOVERNMENT_ALERT,
    isOfficialGovernmentSignal: true,
    isUserReportedSignal: false,
    title: 'Local Atmospheric Hazmat Containment Order',
    description: 'Official statutory advisory from PCMC_DISASTER_CELL (PCMC-DISASTER-HAZ-002)',
    sourceMetadata: {
      authority: OFFICIAL_ALERT_AUTHORITIES.PCMC_DISASTER_CELL,
      externalAlertId: 'PCMC-DISASTER-HAZ-002',
      sourceSignatureHash: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    },
    confidenceWeight: 1.0,
    signalProvenanceHash: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    recordedAt: '2026-10-30T02:12:00Z',
  },
  {
    signalId: 'SIG-USER-2026-0003',
    disasterId: 'dis-pcmc-bhosari-hazmat-2026',
    sourceType: SIGNAL_SOURCE_TYPE.USER_REPORTED_SIGNAL,
    isOfficialGovernmentSignal: false,
    isUserReportedSignal: true,
    title: 'Strong chemical vapor detected in Bhosari residential fringe',
    description: 'Irritating gas odor causing coughing.',
    location: { latitude: 18.6300, longitude: 73.8400 },
    sourceMetadata: { citizenUserId: 'user-pcmc-101' },
    confidenceWeight: 0.65,
    signalProvenanceHash: 'c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    recordedAt: '2026-10-30T02:20:00Z',
  },
];
