/**
 * Seeded Synthetic Need-to-Resource Matching Fixtures
 * Phase 65: Build need-to-resource matching
 *
 * Models authentic civic relief needs, deterministic matching recommendations,
 * accepted coordinator assignments, and tracked fulfillments across Pune and PCMC.
 */

import {
  NEED_TYPES,
  NEED_STATUS,
  ASSIGNMENT_STATUS,
  DISASTER_RESOURCE_MATCHING_DISCLAIMER,
} from './resource-matching.types.js';

export const SEEDED_NEED_REQUESTS = [
  // ─── 1. Vitthalwadi Stranded Senior Citizens (Open Pending) ───
  {
    id: 'need-pune-vitthalwadi-boat-01',
    needNumber: 'NEED-2026-0001',
    title: 'Elderly residents stranded in waterlogged Swapna Nagari ground floor',
    description:
      '4 elderly residents require rescue boat transport to dry high ground following Khadakwasla spillway surge.',
    needType: NEED_TYPES.BOAT_EVACUATION,
    severity: 'CRITICAL_LIFE_SAFETY',
    status: NEED_STATUS.OPEN_PENDING,
    quantity: 2,
    unit: 'BOATS',
    location: {
      latitude: 18.4880,
      longitude: 73.8310,
      address: 'Swapna Nagari Society, Near Vitthal Mandir, Sinhagad Road',
      ward: 'Ward 9 - Sinhagad Road',
      jurisdictionId: 'mh-pune-pmc',
    },
    contact: {
      contactName: 'Ramesh Kulkarni',
      contactPhoneMasked: '+91-98XXXX1234',
    },
    sourceReportId: 'DIR-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    requestedBy: {
      id: 'citizen-992',
      role: 'CITIZEN',
      requestedAt: '2026-10-30T05:15:00Z',
    },
    statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    createdAt: '2026-10-30T05:15:00Z',
    lastUpdatedAt: '2026-10-30T05:15:00Z',
  },

  // ─── 2. Sinhagad Road Evacuee Shelter Need (Assignment Accepted) ───
  {
    id: 'need-pune-vitthalwadi-shelter-01',
    needNumber: 'NEED-2026-0002',
    title: 'Immediate emergency shelter for 12 displaced riverside residents',
    description:
      'Family group evacuated from inundated riverbank chawls requiring overnight dry shelter, food, and clean water.',
    needType: NEED_TYPES.SHELTER_ACCOMMODATION,
    severity: 'HIGH_URGENT',
    status: NEED_STATUS.ASSIGNMENT_ACCEPTED,
    quantity: 12,
    unit: 'PERSONS',
    location: {
      latitude: 18.4875,
      longitude: 73.8325,
      address: 'Pu La Deshpande Garden riverbank fringe, Sinhagad Road',
      ward: 'Ward 9 - Sinhagad Road',
      jurisdictionId: 'mh-pune-pmc',
    },
    contact: {
      contactName: 'Sunita Kamble',
      contactPhoneMasked: '+91-98XXXX7788',
    },
    sourceReportId: 'DIR-2026-0001',
    disasterId: 'dis-pune-mutha-flood-2026',
    requestedBy: {
      id: 'worker-pmc-42',
      role: 'FIELD_WORKER',
      requestedAt: '2026-10-30T05:30:00Z',
    },
    activeAssignmentId: 'asgn-pune-shelter-001',
    statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    createdAt: '2026-10-30T05:30:00Z',
    lastUpdatedAt: '2026-10-30T06:10:00Z',
  },

  // ─── 3. Deccan Gymkhana Drinking Water Supply (Fulfilled) ───
  {
    id: 'need-pune-deccan-water-01',
    needNumber: 'NEED-2026-0003',
    title: 'Packaged drinking water crates for stranded commuters at Deccan',
    description:
      'Flooding at Bhide Bridge stranded transit commuters. Need 200 liters of packaged drinking water.',
    needType: NEED_TYPES.DRINKING_WATER,
    severity: 'HIGH_URGENT',
    status: NEED_STATUS.FULFILLED,
    quantity: 200,
    unit: 'LITERS',
    location: {
      latitude: 18.5160,
      longitude: 73.8420,
      address: 'Deccan Gymkhana Bus Terminus, Off FC Road',
      ward: 'Ward 12 - Shivaji Nagar',
      jurisdictionId: 'mh-pune-pmc',
    },
    contact: {
      contactName: 'Vikas Shinde',
      contactPhoneMasked: '+91-97XXXX9900',
    },
    sourceReportId: 'DIR-2026-0002',
    disasterId: 'dis-pune-mutha-flood-2026',
    requestedBy: {
      id: 'worker-pmc-42',
      role: 'FIELD_WORKER',
      requestedAt: '2026-10-30T05:45:00Z',
    },
    activeAssignmentId: 'asgn-pune-water-002',
    statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    createdAt: '2026-10-30T05:45:00Z',
    lastUpdatedAt: '2026-10-30T07:15:00Z',
  },

  // ─── 4. PCMC Dapodi Evacuee Shelter Need (Confirmed) ───
  {
    id: 'need-pcmc-dapodi-shelter-01',
    needNumber: 'NEED-2026-0004',
    title: 'Emergency shelter accommodation for 15 displaced Dapodi residents',
    description:
      'Pavana river overflow inundating low-lying river huts. 15 residents evacuated.',
    needType: NEED_TYPES.SHELTER_ACCOMMODATION,
    severity: 'HIGH_URGENT',
    status: NEED_STATUS.CONFIRMED,
    quantity: 15,
    unit: 'PERSONS',
    location: {
      latitude: 18.5770,
      longitude: 73.8280,
      address: 'Dapodi Riverbank settlement, Near Harris Bridge',
      ward: 'Ward 4 - Dapodi Phugewadi',
      jurisdictionId: 'mh-pune-pcmc',
    },
    contact: {
      contactName: 'Anil Jadhav',
      contactPhoneMasked: '+91-96XXXX3344',
    },
    disasterId: 'dis-pcmc-pavana-flood-2026',
    requestedBy: {
      id: 'usr-pcmc-field-01',
      role: 'FIELD_WORKER',
      requestedAt: '2026-10-30T06:00:00Z',
    },
    activeAssignmentId: 'asgn-pcmc-shelter-003',
    statutoryNotice: DISASTER_RESOURCE_MATCHING_DISCLAIMER,
    createdAt: '2026-10-30T06:00:00Z',
    lastUpdatedAt: '2026-10-30T08:30:00Z',
  },
];

export const SEEDED_ASSIGNMENTS = [
  // Assignment 1: Sinhagad Road shelter accommodation
  {
    id: 'asgn-pune-shelter-001',
    assignmentNumber: 'ASGN-2026-0001',
    needId: 'need-pune-vitthalwadi-shelter-01',
    resourceId: 'res-pune-shelter-vitthalwadi',
    resourceTitle: 'Vitthalwadi Municipal Primary School Emergency Evacuation Shelter',
    resourceType: 'EMERGENCY_SHELTER',
    assignedQuantity: 12,
    unit: 'PERSONS',
    status: ASSIGNMENT_STATUS.ACCEPTED,
    matchScore: 92.5,
    distanceKm: 0.2,
    assignedBy: {
      id: 'pmc-coord-01',
      role: 'DISASTER_COORDINATOR',
      acceptedAt: '2026-10-30T06:10:00Z',
    },
    coordinatorNotes:
      'Directed 12 evacuees to Vitthalwadi municipal school shelter hall B. Rations and bedding assigned.',
    history: [
      {
        status: ASSIGNMENT_STATUS.PROPOSED,
        timestamp: '2026-10-30T06:05:00Z',
        action: 'System generated match recommendation',
        performedBy: { id: 'system', role: 'SYSTEM' },
      },
      {
        status: ASSIGNMENT_STATUS.ACCEPTED,
        timestamp: '2026-10-30T06:10:00Z',
        action: 'Authorized disaster coordinator accepted assignment',
        performedBy: { id: 'pmc-coord-01', role: 'DISASTER_COORDINATOR' },
      },
    ],
    createdAt: '2026-10-30T06:05:00Z',
    lastUpdatedAt: '2026-10-30T06:10:00Z',
  },

  // Assignment 2: Deccan drinking water supply
  {
    id: 'asgn-pune-water-002',
    assignmentNumber: 'ASGN-2026-0002',
    needId: 'need-pune-deccan-water-01',
    resourceId: 'res-pune-relief-deccan',
    resourceTitle: 'Deccan Gymkhana Riverside Relief & Food Distribution Center',
    resourceType: 'RELIEF_DISTRIBUTION_CENTER',
    assignedQuantity: 200,
    unit: 'LITERS',
    status: ASSIGNMENT_STATUS.FULFILLED,
    matchScore: 98.0,
    distanceKm: 0.1,
    assignedBy: {
      id: 'usr-relief-coord-02',
      role: 'DISASTER_COORDINATOR',
      acceptedAt: '2026-10-30T06:00:00Z',
    },
    fulfilledBy: {
      id: 'worker-pmc-42',
      role: 'FIELD_WORKER',
      fulfilledAt: '2026-10-30T07:15:00Z',
    },
    coordinatorNotes: 'Dispatched 10 cartons (200L total) packaged drinking water bottles.',
    fulfilmentNotes: 'Delivered 200 liters packaged water crates to Deccan Bus Terminus shelter area.',
    history: [
      {
        status: ASSIGNMENT_STATUS.ACCEPTED,
        timestamp: '2026-10-30T06:00:00Z',
        action: 'Coordinator accepted water dispatch',
        performedBy: { id: 'usr-relief-coord-02', role: 'DISASTER_COORDINATOR' },
      },
      {
        status: ASSIGNMENT_STATUS.FULFILLED,
        timestamp: '2026-10-30T07:15:00Z',
        action: 'Field worker delivered water supply',
        performedBy: { id: 'worker-pmc-42', role: 'FIELD_WORKER' },
      },
    ],
    createdAt: '2026-10-30T06:00:00Z',
    lastUpdatedAt: '2026-10-30T07:15:00Z',
  },

  // Assignment 3: Dapodi shelter accommodation (Confirmed)
  {
    id: 'asgn-pcmc-shelter-003',
    assignmentNumber: 'ASGN-2026-0003',
    needId: 'need-pcmc-dapodi-shelter-01',
    resourceId: 'res-pcmc-shelter-dapodi',
    resourceTitle: 'PCMC Multipurpose Community Hall & Relief Center, Dapodi',
    resourceType: 'EMERGENCY_SHELTER',
    assignedQuantity: 15,
    unit: 'PERSONS',
    status: ASSIGNMENT_STATUS.CONFIRMED,
    matchScore: 94.0,
    distanceKm: 0.3,
    assignedBy: {
      id: 'usr-pcmc-coord-01',
      role: 'DISASTER_COORDINATOR',
      acceptedAt: '2026-10-30T06:15:00Z',
    },
    fulfilledBy: {
      id: 'usr-pcmc-field-01',
      role: 'FIELD_WORKER',
      fulfilledAt: '2026-10-30T07:30:00Z',
    },
    confirmedBy: {
      id: 'usr-pcmc-verif-01',
      role: 'VERIFICATION_OFFICER',
      confirmedAt: '2026-10-30T08:30:00Z',
    },
    coordinatorNotes: 'Allocated 15 beds at Dapodi community hall relief center.',
    fulfilmentNotes: 'All 15 evacuees registered and provided hot breakfast and dry clothing.',
    confirmationNotes:
      'Field inspection confirmed all 15 individuals safely housed and meals provided. No further urgent needs.',
    feedbackRating: 5,
    history: [
      {
        status: ASSIGNMENT_STATUS.ACCEPTED,
        timestamp: '2026-10-30T06:15:00Z',
        action: 'Coordinator accepted shelter assignment',
        performedBy: { id: 'usr-pcmc-coord-01', role: 'DISASTER_COORDINATOR' },
      },
      {
        status: ASSIGNMENT_STATUS.FULFILLED,
        timestamp: '2026-10-30T07:30:00Z',
        action: 'Evacuees settled into facility',
        performedBy: { id: 'usr-pcmc-field-01', role: 'FIELD_WORKER' },
      },
      {
        status: ASSIGNMENT_STATUS.CONFIRMED,
        timestamp: '2026-10-30T08:30:00Z',
        action: 'Verification officer verified fulfillment',
        performedBy: { id: 'usr-pcmc-verif-01', role: 'VERIFICATION_OFFICER' },
      },
    ],
    createdAt: '2026-10-30T06:15:00Z',
    lastUpdatedAt: '2026-10-30T08:30:00Z',
  },
];
