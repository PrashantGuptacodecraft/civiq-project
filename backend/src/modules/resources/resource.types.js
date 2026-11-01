/**
 * Disaster Resource & Shelter Registry Types & Enumerations
 * Phase 64: Build resource and shelter registry
 *
 * Implements:
 * - Resource categories: shelters, medical camps, relief centers, volunteer teams, vehicles, supplies
 * - Capacity tracking types and source attribution
 * - Operational & verification status models
 * - Statutory safety disclaimer
 */

export const RESOURCE_TYPES = Object.freeze({
  EMERGENCY_SHELTER: 'EMERGENCY_SHELTER',
  MEDICAL_CAMP: 'MEDICAL_CAMP',
  RELIEF_DISTRIBUTION_CENTER: 'RELIEF_DISTRIBUTION_CENTER',
  VOLUNTEER_TEAM: 'VOLUNTEER_TEAM',
  EMERGENCY_VEHICLE: 'EMERGENCY_VEHICLE',
  RELIEF_SUPPLY_INVENTORY: 'RELIEF_SUPPLY_INVENTORY',
});

export const RESOURCE_STATUS = Object.freeze({
  ACTIVE_OPERATIONAL: 'ACTIVE_OPERATIONAL',
  NEARING_CAPACITY: 'NEARING_CAPACITY',
  AT_FULL_CAPACITY: 'AT_FULL_CAPACITY',
  MOBILIZING: 'MOBILIZING',
  STANDBY: 'STANDBY',
  DECOMMISSIONED: 'DECOMMISSIONED',
});

export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED_OFFICIAL: 'VERIFIED_OFFICIAL',
  PROVISIONALLY_REGISTERED: 'PROVISIONALLY_REGISTERED',
  EXPIRED_UNVERIFIED: 'EXPIRED_UNVERIFIED',
});

export const CAPACITY_UPDATE_SOURCE = Object.freeze({
  FIELD_INSPECTION: 'FIELD_INSPECTION',
  SHELTER_MANAGER_UPDATE: 'SHELTER_MANAGER_UPDATE',
  IOT_CHECKIN: 'IOT_CHECKIN',
  DDMA_FEED: 'DDMA_FEED',
  INITIAL_REGISTRATION: 'INITIAL_REGISTRATION',
});

export const DISASTER_RESOURCE_DISCLAIMER =
  'CivIQ Disaster Resource & Shelter Notice: Emergency shelter allocations, medical camp operations, ' +
  'and relief logistics operate under the statutory authority of the Municipal Corporation and ' +
  'District Disaster Management Authority (DDMA) pursuant to the Disaster Management Act, 2005. ' +
  'Displayed capacities are synchronized periodically for civic coordination; ' +
  'direct life-safety evacuation instructions issued by DDMA/NDRF take sovereign precedence.';
