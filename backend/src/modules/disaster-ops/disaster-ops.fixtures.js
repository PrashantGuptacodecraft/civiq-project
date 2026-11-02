/**
 * Seeded Synthetic Disaster Operations Fixtures
 * Phase 66: Build disaster situation room and after-action review
 *
 * Models authentic response tasks, event timeline milestones, post-event metrics,
 * and AI-assisted after-action review reports across Pune and PCMC disaster operations.
 */

import {
  RESPONSE_TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  AAR_SOURCE_LABELS,
  AAR_STATUS,
  DISASTER_OPS_DISCLAIMER,
} from './disaster-ops.types.js';

export const SEEDED_RESPONSE_TASKS = [
  // ─── Task 1: Inflatable Boat Rescue at Swapna Nagari Society ───
  {
    id: 'task-pune-flood-001',
    taskNumber: 'TASK-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    title: 'Deploy inflatable rescue boat to evacuate 4 trapped senior citizens',
    description:
      'Water ingress reached 1.2m at Swapna Nagari ground floor apartments. ' +
      'Navigate inflatable zodiac boat with aquatic rescue crew to safely extract residents.',
    taskType: RESPONSE_TASK_TYPES.RESCUE_EVACUATION,
    priority: TASK_PRIORITY.CRITICAL_P0,
    status: TASK_STATUS.COMPLETED,
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 9 - Sinhagad Road',
    location: {
      latitude: 18.4880,
      longitude: 73.8310,
      address: 'Swapna Nagari Society, Near Vitthal Mandir, Sinhagad Road',
    },
    assignedUnit: {
      id: 'res-pune-rescue-boat-fleet',
      name: 'PMC Fire Brigade Flood Rescue Inflatable Boats Division',
      leadOfficer: 'Chief Fire Officer Devendra Potphode',
      contactPhoneMasked: '+91-98XXXX8899',
    },
    relatedNeedId: 'need-pune-vitthalwadi-boat-01',
    sourceReportId: 'DIR-2026-0001',
    dispatchedAt: '2026-10-30T05:25:00Z',
    arrivedAt: '2026-10-30T05:40:00Z',
    completedAt: '2026-10-30T06:15:00Z',
    notes: 'All 4 elderly residents safely rescued and transferred to Vitthalwadi municipal primary school shelter.',
    createdAt: '2026-10-30T05:25:00Z',
    lastUpdatedAt: '2026-10-30T06:15:00Z',
  },

  // ─── Task 2: High-Discharge Dewatering at Katraj Low Pass ───
  {
    id: 'task-pune-flood-002',
    taskNumber: 'TASK-2026-0002',
    disasterId: 'dis-pune-mutha-flood-2026',
    title: 'Deploy high-discharge diesel pumps to Katraj Ghat low bypass',
    description:
      'Stormwater accumulation threatening vehicular underpass. Position 2 heavy-duty dewatering pumps.',
    taskType: RESPONSE_TASK_TYPES.DEWATERING_PUMPING,
    priority: TASK_PRIORITY.HIGH_P1,
    status: TASK_STATUS.ON_SCENE,
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 23 - Dhankawadi / Katraj',
    location: {
      latitude: 18.4410,
      longitude: 73.8580,
      address: 'NH-48 Katraj Bypass Underpass, Pune - 411046',
    },
    assignedUnit: {
      id: 'res-pune-equipment-katraj',
      name: 'Katraj Ghat Emergency Dewatering & Heavy Equipment Depot',
      leadOfficer: 'Sunil Bhosale',
      contactPhoneMasked: '+91-98XXXX7766',
    },
    dispatchedAt: '2026-10-30T05:45:00Z',
    arrivedAt: '2026-10-30T06:05:00Z',
    completedAt: null,
    notes: 'Pumps actively running at 3,000 LPM; water level receding steadily.',
    createdAt: '2026-10-30T05:45:00Z',
    lastUpdatedAt: '2026-10-30T06:20:00Z',
  },

  // ─── Task 3: Barricading and Debris Clearance at Baba Bhide Bridge ───
  {
    id: 'task-pune-flood-003',
    taskNumber: 'TASK-2026-0003',
    disasterId: 'dis-pune-mutha-flood-2026',
    title: 'Barricade submerged Baba Bhide Causeway and clear tree branch debris',
    description:
      'River discharge has submerged the causeway by 1.5m. Prevent vehicular traffic and clear snagged debris.',
    taskType: RESPONSE_TASK_TYPES.DEBRIS_ROAD_CLEARANCE,
    priority: TASK_PRIORITY.HIGH_P1,
    status: TASK_STATUS.DISPATCHED,
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 12 - Shivaji Nagar',
    location: {
      latitude: 18.5170,
      longitude: 73.8480,
      address: 'Baba Bhide Causeway, Deccan Gymkhana to Narayan Peth link',
    },
    assignedUnit: {
      id: 'unit-pmc-traffic-04',
      name: 'PMC Traffic Safety & Road Infrastructure Flying Squad',
      leadOfficer: 'Inspector Sachin Shinde',
      contactPhoneMasked: '+91-98XXXX4433',
    },
    sourceReportId: 'DIR-2026-0002',
    dispatchedAt: '2026-10-30T06:00:00Z',
    arrivedAt: null,
    completedAt: null,
    notes: 'Heavy barricades and reflective flood warning signboards dispatched via flatbed truck.',
    createdAt: '2026-10-30T06:00:00Z',
    lastUpdatedAt: '2026-10-30T06:00:00Z',
  },

  // ─── Task 4: Drinking Water Dispatch to Deccan Transit Point ───
  {
    id: 'task-pune-flood-004',
    taskNumber: 'TASK-2026-0004',
    disasterId: 'dis-pune-mutha-flood-2026',
    title: 'Distribute 200 liters packaged drinking water to stranded commuters',
    description:
      'Deliver bottled water cartons to Deccan Gymkhana bus terminus where transit passengers are awaiting route reopening.',
    taskType: RESPONSE_TASK_TYPES.FOOD_WATER_RELIEF,
    priority: TASK_PRIORITY.MEDIUM_P2,
    status: TASK_STATUS.COMPLETED,
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 12 - Shivaji Nagar',
    location: {
      latitude: 18.5160,
      longitude: 73.8420,
      address: 'Deccan Gymkhana Bus Terminus, Off FC Road',
    },
    assignedUnit: {
      id: 'res-pune-relief-deccan',
      name: 'Deccan Gymkhana Riverside Relief & Food Distribution Center',
      leadOfficer: 'Pooja Kulkarni',
      contactPhoneMasked: '+91-97XXXX4455',
    },
    relatedNeedId: 'need-pune-deccan-water-01',
    dispatchedAt: '2026-10-30T06:10:00Z',
    arrivedAt: '2026-10-30T06:25:00Z',
    completedAt: '2026-10-30T07:15:00Z',
    notes: '200 liters of packaged drinking water distributed to 140 stranded passengers.',
    createdAt: '2026-10-30T06:10:00Z',
    lastUpdatedAt: '2026-10-30T07:15:00Z',
  },

  // ─── Task 5: Mobile Medical Camp at Parvati Dispensary ───
  {
    id: 'task-pune-flood-005',
    taskNumber: 'TASK-2026-0005',
    disasterId: 'dis-pune-mutha-flood-2026',
    title: 'Establish flood medical triage post at Parvati municipal dispensary',
    description:
      'Set up 30-bed triage station for treating water immersion hypothermia, abrasions, and chronic medication refills.',
    taskType: RESPONSE_TASK_TYPES.MEDICAL_AID_TRIAGE,
    priority: TASK_PRIORITY.HIGH_P1,
    status: TASK_STATUS.ON_SCENE,
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 10 - Parvati',
    location: {
      latitude: 18.4980,
      longitude: 73.8470,
      address: 'Parvati Paytha Municipal Dispensary Compound, Pune - 411009',
    },
    assignedUnit: {
      id: 'res-pune-medical-parvati',
      name: 'Parvati Annasaheb Magar Multi-Specialty Mobile Medical Post',
      leadOfficer: 'Dr. Anita Deshpande',
      contactPhoneMasked: '+91-98XXXX9911',
    },
    dispatchedAt: '2026-10-30T05:15:00Z',
    arrivedAt: '2026-10-30T05:35:00Z',
    completedAt: null,
    notes: '18 patients treated; emergency tetanus and ORS stocks replenished.',
    createdAt: '2026-10-30T05:15:00Z',
    lastUpdatedAt: '2026-10-30T06:30:00Z',
  },
];

export const SEEDED_EVENT_TIMELINE = [
  {
    timestamp: '2026-10-30T03:45:00Z',
    stage: 'DETECTION',
    title: 'Central Water Commission (CWC) Dam Level Advisory',
    description:
      'Catchment rainfall exceeded 110mm in 6 hours. Khadakwasla Dam storage reached 100% capacity.',
    source: AAR_SOURCE_LABELS.CWC_HYDROLOGY_DATA,
    severity: 'WARNING',
  },
  {
    timestamp: '2026-10-30T04:00:00Z',
    stage: 'OFFICIAL_ALERT',
    title: 'SACHET Flash Flood Alert Ingested',
    description:
      'SACHET CAP Alert CAP-IN-MH-2026-1030-001 ingested: Mutha basin alert issued to PMC and civil defense.',
    source: AAR_SOURCE_LABELS.SACHET_NDMA_ALERT,
    severity: 'SEVERE_EMERGENCY',
  },
  {
    timestamp: '2026-10-30T04:30:00Z',
    stage: 'COMMAND_ACTIVATION',
    title: 'Disaster Event Declared — Active Response Initiated',
    description:
      'Disaster Event DIS-2026-0001 declared active by Pune DDMA coordinator. Situation Room activated.',
    source: AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD,
    severity: 'SEVERE_EMERGENCY',
  },
  {
    timestamp: '2026-10-30T04:45:00Z',
    stage: 'RESOURCE_MOBILIZATION',
    title: 'Emergency Shelters & Volunteer Battalions Mobilized',
    description:
      'Vitthalwadi primary school designated as priority shelter (350 capacity). Pune Civil Defense corps deployed.',
    source: AAR_SOURCE_LABELS.FIELD_INSPECTION,
    severity: 'HIGH_P1',
  },
  {
    timestamp: '2026-10-30T05:10:00Z',
    stage: 'CITIZEN_IMPACT_REPORT',
    title: 'Citizen Urgent Rescue Report: 4 Trapped Seniors',
    description:
      'Report DIR-2026-0001 submitted: Water ingress up to 1.2m at Swapna Nagari Society, Sinhagad Road.',
    source: AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT,
    severity: 'CRITICAL_P0',
  },
  {
    timestamp: '2026-10-30T05:25:00Z',
    stage: 'DISPATCH',
    title: 'Aquatic Rescue Boat Dispatched to Swapna Nagari',
    description:
      'Task TASK-2026-0001 dispatched PMC Fire Rescue Inflatable Boats unit with life-jackets and stretchers.',
    source: AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD,
    severity: 'CRITICAL_P0',
  },
  {
    timestamp: '2026-10-30T06:15:00Z',
    stage: 'RESCUE_COMPLETED',
    title: 'Successful Extraction of 4 Stranded Citizens',
    description:
      'All 4 residents extracted by boat crew and accommodated at Vitthalwadi Municipal School Shelter.',
    source: AAR_SOURCE_LABELS.FIELD_INSPECTION,
    severity: 'HIGH_P1',
  },
  {
    timestamp: '2026-10-30T07:15:00Z',
    stage: 'RELIEF_DELIVERY',
    title: 'Packaged Drinking Water Distributed at Deccan Terminus',
    description:
      '200 liters of packaged drinking water distributed to displaced commuters and local residents.',
    source: AAR_SOURCE_LABELS.FIELD_INSPECTION,
    severity: 'MEDIUM_P2',
  },
];

export const SEEDED_POST_EVENT_METRICS = {
  disasterId: 'dis-pune-mutha-flood-2026',
  metricsGeneratedAt: '2026-10-30T08:00:00Z',
  totalPersonsSheltered: 292,
  totalPersonsRescued: 4,
  totalMealsDistributed: 3200,
  totalDrinkingWaterLitersDistributed: 200,
  activeRoadBlockagesCount: 1,
  clearedRoadBlockagesCount: 0,
  operationalSheltersCount: 2,
  totalShelterCapacity: 550,
  totalShelterOccupancy: 325,
  overallShelterOccupancyPercentage: 59.1,
  responseTasksTotal: 5,
  responseTasksCompleted: 2,
  responseTasksActive: 3,
  averageDispatchLatencyMinutes: 14.5,
  totalVolunteerHoursLogged: 168,
  civicDamageReportsCount: 2,
  statutoryNotice: DISASTER_OPS_DISCLAIMER,
};

export const SEEDED_AFTER_ACTION_REVIEW = {
  id: 'aar-pune-flood-2026',
  disasterId: 'dis-pune-mutha-flood-2026',
  title: 'After-Action Review: Khadakwasla Spillway Discharge & Mutha River Flood Operation',
  status: AAR_STATUS.UNDER_COORDINATOR_REVIEW,
  isAuthoritative: false,
  executiveSummary:
    `${AAR_SOURCE_LABELS.AI_DRAFT} On 30 October 2026, intense catchment precipitation prompted emergency discharge of 45,000 cusecs from Khadakwasla Dam into the Mutha River corridor. ${AAR_SOURCE_LABELS.SACHET_NDMA_ALERT} Early warning from SACHET CAP feeds allowed Pune DDMA and PMC to initiate preemptive municipal shelter activations 45 minutes prior to peak urban inundation. ${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} 5 priority response tasks were mobilized, extracting 4 stranded senior citizens via inflatable rescue dinghies and sheltering 292 displaced riverside residents with zero life casualties recorded during the initial 6-hour surge window.`,
  eventOverview:
    `Event ID: DIS-2026-0001\n` +
    `Severity: SEVERE_EMERGENCY\n` +
    `Affected Jurisdictions: Pune Municipal Corporation (PMC - Wards 9, 10, 12)\n` +
    `Peak River Discharge: 45,000 cusecs\n` +
    `Duration of Critical Response: 04:30Z – 08:00Z (Ongoing Active Monitoring)`,
  operationalChronologySummary:
    `1. ${AAR_SOURCE_LABELS.CWC_HYDROLOGY_DATA} 03:45Z - CWC hydrology telemetry recorded 100% Khadakwasla reservoir level.\n` +
    `2. ${AAR_SOURCE_LABELS.SACHET_NDMA_ALERT} 04:00Z - Official SACHET CAP flood alert ingested into CivIQ gateway.\n` +
    `3. ${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} 04:30Z - Pune DDMA activated Situation Room command matrix.\n` +
    `4. ${AAR_SOURCE_LABELS.FIELD_INSPECTION} 04:45Z - Vitthalwadi Primary School opened as designated flood shelter.\n` +
    `5. ${AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT} 05:10Z - Swapna Nagari senior citizen trapping reported via mobile civic portal.\n` +
    `6. ${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} 05:25Z - PMC Rescue Boat Fleet Alpha dispatched; extraction completed at 06:15Z.\n` +
    `7. ${AAR_SOURCE_LABELS.FIELD_INSPECTION} 07:15Z - Clean drinking water rations delivered to Deccan Gymkhana terminus evacuees.`,
  strengthsObserved: [
    `${AAR_SOURCE_LABELS.SACHET_NDMA_ALERT} Rapid ingestion of official CAP warnings provided 45-minute advance lead time before low-lying riverbank submersion.`,
    `${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} Immediate dispatch of motorized zodiac rescue boats extracted vulnerable seniors with 15-minute response latency.`,
    `${AAR_SOURCE_LABELS.FIELD_INSPECTION} Vitthalwadi Municipal School was pre-stocked with hot meals, diesel generator power, and clean water tankers, accommodating 280 residents seamlessly.`,
  ],
  challengesAndBottlenecks: [
    `${AAR_SOURCE_LABELS.FIELD_INSPECTION} Baba Bhide Causeway and Pulgate causeways lacked automated rising-water barricades, necessitating manual police deployment.`,
    `${AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT} Telecom network throttling along Sinhagad Road delayed 3 citizen photo uploads during peak cloudburst.`,
    `${AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD} High silt and floating tree debris complicated dewatering pump intake at Katraj low bypass.`,
  ],
  recommendations: [
    `${AAR_SOURCE_LABELS.AI_DRAFT} Install automated pneumatic flood barriers with IoT sensors at Baba Bhide and Garware causeways linked directly to dam discharge telemetry.`,
    `${AAR_SOURCE_LABELS.AI_DRAFT} Deploy offline-first SMS fallback for citizen distress beacons during cellular data degradation.`,
    `${AAR_SOURCE_LABELS.AI_DRAFT} Pre-position high-capacity submersible trash pumps with macerators at Katraj and Sinhagad road flood basins prior to monsoon onset.`,
  ],
  sourceCitations: [
    { label: AAR_SOURCE_LABELS.SACHET_NDMA_ALERT, detail: 'CAP Alert CAP-IN-MH-2026-1030-001 issued by SACHET/NDMA' },
    { label: AAR_SOURCE_LABELS.CWC_HYDROLOGY_DATA, detail: 'Central Water Commission Khadakwasla Reservoir Telemetry Stream' },
    { label: AAR_SOURCE_LABELS.MUNICIPAL_DISPATCH_RECORD, detail: 'PMC Disaster Management Cell Dispatch Logs & Task Tracking' },
    { label: AAR_SOURCE_LABELS.FIELD_INSPECTION, detail: 'Ward 9 & Ward 12 Municipal Road & Health Inspector Reports' },
    { label: AAR_SOURCE_LABELS.CITIZEN_VERIFIED_REPORT, detail: 'Impact Reports DIR-2026-0001 & DIR-2026-0002' },
  ],
  statutoryDisclaimer: DISASTER_OPS_DISCLAIMER,
  preparedBy: {
    id: 'civiq-ai-ops-assistant',
    role: 'AI_ANALYST',
    isAiGenerated: true,
  },
  reviewedBy: {
    id: 'pmc-coord-01',
    role: 'DISASTER_COORDINATOR',
    reviewedAt: '2026-10-30T08:30:00Z',
    notes: 'Draft review approved for inter-agency coordination with Pune DDMA.',
  },
  createdAt: '2026-10-30T08:00:00Z',
  lastUpdatedAt: '2026-10-30T08:30:00Z',
};
