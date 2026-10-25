/**
 * Phase 48 Exit Checks: Report Generator Background Job Tests
 */

import { describe, it, expect } from 'vitest';
import { reportService } from '../../modules/reports/report.service.js';
import { REPORT_TYPES, REPORT_FORMATS, JOB_STATUSES } from '../../modules/reports/report.types.js';
import { processReportGenerationJob } from './report-generator.job.js';

describe('Phase 48: Background Report Generator Worker Job', () => {
  it('processes an asynchronous report generation job to completion', async () => {
    const mockUser = {
      id: 'usr-admin-test',
      role: 'DISTRICT_ULB_ADMIN',
      jurisdictionId: 'mh-pune-pmc',
    };

    const job = reportService.createReportJob(
      REPORT_TYPES.ISSUES_LIST,
      REPORT_FORMATS.CSV,
      { jurisdictionId: 'mh-pune-pmc' },
      mockUser
    );

    expect(job.status).toBe(JOB_STATUSES.PENDING);
    expect(job.progress).toBe(0);

    // Process job using worker function
    const completedJob = await processReportGenerationJob(job.jobId, mockUser);

    expect(completedJob.status).toBe(JOB_STATUSES.COMPLETED);
    expect(completedJob.progress).toBe(100);
    expect(completedJob.fileContent).toBeDefined();
    expect(completedJob.mimeType).toBe('text/csv');
    expect(completedJob.recordCount).toBeGreaterThan(0);
    expect(completedJob.completedAt).toBeDefined();
  });

  it('throws error when job id does not exist', async () => {
    await expect(processReportGenerationJob('non-existent-job-id')).rejects.toThrow(
      'does not exist'
    );
  });
});
