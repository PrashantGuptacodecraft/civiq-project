import { IssueSeverity, IssueStatus, VerificationStatus } from '@civiq/db';

export interface CreateIssueDTO {
  title?: string;
  description: string;
  categoryId: string;
  jurisdictionId: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  state?: string;
  district?: string;
  city?: string;
  source?: string;
  severity?: IssueSeverity;
  resolverVersion?: string;
  resolverSource?: string;
  isBoundaryAmbiguous?: boolean;
  manualJurisdictionConfirmed?: boolean;
}

export interface IssueSubmissionResult {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  jurisdictionId: string | null;
  status: IssueStatus;
  severity: IssueSeverity;
  verificationStatus: VerificationStatus;
  source: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  resolverVersion?: string | null;
  resolverSource?: string | null;
  isBoundaryAmbiguous?: boolean;
  manualJurisdictionConfirmed?: boolean;
  reportedById: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
