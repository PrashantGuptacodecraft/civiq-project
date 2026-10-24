import {
  GeoPoint,
  JurisdictionCandidate,
  JurisdictionHierarchyNode,
  JurisdictionLevel,
  JurisdictionResolutionResult,
} from '@civiq/shared-contracts';

export interface MapPointPickerValue {
  latitude;
  longitude;
  jurisdictionId;
  jurisdictionName?;
  state?;
  district?;
  city?;
  resolverVersion?;
  resolverSource?;
  isBoundaryAmbiguous?;
  manualJurisdictionConfirmed?;
  ambiguityReason?;
}

export interface MapPointPickerProps {
  value;
  onChange: (val) => void;
  error?;
  disabled?;
}