/**
 * Constants & Type Definitions for Authority Command Dashboard
 */

export const KPI_METRIC_KEYS = {
  OPEN: 'open',
  VERIFIED: 'verified',
  SLA_BREACHED: 'sla_breached',
  AVG_RESOLUTION: 'avg_resolution',
  REOPENED: 'reopened',
  DUPLICATE: 'duplicate',
};

export const TIME_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

export const DASHBOARD_DEPARTMENT_OPTIONS = [
  { value: 'ALL', label: 'All Departments' },
  { value: 'Public Works Department (PWD)', label: 'Roads & Infrastructure (PWD)' },
  { value: 'Electrical Department', label: 'Electrical & Streetlighting' },
  { value: 'Sewerage & Drainage Department', label: 'Sewerage & Drainage' },
  { value: 'Water Supply Department', label: 'Water Supply & Pipelines' },
  { value: 'Solid Waste Management', label: 'Solid Waste Management' },
];

export const DASHBOARD_WARD_OPTIONS = [
  { value: 'ALL', label: 'All Wards & ULBs' },
  { value: 'mh-pune-pmc', label: 'PMC Pune (All Wards)' },
  { value: 'mh-pune-pcmc', label: 'PCMC Pimpri-Chinchwad' },
  { value: 'ward-shivajinagar', label: 'PMC Ward 04 - Shivaji Nagar' },
  { value: 'ward-swargate', label: 'PMC Ward 11 - Swargate / Parvati' },
  { value: 'ward-kothrud', label: 'PMC Ward 14 - Kothrud / Karve Rd' },
  { value: 'ward-chinchwad', label: 'PCMC Ward 08 - Chinchwad Station' },
  { value: 'ward-pimpri', label: 'PCMC Ward 12 - Pimpri Market' },
  { value: 'ward-ambiguity-river', label: 'Mula-Mutha River Ambiguity Zone' },
];

export const SOURCE_LABELS = {
  PRIMARY: 'OFFICIAL_LGD_PMC_PCMC_REPLICA',
  AUDIT: 'CIVIQ_CRYPTOGRAPHIC_AUDIT_LOG_V1',
  PIPELINE: 'civiq-analytics-pipeline-v1.0.0',
};
