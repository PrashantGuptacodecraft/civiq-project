/**
 * Phase 62 Exit Checks: Alert Poller Background Job Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runAlertPollerJob } from './alert-poller.job.js';
import { alertIngestionService } from '../../integrations/alerts/alert-ingestion.service.js';

describe('Phase 62: Background Disaster Alert Poller Job', () => {
  beforeEach(() => {
    alertIngestionService.reset();
  });

  it('executes automated feed polling cycle across registered disaster alerting adapters', async () => {
    const outcome = await runAlertPollerJob();

    expect(outcome.success).toBe(true);
    expect(outcome.jobType).toBe('ALERT_FEED_POLLER');
    expect(outcome.polledAdaptersCount).toBeGreaterThanOrEqual(3);
    expect(outcome.totalIngested).toBeGreaterThanOrEqual(2);
    expect(outcome.completedAt).toBeDefined();
    expect(outcome.statutoryNotice).toBeDefined();

    const storedAlerts = await alertIngestionService.listAlerts();
    expect(storedAlerts.length).toBe(outcome.totalIngested);
  });

  it('runs idempotently when poller job is triggered consecutively', async () => {
    // Run 1: Ingests all available feed items across adapters
    // (Note: Sandbox contains overlapping fixtures with SACHET and IMD which are deduplicated)
    const firstRun = await runAlertPollerJob();
    expect(firstRun.totalIngested).toBeGreaterThanOrEqual(2);
    expect(firstRun.totalDuplicates).toBeGreaterThanOrEqual(1);

    const initialStoredCount = (await alertIngestionService.listAlerts()).length;

    // Run 2: Immediately polls again without changing feeds
    const secondRun = await runAlertPollerJob();
    expect(secondRun.success).toBe(true);
    expect(secondRun.totalIngested).toBe(0); // All items were already ingested
    expect(secondRun.totalDuplicates).toBeGreaterThanOrEqual(firstRun.totalIngested);

    // Ensure no additional alerts were inserted into store
    const finalStoredCount = (await alertIngestionService.listAlerts()).length;
    expect(finalStoredCount).toBe(initialStoredCount);
  });

  it('filters polling by specific adapterId when requested', async () => {
    const outcome = await runAlertPollerJob({ adapterIds: ['sachet-ndma'] });

    expect(outcome.success).toBe(true);
    expect(outcome.polledAdaptersCount).toBe(1);
    expect(outcome.results[0].adapterId).toBe('sachet-ndma');
  });
});
