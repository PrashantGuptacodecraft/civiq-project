export const CURRENT_RESOLVER_VERSION = 'geo-resolver-v1.0.0';
export const CURRENT_RESOLVER_SOURCE = 'OFFICIAL_LGD_POLYGONS_2026';
export const DEFAULT_AMBIGUITY_BUFFER_METERS = 75;

| 'WARD_VILLAGE';

export interface GeoPoint {
  latitude;
  longitude;
}

export interface BoundingBox {
  minLat;
  maxLat;
  minLng;
  maxLng;
}

export interface JurisdictionHierarchyNode {
  id;
  name;
  type;
  lgdCode?;
}

export interface JurisdictionCandidate {
  id;
  name;
  type;
  lgdCode?;
  confidence;
  distanceToBoundaryMeters?;
  isContestedOrAdjacent?;
}

export interface JurisdictionResolutionResult {
  matchedJurisdiction: {
    id;
    name;
    type;
    lgdCode?;
    hierarchyPath;
  } | null;
  resolverVersion;
  resolverSource;
  confidence;
  isAmbiguous;
  ambiguityReason?;
  candidateJurisdictions;
  requiresManualConfirmation;
  point;
  resolvedAt;
}

export interface ManualCorrectionPayload {
  issueId?;
  point;
  originalJurisdictionId?;
  selectedJurisdictionId;
  reason?;
  userId?;
}

export interface ManualCorrectionResult {
  success;
  issueId?;
  jurisdictionId;
  jurisdictionName;
  resolverVersion;
  resolverSource;
  manualJurisdictionConfirmed;
  recordedAt;
}

export interface JurisdictionBoundaryFixture {
  id;
  name;
  type;
  lgdCode;
  parentId?;
  bbox;
  coordinates;
}