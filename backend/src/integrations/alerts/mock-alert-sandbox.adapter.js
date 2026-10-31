/**
 * Mock Disaster Alert Sandbox Adapter
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - High-fidelity mock adapter providing offline, reproducible CAP XML, CAP JSON, and RSS feeds
 * - Test harness support for signature mismatch, idempotency checks, and format variations
 */

import { BaseAlertSourceAdapter } from './alert-adapter.interface.js';
import { ALERT_FORMATS, ALERT_SOURCE_AUTHORITY } from './alert-adapter.types.js';
import {
  SACHET_PUNE_FLOOD_CAP_XML,
  IMD_PUNE_NOWCAST_CAP_XML,
  PCMC_HAZMAT_CAP_JSON,
  MAHARASHTRA_DISASTER_RSS_FEED_XML,
  SAMPLE_ALERT_SECRET_KEY,
} from './alert-fixtures.js';

export class MockAlertSandboxAdapter extends BaseAlertSourceAdapter {
  constructor(options = {}) {
    super({
      adapterId: 'mock-sandbox',
      sourceName: 'CivIQ Official Alert Sandbox',
      authority: ALERT_SOURCE_AUTHORITY.MOCK_SANDBOX,
      isLiveIntegration: false,
      feedUrl: 'mock://civiq.local/alerts/feed',
      secretKey: options.secretKey || SAMPLE_ALERT_SECRET_KEY,
      defaultFormat: ALERT_FORMATS.CAP_XML_1_2,
      ...options,
    });

    this.fixtures = [
      { payload: SACHET_PUNE_FLOOD_CAP_XML, format: ALERT_FORMATS.CAP_XML_1_2, authority: ALERT_SOURCE_AUTHORITY.SACHET_NDMA },
      { payload: IMD_PUNE_NOWCAST_CAP_XML, format: ALERT_FORMATS.CAP_XML_1_2, authority: ALERT_SOURCE_AUTHORITY.IMD },
      { payload: PCMC_HAZMAT_CAP_JSON, format: ALERT_FORMATS.CAP_JSON_1_2, authority: ALERT_SOURCE_AUTHORITY.PCMC_DISASTER_CELL },
    ];
  }

  /**
   * Fetches all registered fixtures in the sandbox.
   */
  async fetchFeed(options = {}) {
    return this.fixtures.map((f) => f.payload);
  }

  /**
   * Returns a raw RSS XML feed string for testing RSS/Atom parsers.
   */
  getRssFeedFixture() {
    return MAHARASHTRA_DISASTER_RSS_FEED_XML;
  }
}
