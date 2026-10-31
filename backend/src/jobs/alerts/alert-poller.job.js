/**
 * Disaster Alert Poller Background Worker Job
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - Periodic and on-demand polling of official alerting feeds (SACHET CAP, IMD Weather)
 * - Safe error handling and statutory notice logging
 */

import { alertIngestionService } from '../../integrations/alerts/alert-ingestion.service.js';

/**
 * Executes a poll cycle across registered disaster alerting adapters.
 * @param {Object} options - Options { adapterIds, logger }
 * @returns {Promise<Object>} Polling execution summary
 */
export async function runAlertPollerJob(options = {}) {
  const startedAt = new Date().toISOString();

  try {
    const outcome = await alertIngestionService.pollAdapters(options.adapterIds || []);
    const completedAt = new Date().toISOString();

    return {
      success: true,
      jobType: 'ALERT_FEED_POLLER',
      startedAt,
      completedAt,
      polledAdaptersCount: outcome.polledAdaptersCount,
      totalIngested: outcome.totalIngested,
      totalDuplicates: outcome.totalDuplicates,
      results: outcome.results,
      statutoryNotice: outcome.statutoryNotice,
    };
  } catch (err) {
    return {
      success: false,
      jobType: 'ALERT_FEED_POLLER',
      startedAt,
      completedAt: new Date().toISOString(),
      error: err.message,
    };
  }
}
