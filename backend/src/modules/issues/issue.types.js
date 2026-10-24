import { IssueSeverity, IssueStatus, VerificationStatus } from '@civiq/shared-db';

export interface CreateIssueDTO {
  title?;
  description;
  categoryId;
  jurisdictionId;
  latitude?;
  longitude?;
  address?;
  state?;
  district?;
  city?;
  source?;
  severity?;
  resolverVersion?;
  resolverSource?;
  isBoundaryAmbiguous?;
  manualJurisdictionConfirmed?;
}

export interface IssueSubmissionResult {
  id;
  title;
  description;
  categoryId;
  jurisdictionId;
  status;
  severity;
  verificationStatus;
  source;
  latitude;
  longitude;
  address;
  state;
  district;
  city;
  resolverVersion?;
  resolverSource?;
  isBoundaryAmbiguous?;
  manualJurisdictionConfirmed?;
  reportedById;
  version;
  createdAt;
  updatedAt;
}