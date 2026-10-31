/**
 * Disaster Alert Adapter Registry
 * Phase 62: Build official alert ingestion adapter
 *
 * Implements:
 * - Central registry for statutory alert adapters (SACHET, IMD, PCMC, Sandbox)
 * - Lookup, registration, and discovery of official alerting feeds
 */

import { SachetCapAdapter } from './sachet-adapter.js';
import { ImdWeatherBulletinAdapter } from './imd-adapter.js';
import { MockAlertSandboxAdapter } from './mock-alert-sandbox.adapter.js';

export class AlertAdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.initDefaultAdapters();
  }

  /**
   * Initializes standard baseline adapters.
   */
  initDefaultAdapters() {
    this.adapters.clear();

    const sachet = new SachetCapAdapter();
    const imd = new ImdWeatherBulletinAdapter();
    const sandbox = new MockAlertSandboxAdapter();

    this.registerAdapter(sachet);
    this.registerAdapter(imd);
    this.registerAdapter(sandbox);
  }

  /**
   * Registers an alert source adapter.
   */
  registerAdapter(adapter) {
    if (!adapter || !adapter.adapterId) {
      throw new Error('Adapter must have a valid "adapterId".');
    }
    this.adapters.set(adapter.adapterId, adapter);
  }

  /**
   * Retrieves an adapter by its ID.
   */
  getAdapter(adapterId) {
    return this.adapters.get(adapterId) || null;
  }

  /**
   * Lists metadata for all registered adapters.
   */
  listAdapters() {
    return Array.from(this.adapters.values()).map((a) => ({
      adapterId: a.adapterId,
      sourceName: a.sourceName,
      authority: a.authority,
      isLiveIntegration: a.isLiveIntegration,
      feedUrl: a.feedUrl,
      defaultFormat: a.defaultFormat,
      hasSecretKey: Boolean(a.secretKey),
    }));
  }
}

export const alertAdapterRegistry = new AlertAdapterRegistry();
