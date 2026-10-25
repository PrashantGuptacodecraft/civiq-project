/**
 * Asynchronous Operational Report Generation Background Worker Job
 * Phase 48: Add Operational Reports and Exports
 */

import { reportService } from '../../modules/reports/report.service.js';
import { JOB_STATUSES } from '../../modules/reports/report.types.js';

/**
 * Background worker task to execute asynchronous report generation.
 */
export async function processReportGenerationJob(jobId, mockUser = null) {
  const job = reportService.jobs.get(jobId);
  if (!job) {
    throw new Error(`Report generation job '${jobId}' does not exist.`);
  }

  try {
    job.status = JOB_STATUSES.PROCESSING;
    job.progress = 25;

    const user = mockUser || {
      id: job.requestedBy,
      role: job.userRole,
      jurisdictionId: job.filters.jurisdictionId,
    };

    job.progress = 50;
    const result = await reportService.executeReportGeneration(
      job.reportType,
      job.format,
      job.filters,
      user
    );

    job.progress = 100;
    job.status = JOB_STATUSES.COMPLETED;
    job.completedAt = new Date().toISOString();
    job.recordCount = result.recordCount;
    job.fileName = result.fileName;
    job.mimeType = result.mimeType;
    job.fileContent = result.fileContent;

    return job;
  } catch (err) {
    job.status = JOB_STATUSES.FAILED;
    job.error = err.message || 'Report generation failed.';
    job.completedAt = new Date().toISOString();
    throw err;
  }
}
