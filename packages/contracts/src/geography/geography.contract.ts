export const CURRENT_RESOLVER_VERSION = 'geo-resolver-v1.0.0';
export const CURRENT_RESOLVER_SOURCE = 'OFFICIAL_LGD_POLYGONS_2026';
export const DEFAULT_AMBIGUITY_BUFFER_METERS = 75;

export type JurisdictionLevel =
  | 'COUNTRY'
  | 'STATE_UT'
  | 'DISTRICT'
  | 'LOCAL_BODY'
  | 'BLOCK'
  | 'WARD_VILLAGE';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export type CoordinatePair = [longitude: number, latitude: number];
export type PolygonRing = CoordinatePair[];
export type PolygonCoordinates = PolygonRing[];

export interface JurisdictionHierarchyNode {
  id: string;
  name: string;
  type: JurisdictionLevel;
  lgdCode?: string | null;
}

export interface JurisdictionCandidate {
  id: string;
  name: string;
  type: JurisdictionLevel;
  lgdCode?: string | null;
  confidence: number;
  distanceToBoundaryMeters?: number;
  isContestedOrAdjacent?: boolean;
}

export interface JurisdictionResolutionResult {
  matchedJurisdiction: {
    id: string;
    name: string;
    type: JurisdictionLevel;
    lgdCode?: string | null;
    hierarchyPath: JurisdictionHierarchyNode[];
  } | null;
  resolverVersion: string;
  resolverSource: string;
  confidence: number;
  isAmbiguous: boolean;
  ambiguityReason?: string | null;
  candidateJurisdictions: JurisdictionCandidate[];
  requiresManualConfirmation: boolean;
  point: GeoPoint;
  resolvedAt: string;
}

export interface ManualCorrectionPayload {
  issueId?: string | undefined;
  point: GeoPoint;
  originalJurisdictionId?: string | undefined;
  selectedJurisdictionId: string;
  reason?: string | undefined;
  userId?: string | undefined;
}

export interface ManualCorrectionResult {
  success: boolean;
  issueId?: string | undefined;
  jurisdictionId: string;
  jurisdictionName: string;
  resolverVersion: string;
  resolverSource: string;
  manualJurisdictionConfirmed: boolean;
  recordedAt: string;
}

export interface JurisdictionBoundaryFixture {
  id: string;
  name: string;
  type: JurisdictionLevel;
  lgdCode: string;
  parentId?: string;
  bbox: BoundingBox;
  coordinates: PolygonCoordinates;
}
