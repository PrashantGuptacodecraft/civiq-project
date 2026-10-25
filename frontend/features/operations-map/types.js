/**
 * Types & Constants for CivIQ Operational Map
 */

export const MAP_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REOPENED', label: 'Reopened' },
];

export const MAP_PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const MAP_DEPARTMENT_OPTIONS = [
  { value: 'ALL', label: 'All Departments' },
  { value: 'Public Works Department (PWD)', label: 'Roads & PWD' },
  { value: 'Electrical Department', label: 'Electrical & Lighting' },
  { value: 'Sewerage & Drainage Department', label: 'Sewerage & Drainage' },
  { value: 'Water Supply Department', label: 'Water Supply' },
  { value: 'Solid Waste Management', label: 'Solid Waste Management' },
];

export const MAP_VERIFICATION_OPTIONS = [
  { value: 'ALL', label: 'All Verification States' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PENDING', label: 'Pending Verification' },
  { value: 'NEEDS_EVIDENCE', label: 'Needs Evidence' },
  { value: 'SUSPICIOUS', label: 'Suspicious / Flagged' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const VIEW_MODES = {
  MAP: 'MAP',
  LIST: 'LIST',
};

export const USER_ROLES = {
  CITIZEN: 'CITIZEN',
  FIELD_SUPERVISOR: 'FIELD_SUPERVISOR',
  VERIFICATION_OFFICER: 'VERIFICATION_OFFICER',
  DISTRICT_ULB_ADMIN: 'DISTRICT_ULB_ADMIN',
};
