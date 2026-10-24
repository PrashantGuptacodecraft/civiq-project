import {
  BoundingBox,
  GeoPoint,
  JurisdictionBoundaryFixture,
  JurisdictionCandidate,
  JurisdictionHierarchyNode,
  JurisdictionLevel,
  JurisdictionResolutionResult,
  ManualCorrectionPayload,
  ManualCorrectionResult,
  PolygonCoordinates,
} from '@civiq/shared-contracts';

export interface ResolvePointOptions {
  ambiguityBufferMeters?;
  includeCandidates?;
}

export interface BoundaryRecord {
  id;
  jurisdictionId;
  boundaryType;
  coordinates;
  bbox;
  source;
  version;
  bufferMeters;
}