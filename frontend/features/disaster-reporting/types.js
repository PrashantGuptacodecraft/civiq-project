/**
 * Disaster Impact Reporting Frontend Types & Constants
 * Phase 63: Build disaster impact reporting
 */

export const IMPACT_TYPES = Object.freeze({
  FLOODING_WATERLOGGING: 'FLOODING_WATERLOGGING',
  BLOCKED_ROAD_DEBRIS: 'BLOCKED_ROAD_DEBRIS',
  UTILITY_OUTAGE: 'UTILITY_OUTAGE',
  STRANDED_PERSONS_RESCUE_NEEDED: 'STRANDED_PERSONS_RESCUE_NEEDED',
  STRUCTURAL_INFRASTRUCTURE_DAMAGE: 'STRUCTURAL_INFRASTRUCTURE_DAMAGE',
  URGENT_RELIEF_NEEDS: 'URGENT_RELIEF_NEEDS',
});

export const IMPACT_TYPE_LABELS = Object.freeze({
  [IMPACT_TYPES.FLOODING_WATERLOGGING]: 'Urban Flooding & Inundation',
  [IMPACT_TYPES.BLOCKED_ROAD_DEBRIS]: 'Blocked Road / Landslide Debris',
  [IMPACT_TYPES.UTILITY_OUTAGE]: 'Power & Utility Outage',
  [IMPACT_TYPES.STRANDED_PERSONS_RESCUE_NEEDED]: 'Stranded People / Rescue Needed',
  [IMPACT_TYPES.STRUCTURAL_INFRASTRUCTURE_DAMAGE]: 'Structural & Building Damage',
  [IMPACT_TYPES.URGENT_RELIEF_NEEDS]: 'Urgent Relief Supplies Needed',
});

export const IMPACT_SEVERITY = Object.freeze({
  CRITICAL_LIFE_SAFETY: 'CRITICAL_LIFE_SAFETY',
  HIGH_URGENT: 'HIGH_URGENT',
  MEDIUM_OPERATIONAL: 'MEDIUM_OPERATIONAL',
  LOW_ADVISORY: 'LOW_ADVISORY',
});

export const IMPACT_STATUS = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  FIELD_TRIAGED: 'FIELD_TRIAGED',
  RESPONDER_DISPATCHED: 'RESPONDER_DISPATCHED',
  RESOLVED: 'RESOLVED',
  REJECTED_FALSE_ALARM: 'REJECTED_FALSE_ALARM',
});

export const RELIEF_NEEDS_OPTIONS = [
  { id: 'DRINKING_WATER', label: 'Drinking Water' },
  { id: 'FOOD_RATIONS', label: 'Dry Food / Rations' },
  { id: 'MEDICAL_AID', label: 'Emergency First Aid / Medicines' },
  { id: 'BOAT_EVACUATION', label: 'Rescue Boat / Floatation' },
  { id: 'TARPAULIN_SHELTER', label: 'Tarpaulin / Waterproof Cover' },
];

export const DISASTER_IMPACT_DISCLAIMER =
  'CivIQ Disaster Impact Reporting Notice: Reports submitted here enter the civic coordination system ' +
  'with an initial UNVERIFIED status for immediate municipal awareness. ' +
  'CivIQ is not an official emergency dispatch service. ' +
  'For active life-threatening emergencies, stranded persons, fire, or acute medical distress, ' +
  'immediately contact 112 (National Emergency), 101 (Fire), or 108 (Ambulance).';
