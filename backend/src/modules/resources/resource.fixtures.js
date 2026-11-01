/**
 * Seeded Synthetic Disaster Resource & Shelter Fixtures
 * Phase 64: Build resource and shelter registry
 *
 * Models authentic verified emergency shelters, medical posts,
 * relief distribution points, equipment depots, and volunteer corps
 * across Pune Municipal Corporation (PMC) and PCMC jurisdictions.
 */

import {
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  VERIFICATION_STATUS,
  CAPACITY_UPDATE_SOURCE,
  DISASTER_RESOURCE_DISCLAIMER,
} from './resource.types.js';

export const SEEDED_DISASTER_RESOURCES = [
  // ─── 1. Sinhagad Road Emergency Evacuation Shelter (PMC) ───
  {
    id: 'res-pune-shelter-vitthalwadi',
    resourceNumber: 'RES-2026-0001',
    title: 'Vitthalwadi Municipal Primary School Emergency Evacuation Shelter',
    description:
      'Three-story reinforced concrete municipal school designated as priority flood evacuation center. ' +
      'Equipped with diesel power backup, clean water tankers, community kitchen, and medical triage post.',
    resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
    status: RESOURCE_STATUS.NEARING_CAPACITY,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'PMC Disaster Management Cell',
      officerId: 'pmc-coord-01',
      verifiedAt: '2026-10-30T04:45:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 9 - Sinhagad Road',
    location: {
      latitude: 18.4870,
      longitude: 73.8340,
      address: 'Survey No. 44, Near Vitthal Mandir, Sinhagad Road, Pune - 411030',
      landmark: 'Behind Vitthalwadi Bus Terminus',
    },
    capacity: {
      totalCapacity: 350,
      currentOccupancy: 280,
      availableCapacity: 70,
      occupancyPercentage: 80.0,
      unit: 'PERSONS',
      lastUpdatedAt: '2026-10-30T06:00:00Z',
      updatedBy: { id: 'usr-shelter-mgr-01', role: 'FIELD_WORKER' },
      updateSource: CAPACITY_UPDATE_SOURCE.SHELTER_MANAGER_UPDATE,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T04:30:00Z',
        previousOccupancy: 0,
        newOccupancy: 120,
        updatedBy: { id: 'usr-shelter-mgr-01', role: 'FIELD_WORKER' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: 'Shelter opened; first wave of Sinhagad road evacuees registered.',
      },
      {
        timestamp: '2026-10-30T06:00:00Z',
        previousOccupancy: 120,
        newOccupancy: 280,
        updatedBy: { id: 'usr-shelter-mgr-01', role: 'FIELD_WORKER' },
        updateSource: CAPACITY_UPDATE_SOURCE.SHELTER_MANAGER_UPDATE,
        notes: 'Second wave of 160 residents arrived via PMC transit buses.',
      },
    ],
    facilities: [
      'DRINKING_WATER_TANKERS',
      'HOT_MEALS_KITCHEN',
      'DIESEL_GENERATOR_POWER',
      'FIRST_AID_POST',
      'DEDICATED_WOMEN_AND_CHILDREN_SPACE',
      'WHEELCHAIR_RAMP_ACCESSIBILITY',
    ],
    contact: {
      coordinatorName: 'Santosh Gaikwad',
      contactPhoneMasked: '+91-98XXXX1122',
      alternatePhoneMasked: '+91-020-25501269',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T04:30:00Z',
    lastUpdatedAt: '2026-10-30T06:00:00Z',
  },

  // ─── 2. Deccan Gymkhana Riverside Relief & Ration Distribution Point (PMC) ───
  {
    id: 'res-pune-relief-deccan',
    resourceNumber: 'RES-2026-0002',
    title: 'Deccan Gymkhana Riverside Relief & Food Distribution Center',
    description:
      'Community distribution depot serving displaced residents from Deccan causeway, Pulgate, and Narayan Peth fringes. ' +
      'Distributes drinking water bottles, dry food packets, tarpaulins, and baby formula.',
    resourceType: RESOURCE_TYPES.RELIEF_DISTRIBUTION_CENTER,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'PMC Ward 12 Disaster Relief Cell',
      officerId: 'pmc-ward12-off',
      verifiedAt: '2026-10-30T05:00:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 12 - Shivaji Nagar',
    location: {
      latitude: 18.5160,
      longitude: 73.8420,
      address: 'Deccan Gymkhana Pavilion Grounds, Off FC Road, Pune - 411004',
      landmark: 'Near Garware Bridge Ramp',
    },
    capacity: {
      totalCapacity: 5000,
      currentOccupancy: 3200,
      availableCapacity: 1800,
      occupancyPercentage: 64.0,
      unit: 'MEALS_PER_DAY',
      lastUpdatedAt: '2026-10-30T06:15:00Z',
      updatedBy: { id: 'usr-relief-coord-02', role: 'DISASTER_COORDINATOR' },
      updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T05:00:00Z',
        previousOccupancy: 0,
        newOccupancy: 3200,
        updatedBy: { id: 'usr-relief-coord-02', role: 'DISASTER_COORDINATOR' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: 'Supply depot activated with 5,000 meal capacity.',
      },
    ],
    facilities: ['BULK_FOOD_DISTRIBUTION', 'PACKAGED_DRINKING_WATER', 'BLANKET_KITS', 'BABY_CARE_ESSENTIALS'],
    contact: {
      coordinatorName: 'Pooja Kulkarni',
      contactPhoneMasked: '+91-97XXXX4455',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T05:00:00Z',
    lastUpdatedAt: '2026-10-30T06:15:00Z',
  },

  // ─── 3. Parvati Hospital Mobile Triage Medical Camp (PMC) ───
  {
    id: 'res-pune-medical-parvati',
    resourceNumber: 'RES-2026-0003',
    title: 'Parvati Annasaheb Magar Multi-Specialty Mobile Medical Post',
    description:
      'Field medical triage station treating waterborne exposures, hypothermia, blunt injuries, and chronic prescription replacements.',
    resourceType: RESOURCE_TYPES.MEDICAL_CAMP,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'Pune Municipal Health Department',
      officerId: 'pmc-health-off-08',
      verifiedAt: '2026-10-30T05:15:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 10 - Parvati',
    location: {
      latitude: 18.4980,
      longitude: 73.8470,
      address: 'Parvati Paytha Municipal Dispensary Compound, Pune - 411009',
      landmark: 'Near Parvati Water Works',
    },
    capacity: {
      totalCapacity: 30,
      currentOccupancy: 18,
      availableCapacity: 12,
      occupancyPercentage: 60.0,
      unit: 'TRIAGE_BEDS',
      lastUpdatedAt: '2026-10-30T06:30:00Z',
      updatedBy: { id: 'usr-doc-triage-01', role: 'FIELD_WORKER' },
      updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T05:15:00Z',
        previousOccupancy: 0,
        newOccupancy: 18,
        updatedBy: { id: 'usr-doc-triage-01', role: 'FIELD_WORKER' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: 'Mobile medical camp deployed with 30 emergency beds.',
      },
    ],
    facilities: ['EMERGENCY_DOCTORS_ON_DUTY', 'ICU_AMBULANCE_STATIONED', 'TETANUS_ANTIVENOM_STOCKS', 'OXYGEN_CONCENTRATORS'],
    contact: {
      coordinatorName: 'Dr. Anand Shinde (MD)',
      contactPhoneMasked: '+91-99XXXX8899',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T05:15:00Z',
    lastUpdatedAt: '2026-10-30T06:30:00Z',
  },

  // ─── 4. Katraj Ghat Dewatering & Heavy Equipment Station (PMC) ───
  {
    id: 'res-pune-equipment-katraj',
    resourceNumber: 'RES-2026-0004',
    title: 'Katraj Ghat Emergency Dewatering & Heavy Equipment Depot',
    description:
      'Municipal machinery staging yard equipped with JCB excavators, wheel loaders, high-discharge diesel pumps, and tow trucks.',
    resourceType: RESOURCE_TYPES.EMERGENCY_VEHICLE,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'PMC Mechanical Engineering Cell',
      officerId: 'pmc-mech-eng-04',
      verifiedAt: '2026-10-30T05:30:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 23 - Dhankawadi / Katraj',
    location: {
      latitude: 18.4410,
      longitude: 73.8580,
      address: 'NH-48 Bypass Depot, Katraj Ghat Base, Pune - 411046',
      landmark: 'Near Katraj Snake Park Toll Junction',
    },
    capacity: {
      totalCapacity: 15,
      currentOccupancy: 10,
      availableCapacity: 5,
      occupancyPercentage: 66.7,
      unit: 'EQUIPMENT_UNITS',
      lastUpdatedAt: '2026-10-30T06:00:00Z',
      updatedBy: { id: 'usr-depot-super-01', role: 'FIELD_SUPERVISOR' },
      updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T05:30:00Z',
        previousOccupancy: 0,
        newOccupancy: 10,
        updatedBy: { id: 'usr-depot-super-01', role: 'FIELD_SUPERVISOR' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: '10 units deployed to Old Katraj tunnel rockfall clearance; 5 remain on standby.',
      },
    ],
    facilities: ['HEAVY_JCB_EXCAVATORS', 'DIESEL_DEWATERING_PUMPS', 'HYDRAULIC_CRANE', 'MOBILE_WORKSHOP'],
    contact: {
      coordinatorName: 'Sunil Bhosale',
      contactPhoneMasked: '+91-98XXXX7766',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T05:30:00Z',
    lastUpdatedAt: '2026-10-30T06:00:00Z',
  },

  // ─── 5. PCMC Sector 7 Community Hall & Shelter (PCMC Jurisdiction) ───
  {
    id: 'res-pcmc-shelter-bhosari',
    resourceNumber: 'RES-2026-0005',
    title: 'PCMC Sector 7 Community Hall & Civil Defense Shelter',
    description:
      'PCMC municipal multi-purpose facility equipped with ventilation filtration systems for industrial hazmat buffer protection.',
    resourceType: RESOURCE_TYPES.EMERGENCY_SHELTER,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'PCMC Disaster Management Cell',
      officerId: 'pcmc-dm-02',
      verifiedAt: '2026-10-30T02:30:00Z',
    },
    jurisdictionId: 'mh-pune-pcmc',
    ward: 'Ward 18 - Chinchwad / Bhosari',
    location: {
      latitude: 18.6310,
      longitude: 73.8460,
      address: 'Plot 12, Sector 7, Bhosari MIDC, Pimpri-Chinchwad - 411026',
      landmark: 'Near PCMC Ward Office 4',
    },
    capacity: {
      totalCapacity: 200,
      currentOccupancy: 45,
      availableCapacity: 155,
      occupancyPercentage: 22.5,
      unit: 'PERSONS',
      lastUpdatedAt: '2026-10-30T05:00:00Z',
      updatedBy: { id: 'usr-pcmc-shelter-mgr', role: 'FIELD_WORKER' },
      updateSource: CAPACITY_UPDATE_SOURCE.SHELTER_MANAGER_UPDATE,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T02:30:00Z',
        previousOccupancy: 0,
        newOccupancy: 45,
        updatedBy: { id: 'usr-pcmc-shelter-mgr', role: 'FIELD_WORKER' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: 'Shelter activated following Bhosari chlorine vapor alert; 45 residents sheltered.',
      },
    ],
    facilities: ['POSITIVE_AIR_VENTILATION', 'CLEAN_DRINKING_WATER', 'RESPIRATORY_FIRST_AID', 'MEAL_PACKETS'],
    contact: {
      coordinatorName: 'Milind Tambe',
      contactPhoneMasked: '+91-94XXXX3322',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T02:30:00Z',
    lastUpdatedAt: '2026-10-30T05:00:00Z',
  },

  // ─── 6. Pune Civil Defense Mutha Flood Volunteer Unit (PMC) ───
  {
    id: 'res-pune-volunteers-civildefense',
    resourceNumber: 'RES-2026-0006',
    title: 'Pune Civil Defense Flood Relief Volunteer Battalions',
    description:
      'Trained volunteer force mobilized for water rescue assistance, food kit portage, and elderly evacuation along Sinhagad Road.',
    resourceType: RESOURCE_TYPES.VOLUNTEER_TEAM,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'District Disaster Management Authority (DDMA), Pune',
      officerId: 'ddma-vol-coord',
      verifiedAt: '2026-10-30T04:45:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 9 - Sinhagad Road',
    location: {
      latitude: 18.4910,
      longitude: 73.8320,
      address: 'Sinhagad Road Police Chowki Grounds, Pune - 411030',
      landmark: 'Opposite Pu La Deshpande Garden',
    },
    capacity: {
      totalCapacity: 60,
      currentOccupancy: 42,
      availableCapacity: 18,
      occupancyPercentage: 70.0,
      unit: 'VOLUNTEERS',
      lastUpdatedAt: '2026-10-30T06:00:00Z',
      updatedBy: { id: 'usr-vol-captain', role: 'FIELD_SUPERVISOR' },
      updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T04:45:00Z',
        previousOccupancy: 0,
        newOccupancy: 42,
        updatedBy: { id: 'usr-vol-captain', role: 'FIELD_SUPERVISOR' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: '42 volunteers deployed with life-jackets and walkie-talkies.',
      },
    ],
    facilities: ['SWIMMING_CERTIFIED', 'INFLATABLE_DINGHY_OPERATORS', 'COMMUNITY_FIRST_RESPONDERS', 'MEGAPHONES'],
    contact: {
      coordinatorName: 'Captain Ramesh Jadhav',
      contactPhoneMasked: '+91-96XXXX5544',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T04:45:00Z',
    lastUpdatedAt: '2026-10-30T06:00:00Z',
  },

  // ─── 7. PMC Fire Brigade Flood Rescue Boat Fleet (PMC) ───
  {
    id: 'res-pune-rescue-boat-fleet',
    resourceNumber: 'RES-2026-0007',
    title: 'PMC Fire Brigade Flood Rescue Inflatable Boats Division',
    description:
      'Emergency boat deployment station equipped with rigid-hull inflatable rescue boats, outboard motors, sonar locators, and trained aquatic divers.',
    resourceType: RESOURCE_TYPES.EMERGENCY_VEHICLE,
    status: RESOURCE_STATUS.ACTIVE_OPERATIONAL,
    verificationStatus: VERIFICATION_STATUS.VERIFIED_OFFICIAL,
    verifiedBy: {
      agency: 'PMC Fire & Emergency Services',
      officerId: 'pmc-fire-chief-01',
      verifiedAt: '2026-10-30T04:00:00Z',
    },
    jurisdictionId: 'mh-pune-pmc',
    ward: 'Ward 9 - Sinhagad Road',
    location: {
      latitude: 18.5020,
      longitude: 73.8560,
      address: 'Central Fire Station, Station Road, Pune - 411001',
      landmark: 'Near Pune Railway Station / Mutha River Bridge',
    },
    capacity: {
      totalCapacity: 8,
      currentOccupancy: 2,
      availableCapacity: 6,
      occupancyPercentage: 25.0,
      unit: 'BOATS',
      lastUpdatedAt: '2026-10-30T05:30:00Z',
      updatedBy: { id: 'usr-boat-chief-01', role: 'FIELD_SUPERVISOR' },
      updateSource: CAPACITY_UPDATE_SOURCE.FIELD_INSPECTION,
    },
    capacityHistory: [
      {
        timestamp: '2026-10-30T04:00:00Z',
        previousOccupancy: 0,
        newOccupancy: 2,
        updatedBy: { id: 'usr-boat-chief-01', role: 'FIELD_SUPERVISOR' },
        updateSource: CAPACITY_UPDATE_SOURCE.INITIAL_REGISTRATION,
        notes: '2 motorized zodiacs deployed to Sinhagad riverbank evacuation; 6 remain ready on trailers.',
      },
    ],
    facilities: ['INFLATABLE_ZODIAC_BOATS', 'OUTBOARD_40HP_MOTORS', 'RESCUE_DIVERS', 'SURFACE_SWIM_HARNESSES'],
    contact: {
      coordinatorName: 'Chief Fire Officer Devendra Potphode',
      contactPhoneMasked: '+91-98XXXX8899',
    },
    statutoryNotice: DISASTER_RESOURCE_DISCLAIMER,
    createdAt: '2026-10-30T04:00:00Z',
    lastUpdatedAt: '2026-10-30T05:30:00Z',
  },
];
