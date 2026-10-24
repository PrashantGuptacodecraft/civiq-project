export interface ReportFormValues {
  title;
  description;
  categoryId;
  jurisdictionId;
  address;
  state;
  district;
  city;
  latitude;
  longitude;
  source;
  resolverVersion?;
  resolverSource?;
  isBoundaryAmbiguous?;
  manualJurisdictionConfirmed?;
  files;
}

export interface SubmittedIssue {
  id;
  title;
  description;
  categoryId;
  jurisdictionId;
  status;
  verificationStatus;
  severity;
  slaDays;
  department;
  address;
  createdAt;
}