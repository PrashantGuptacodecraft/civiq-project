/**
 * Disaster Need-to-Resource Matching Types & Enumerations
 * Phase 65: Build need-to-resource matching
 *
 * Implements:
 * - Civic relief need types (evacuation boats, shelter beds, rations, medical aid, volunteers)
 * - Request lifecycle: OPEN_PENDING -> MATCH_RECOMMENDED -> ASSIGNMENT_ACCEPTED -> FULFILLED -> CONFIRMED
 * - Resource assignment statuses and capacity fit classifications
 * - Statutory safety disclaimer per ADR 0002
 */

export const NEED_TYPES = Object.freeze({
  BOAT_EVACUATION: 'BOAT_EVACUATION',
  SHELTER_ACCOMMODATION: 'SHELTER_ACCOMMODATION',
  DRINKING_WATER: 'DRINKING_WATER',
  FOOD_RATIONS: 'FOOD_RATIONS',
  MEDICAL_AID: 'MEDICAL_AID',
  EQUIPMENT_REPAIR: 'EQUIPMENT_REPAIR',
  VOLUNTEER_SUPPORT: 'VOLUNTEER_SUPPORT',
});

export const NEED_STATUS = Object.freeze({
  OPEN_PENDING: 'OPEN_PENDING',
  MATCH_RECOMMENDED: 'MATCH_RECOMMENDED',
  ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
  FULFILLED: 'FULFILLED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
});

export const ASSIGNMENT_STATUS = Object.freeze({
  PROPOSED: 'PROPOSED',
  ACCEPTED: 'ACCEPTED',
  DISPATCHED: 'DISPATCHED',
  FULFILLED: 'FULFILLED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
});

export const CAPACITY_FIT = Object.freeze({
  EXCEEDS_REQUIREMENT: 'EXCEEDS_REQUIREMENT',
  EXACT_FIT: 'EXACT_FIT',
  PARTIAL_FIT: 'PARTIAL_FIT',
  ZERO_CAPACITY: 'ZERO_CAPACITY',
});

export const DISASTER_RESOURCE_MATCHING_DISCLAIMER =
  'CivIQ Resource Matching Advisory: Recommended allocations and fulfillment pathways are ' +
  'deterministic operational recommendations designed to assist civic coordinators. ' +
  'Pursuant to the Disaster Management Act, 2005, sovereign emergency declarations and ' +
  'official tasking orders by NDMA/DDMA maintain absolute operational precedence. ' +
  'All resource assignments require explicit acceptance by an authorized human coordinator.';
