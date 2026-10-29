/**
 * Incident Adapter Registry
 * Phase 58: Add official-source incident adapter contract
 *
 * Manages incident source adapters. Defaults to mock/sandbox adapter for college deployment.
 */

import { mockSandboxIncidentAdapter, MockSandboxIncidentAdapter } from './mock-sandbox.adapter.js';
import { iradOfficialAdapter, IradOfficialAdapter } from './irad-adapter.js';
import { OFFICIAL_SOURCES } from './incident-adapter.types.js';

export class IncidentAdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.init();
  }

  init() {
    this.adapters.clear();

    // Default to mock/sandbox adapter for college deployment
    this.registerAdapter(OFFICIAL_SOURCES.MOCK_SANDBOX, mockSandboxIncidentAdapter);
    this.registerAdapter('mock', mockSandboxIncidentAdapter);
    this.registerAdapter('sandbox', mockSandboxIncidentAdapter);

    // Official iRAD adapter (inactive/sandbox unless real credentials provided)
    this.registerAdapter(OFFICIAL_SOURCES.IRAD, iradOfficialAdapter);
    this.registerAdapter('irad', iradOfficialAdapter);
  }

  /**
   * Registers an adapter instance under a name.
   */
  registerAdapter(name, adapter) {
    if (!name || typeof name !== 'string') {
      throw new Error('Adapter name must be a non-empty string.');
    }
    if (!adapter || typeof adapter.sync !== 'function' || typeof adapter.normalizeRecord !== 'function') {
      throw new Error('Adapter must implement BaseIncidentSourceAdapter contract.');
    }
    this.adapters.set(name.toLowerCase(), adapter);
  }

  /**
   * Retrieves an adapter by name, defaulting to mock-sandbox if omitted or unknown.
   */
  getAdapter(name) {
    if (!name) {
      return this.getDefaultAdapter();
    }
    return this.adapters.get(name.toLowerCase()) || this.getDefaultAdapter();
  }

  /**
   * Returns the default adapter (Mock/Sandbox).
   */
  getDefaultAdapter() {
    return this.adapters.get(OFFICIAL_SOURCES.MOCK_SANDBOX.toLowerCase()) || mockSandboxIncidentAdapter;
  }

  /**
   * Lists all registered adapters and their operational status.
   */
  listAdapters() {
    const list = [];
    const seen = new Set();

    for (const [key, adapter] of this.adapters.entries()) {
      if (seen.has(adapter)) continue;
      seen.add(adapter);

      list.push({
        sourceName: adapter.sourceName,
        sourceType: adapter.sourceType,
        isLiveIntegration: adapter.isLiveIntegration,
        isMockOrSandbox: adapter.isMockOrSandbox,
        dataAuthority: adapter.dataAuthority,
        isDefault: adapter.sourceName === OFFICIAL_SOURCES.MOCK_SANDBOX,
      });
    }

    return list;
  }
}

export const incidentAdapterRegistry = new IncidentAdapterRegistry();
