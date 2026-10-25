/**
 * Phase 48 Exit Checks: Operational Reports & Exports Tests
 * Validates export authorization, jurisdiction scoping, strict PII redaction,
 * CSV/JSON formatting, and asynchronous job processing.
 */

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { reportRouter } from './report.router.js';
import { reportService } from './report.service.js';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REDACTION_NOTICE,
} from './report.types.js';
import {
  redactIssueForExport,
  toCsvString,
} from './report.redaction.js';
import { processReportGenerationJob } from '../../jobs/reports/report-generator.job.js';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Phase 48: Operational Reports and Exports Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/reports', reportRouter);

  describe('1. Export Authorization Enforcement', () => {
    it('returns 401 when Authorization token is missing', async () => {
      const res = await request(app).post('/reports/export').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Authentication required');
    });

    it('returns 403 when user has unauthorized role (CITIZEN)', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'CITIZEN')
        .set('x-user-id', 'usr-cit-1')
        .send({ reportType: REPORT_TYPES.ISSUES_LIST });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('denied');
    });

    it('returns 403 when user has unauthorized role (FIELD_WORKER)', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'FIELD_WORKER')
        .send({ reportType: REPORT_TYPES.ISSUES_LIST });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows access for authorized roles (DISTRICT_ULB_ADMIN)', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          reportType: REPORT_TYPES.ISSUES_LIST,
          format: REPORT_FORMATS.JSON,
          filters: { jurisdictionId: 'mh-pune-pmc' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toBeDefined();
    });

    it('allows access for AUDITOR role', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'AUDITOR')
        .send({
          reportType: REPORT_TYPES.AUDIT_SUMMARY,
          format: REPORT_FORMATS.JSON,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('denies cross-jurisdiction export when user is assigned to a different jurisdiction', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .set('x-user-jurisdiction', 'mh-pune-pmc')
        .send({
          reportType: REPORT_TYPES.ISSUES_LIST,
          filters: { jurisdictionId: 'mh-mumbai-mcgm' }, // Cross-jurisdiction attempt
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Cross-jurisdiction export denied');
    });
  });

  describe('2. PII Redaction Rules and Data Protection', () => {
    it('redacts citizen phone, email, and identity from issue exports', () => {
      const sensitiveIssue = {
        id: 'iss-sens-01',
        title: 'Call 9876543210 regarding garbage at FC Road',
        description: 'Citizen contact: john.doe@example.com, Aadhaar 2345 6789 0123',
        address: 'House 4, FC Road, Pune',
        reportedById: 'usr-sensitive-cit',
        categoryId: 'sanitation_garbage_dump',
        severity: 'MEDIUM',
        status: 'SUBMITTED',
      };

      const redacted = redactIssueForExport(sensitiveIssue);

      expect(redacted.reportedBy).toBe('[REDACTED_CITIZEN_PII]');
      expect(redacted.title).not.toContain('9876543210');
      expect(redacted.title).toContain('[REDACTED_PHONE]');
      expect(redacted.description).not.toContain('john.doe@example.com');
      expect(redacted.description).toContain('[REDACTED_EMAIL]');
      expect(redacted.description).not.toContain('2345 6789 0123');
      expect(redacted.description).toContain('[REDACTED_AADHAAR]');
    });

    it('includes mandatory redaction notice in report envelope', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DEPARTMENT_OFFICER')
        .send({
          reportType: REPORT_TYPES.ISSUES_LIST,
          format: REPORT_FORMATS.JSON,
        });

      expect(res.status).toBe(200);
      expect(res.body.report.disclaimer).toBe(REDACTION_NOTICE);
    });
  });

  describe('3. CSV and JSON Format Correctness', () => {
    it('formats RFC-4180 compliant CSV string with escaped commas and quotes', () => {
      const headers = ['ID', 'Title', 'Address'];
      const rows = [
        ['1', 'Pothole on FC Road', 'Near Cafe, FC Road'],
        ['2', 'Streetlight "out" at junction', 'Main Lane'],
      ];

      const csv = toCsvString(headers, rows);
      expect(csv).toContain('ID,Title,Address');
      expect(csv).toContain('"Near Cafe, FC Road"');
      expect(csv).toContain('"Streetlight ""out"" at junction"');
    });

    it('generates valid CSV export with headers and rows', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .send({
          reportType: REPORT_TYPES.ISSUES_LIST,
          format: REPORT_FORMATS.CSV,
        });

      expect(res.status).toBe(200);
      expect(res.body.report.mimeType).toBe('text/csv');
      expect(res.body.report.fileName).toContain('.csv');
      expect(res.body.report.fileContent).toContain('ID,Title,Description');
    });

    it('generates SLA Performance Report with compliance metrics', async () => {
      const res = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .send({
          reportType: REPORT_TYPES.SLA_PERFORMANCE,
          format: REPORT_FORMATS.JSON,
        });

      expect(res.status).toBe(200);
      expect(res.body.report.envelope.departments).toBeInstanceOf(Array);
      expect(res.body.report.envelope.departments.length).toBeGreaterThan(0);
      const firstDept = res.body.report.envelope.departments[0];
      expect(firstDept.department).toBeDefined();
      expect(firstDept.complianceRatePercent).toBeDefined();
    });
  });

  describe('4. Asynchronous Report Generation & Download Lifecycle', () => {
    it('dispatches async report, tracks job status, and downloads completed file', async () => {
      // 1. Dispatch async export
      const dispatchRes = await request(app)
        .post('/reports/export')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN')
        .send({
          reportType: REPORT_TYPES.ISSUES_LIST,
          format: REPORT_FORMATS.CSV,
          async: true,
        });

      expect(dispatchRes.status).toBe(202);
      expect(dispatchRes.body.success).toBe(true);
      expect(dispatchRes.body.isAsync).toBe(true);
      expect(dispatchRes.body.jobId).toBeDefined();

      const { jobId } = dispatchRes.body;

      // 2. Poll job status
      const statusRes = await request(app)
        .get(`/reports/jobs/${jobId}`)
        .set('x-user-role', 'DISTRICT_ULB_ADMIN');

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.job.jobId).toBe(jobId);

      // 3. Process job with background worker
      await processReportGenerationJob(jobId, {
        id: 'usr-admin',
        role: 'DISTRICT_ULB_ADMIN',
        jurisdictionId: 'mh-pune-pmc',
      });

      // 4. Verify completed status
      const completedStatusRes = await request(app)
        .get(`/reports/jobs/${jobId}`)
        .set('x-user-role', 'DISTRICT_ULB_ADMIN');

      expect(completedStatusRes.body.job.status).toBe('COMPLETED');
      expect(completedStatusRes.body.job.progress).toBe(100);

      // 5. Download generated file
      const downloadRes = await request(app)
        .get(`/reports/download/${jobId}`)
        .set('x-user-role', 'DISTRICT_ULB_ADMIN');

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['content-type']).toContain('text/csv');
      expect(downloadRes.headers['content-disposition']).toContain('attachment; filename=');
      expect(downloadRes.text).toContain('ID,Title,Description');
    });

    it('returns 404 when downloading non-existent job', async () => {
      const res = await request(app)
        .get('/reports/download/non-existent-job')
        .set('x-user-role', 'DISTRICT_ULB_ADMIN');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /reports/types returns catalog of report types and formats', async () => {
      const res = await request(app).get('/reports/types');
      expect(res.status).toBe(200);
      expect(res.body.reportTypes).toContain('ISSUES_LIST');
      expect(res.body.reportTypes).toContain('SLA_PERFORMANCE');
      expect(res.body.reportTypes).toContain('AUDIT_SUMMARY');
      expect(res.body.formats).toContain('CSV');
      expect(res.body.formats).toContain('JSON');
    });
  });
});
