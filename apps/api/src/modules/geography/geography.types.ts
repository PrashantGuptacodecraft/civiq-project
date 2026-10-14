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
} from '@civiq/contracts';

export type {
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
};

export interface ResolvePointOptions {
  ambiguityBufferMeters?: number | undefined;
  includeCandidates?: boolean | undefined;
}

export interface BoundaryRecord {
  id: string;
  jurisdictionId: string;
  boundaryType: string;
  coordinates: PolygonCoordinates;
  bbox: BoundingBox;
  source: string;
  version: string;
  bufferMeters: number;
}
