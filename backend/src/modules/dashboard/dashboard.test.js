import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { dashboardRouter } from './dashboard.router.js';
import { dashboardService, DATA_SOURCE_LABEL, PIPELINE_VERSION } from './dashboard.service.js';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
  },
}));

describe('Phase 45: Authority Command Dashboard Backend & KPI Engine', () => {
  const app = express();
  app.use(express.json());
  app.use('/dashboard', dashboardRouter);

  const mockDateNow = new Date('2026-10-25T12:00:00Z');

  const mockSampleIssues = [
    // 1. Open Pothole (PWD) - 2 days old (SLA is 7 days, so not breached)
    {
      id: 'iss-1',
      title: 'Pothole on FC Road',
      status: 'SUBMITTED',
      severity: 'MEDIUM',
      verificationStatus: 'VERIFIED',
      categoryId: 'roads_pothole',
      jurisdictionId: 'mh-pune-pmc',
      jurisdiction: { id: 'mh-pune-pmc', name: 'PMC Pune' },
      createdAt: new Date('2026-10-23T12:00:00Z'),
      updatedAt: new Date('2026-10-23T12:00:00Z'),
    },
    // 2. Open Manhole (Sewerage) - 3 days old (SLA is 1 day, so BREACHED)
    {
      id: 'iss-2',
      title: 'Open Manhole at Swargate',
      status: 'IN_PROGRESS',
      severity: 'CRITICAL',
      verificationStatus: 'VERIFIED',
      categoryId: 'sanitation_open_manhole',
      jurisdictionId: 'mh-pune-pmc',
      jurisdiction: { id: 'mh-pune-pmc', name: 'PMC Pune' },
      createdAt: new Date('2026-10-22T12:00:00Z'),
      updatedAt: new Date('2026-10-22T12:00:00Z'),
    },
    // 3. Resolved Pipeline Leak (Water Supply) - Took 12 hours to resolve (SLA is 2 days)
    {
      id: 'iss-3',
      title: 'Pipeline Leak in Chinchwad',
      status: 'RESOLVED',
      severity: 'HIGH',
      verificationStatus: 'VERIFIED',
      categoryId: 'water_pipeline_leak',
      jurisdictionId: 'mh-pune-pcmc',
      jurisdiction: { id: 'mh-pune-pcmc', name: 'PCMC Pimpri' },
      createdAt: new Date('2026-10-24T00:00:00Z'),
      updatedAt: new Date('2026-10-24T12:00:00Z'), // 12 hours resolution
    },
    // 4. Reopened Drainage Issue (Sewerage)
    {
      id: 'iss-4',
      title: 'Blocked Drain at Kasba Peth',
      status: 'REOPENED',
      severity: 'HIGH',
      verificationStatus: 'IN_REVIEW',
      categoryId: 'sanitation_blocked_drain',
      jurisdictionId: 'mh-pune-pmc',
      jurisdiction: { id: 'mh-pune-pmc', name: 'PMC Pune' },
      createdAt: new Date('2026-10-20T12:00:00Z'),
      updatedAt: new Date('2026-10-24T12:00:00Z'),
    },
    // 5. Duplicate Streetlight Issue (Electrical)
    {
      id: 'iss-5',
      title: 'Dark streetlight pole 12',
      status: 'CLOSED',
      severity: 'LOW',
      verificationStatus: 'DUPLICATE',
      categoryId: 'roads_streetlighting',
      jurisdictionId: 'mh-pune-pcmc',
      jurisdiction: { id: 'mh-pune-pcmc', name: 'PCMC Pimpri' },
      createdAt: new Date('2026-10-24T12:00:00Z'),
      updatedAt: new Date('2026-10-24T13:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.issue.findMany).mockResolvedValue([...mockSampleIssues]);
  });

  describe('Core KPI Calculation Engine', () => {
    it('correctly calculates the 6 core authority command KPIs', async () => {
      const result = await dashboardService.getCommandKpis();

      const { kpis } = result;
      expect(kpis.totalIssues).toBe(5);

      // 1. Open Issues: iss-1 (SUBMITTED), iss-2 (IN_PROGRESS), iss-4 (REOPENED) = 3 open
      expect(kpis.openCount).toBe(3);
      expect(kpis.openRate).toBe(60.0);

      // 2. Verified Issues: iss-1, iss-2, iss-3 = 3 verified
      expect(kpis.verifiedCount).toBe(3);
      expect(kpis.verificationRate).toBe(60.0);

      // 3. SLA Breached: iss-2 (open manhole created 3 days ago with 1 day SLA) + iss-4 (created 5 days ago)
      expect(kpis.slaBreachedCount).toBeGreaterThanOrEqual(1);

      // 4. Average Resolution Time: iss-3 was resolved in 12 hours
      expect(kpis.averageResolutionHours).toBeGreaterThan(0);

      // 5. Reopened Rate: iss-4 is REOPENED
      expect(kpis.reopenedCount).toBe(1);
      expect(kpis.reopenRate).toBeGreaterThan(0);

      // 6. Duplicate Rate: iss-5 is DUPLICATE
      expect(kpis.duplicateCount).toBe(1);
      expect(kpis.duplicateRate).toBe(20.0);
    });

    it('returns source labeling and data freshness metadata', async () => {
      const result = await dashboardService.getCommandKpis();

      expect(result.metadata.sourceLabel).toBe(DATA_SOURCE_LABEL);
      expect(result.metadata.pipelineVersion).toBe(PIPELINE_VERSION);
      expect(result.metadata.dataFreshness).toBeDefined();
    });
  });

  describe('Department & Ward Filters and Breakdown', () => {
    it('filters metrics by specific department', async () => {
      const result = await dashboardService.getCommandKpis({ department: 'Sewerage' });

      // Only iss-2 and iss-4 are Sewerage & Drainage
      expect(result.kpis.totalIssues).toBe(2);
      expect(result.drillDownIssues.every((i) => i.department.includes('Sewerage'))).toBe(true);
    });

    it('aggregates breakdown by department and ward correctly', async () => {
      const result = await dashboardService.getCommandKpis();

      expect(result.byDepartment.length).toBeGreaterThanOrEqual(3);
      expect(result.byWard.length).toBeGreaterThanOrEqual(2);

      const pmcWard = result.byWard.find((w) => w.jurisdictionId === 'mh-pune-pmc');
      expect(pmcWard).toBeDefined();
      expect(pmcWard.totalIssues).toBe(3);
    });
  });

  describe('REST API Endpoint (GET /dashboard/kpis)', () => {
    it('serves dashboard KPIs over HTTP with 200 OK', async () => {
      const res = await request(app).get('/dashboard/kpis?department=Sewerage');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.metadata.sourceLabel).toBe(DATA_SOURCE_LABEL);
      expect(res.body.data.metadata.activeFilters.department).toBe('Sewerage');
    });
  });
});
