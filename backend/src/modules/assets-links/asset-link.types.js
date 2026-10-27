/**
 * Asset Link Types and Constants
 * Phase 50: Link Issues to Assets
 */

import { ASSET_TYPES } from '../assets/asset.types.js';

export const LINK_METHODS = {
  GEOSPATIAL_SUGGESTION: 'GEOSPATIAL_SUGGESTION',
  MANUAL_OFFICER: 'MANUAL_OFFICER',
  FIELD_VERIFICATION: 'FIELD_VERIFICATION',
  AI_CLASSIFIER: 'AI_CLASSIFIER',
};

export const LINK_STATUS = {
  ACTIVE: 'ACTIVE',
  UNLINKED: 'UNLINKED',
  DISPUTED: 'DISPUTED',
};

export const LINK_HISTORY_ACTIONS = {
  LINKED: 'LINKED',
  UNLINKED: 'UNLINKED',
  CONFIDENCE_UPDATED: 'CONFIDENCE_UPDATED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  NOTES_UPDATED: 'NOTES_UPDATED',
};

/**
 * Mapping between Civic Issue Taxonomy Categories and compatible Asset Types.
 * Used by the Geospatial Candidate Engine to boost affinity scoring.
 */
export const CATEGORY_ASSET_TYPE_AFFINITY = {
  roads_pothole: [ASSET_TYPES.ROAD_SEGMENT],
  roads_streetlighting: [ASSET_TYPES.STREETLIGHT],
  roads_footpath_damage: [ASSET_TYPES.ROAD_SEGMENT],
  sanitation_blocked_drain: [ASSET_TYPES.DRAINAGE_CULVERT, ASSET_TYPES.STORM_DRAIN],
  sanitation_open_manhole: [ASSET_TYPES.STORM_DRAIN, ASSET_TYPES.DRAINAGE_CULVERT],
  water_pipeline_leak: [ASSET_TYPES.WATER_PIPELINE, ASSET_TYPES.WATER_VALVE, ASSET_TYPES.WATER_PUMP],
  water_no_supply: [ASSET_TYPES.WATER_PIPELINE, ASSET_TYPES.WATER_PUMP, ASSET_TYPES.WATER_VALVE],
  waste_garbage_dump: [ASSET_TYPES.WASTE_STATION, ASSET_TYPES.COMMUNITY_TOILET],
  waste_dead_animal: [ASSET_TYPES.WASTE_STATION],
  electrical_hanging_wires: [ASSET_TYPES.ELECTRICAL_TRANSFORMER, ASSET_TYPES.STREETLIGHT],
  facilities_public_toilet: [ASSET_TYPES.COMMUNITY_TOILET, ASSET_TYPES.PUBLIC_FACILITY],
};

/**
 * Confirmed verification states permitted to be linked to infrastructure assets.
 */
export const CONFIRMED_VERIFICATION_STATUSES = ['VERIFIED'];
