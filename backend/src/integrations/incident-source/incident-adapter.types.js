/**
 * Official Incident Source Adapter Types and Contracts
 * Phase 58: Add official-source incident adapter contract
 */

export const OFFICIAL_SOURCES = {
  IRAD: 'IRAD',                         // Integrated Road Accident Database (MoRTH/NIC)
  EDAR: 'EDAR',                         // Electronic Detailed Accident Report
  POLICE_CAD: 'POLICE_CAD',             // State Police Computer Aided Dispatch
  TRAFFIC_POLICE_FEED: 'TRAFFIC_POLICE_FEED', // City Traffic Police Automated Feed
  MOCK_SANDBOX: 'MOCK_SANDBOX',         // Default local mock/sandbox for college deployment
};

export const COLLISION_TYPES = {
  HEAD_ON: 'HEAD_ON',
  REAR_END: 'REAR_END',
  SKID_OR_OVERTURN: 'SKID_OR_OVERTURN',
  PEDESTRIAN_IMPACT: 'PEDESTRIAN_IMPACT',
  FIXED_OBJECT: 'FIXED_OBJECT',
  SIDESWIPE: 'SIDESWIPE',
  CHAIN_REACTION: 'CHAIN_REACTION',
  OTHER: 'OTHER',
};

export const OFFICIAL_SEVERITY_LEVELS = {
  FATAL: 'FATAL',
  GRIEVOUS_INJURY: 'GRIEVOUS_INJURY',
  MINOR_INJURY: 'MINOR_INJURY',
  NON_INJURY_DAMAGE_ONLY: 'NON_INJURY_DAMAGE_ONLY',
};

export const ROAD_SURFACE_CONDITIONS = {
  DRY_NORMAL: 'DRY_NORMAL',
  POTHOLE_OR_DAMAGED: 'POTHOLE_OR_DAMAGED',
  WET_OR_SLIPPERY: 'WET_OR_SLIPPERY',
  WATERLOGGED: 'WATERLOGGED',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
  OIL_OR_FUEL_SPILL: 'OIL_OR_FUEL_SPILL',
};

export const LIGHTING_CONDITIONS = {
  DAYLIGHT: 'DAYLIGHT',
  NIGHT_ILLUMINATED: 'NIGHT_ILLUMINATED',
  NIGHT_DARK_OR_UNLIT: 'NIGHT_DARK_OR_UNLIT',
  DAWN_OR_DUSK: 'DAWN_OR_DUSK',
};

/**
 * Mandatory boundary disclaimer for official government feeds.
 * CivIQ acts as a local intake and intelligence correlation platform,
 * not a replacement for statutory road accident databases (iRAD/eDAR).
 */
export const OFFICIAL_ADAPTER_DISCLAIMER =
  'CivIQ integration adapter for official road accident records (iRAD/eDAR). ' +
  'This integration ingests official accident data to enrich municipal safety analytics and hazard awareness. ' +
  'CivIQ does not replace official statutory reporting or investigation procedures mandated by MoRTH or State Police.';
