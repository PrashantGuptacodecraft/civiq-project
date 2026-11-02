/**
 * BHASHINI Adapter Registry
 * Phase 67: Add multilingual architecture
 *
 * Dynamically selects either the live BHASHINI adapter (if valid credentials
 * exist in the environment) or defaults safely to the Mock BHASHINI Sandbox adapter.
 */

import { BhashiniAdapter } from './bhashini.adapter.js';
import { MockBhashiniAdapter } from './mock-bhashini.adapter.js';

class BhashiniRegistry {
  constructor() {
    this.mockAdapter = new MockBhashiniAdapter();
    this.liveAdapter = new BhashiniAdapter();
    this.forceMock = process.env.BHASHINI_FORCE_MOCK !== 'false';
  }

  /**
   * Returns active BHASHINI adapter instance.
   * Defaults to mock sandbox unless live credentials are provided and force mock is false.
   * @returns {import('./bhashini-adapter.interface.js').BaseBhashiniAdapter}
   */
  getAdapter() {
    if (!this.forceMock && this.liveAdapter.isConfigured()) {
      return this.liveAdapter;
    }
    return this.mockAdapter;
  }

  /**
   * Allows test suites to override or inject mock adapter.
   */
  setMockAdapter(adapter) {
    this.mockAdapter = adapter;
  }
}

export const bhashiniRegistry = new BhashiniRegistry();
export const getBhashiniAdapter = () => bhashiniRegistry.getAdapter();
