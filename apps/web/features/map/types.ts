import {
  GeoPoint,
  JurisdictionCandidate,
  JurisdictionHierarchyNode,
  JurisdictionLevel,
  JurisdictionResolutionResult,
} from '@civiq/contracts';

export type {
  GeoPoint,
  JurisdictionCandidate,
  JurisdictionHierarchyNode,
  JurisdictionLevel,
  JurisdictionResolutionResult,
};

export interface MapPointPickerValue {
  latitude: number | null;
  longitude: number | null;
  jurisdictionId: string;
  jurisdictionName?: string;
  state?: string;
  district?: string;
  city?: string;
  resolverVersion?: string;
  resolverSource?: string;
  isBoundaryAmbiguous?: boolean;
  manualJurisdictionConfirmed?: boolean;
  ambiguityReason?: string | null;
}

export interface MapPointPickerProps {
  value: MapPointPickerValue;
  onChange: (val: Partial<MapPointPickerValue>) => void;
  error?: string;
  disabled?: boolean;
}
