/**
 * Speech Adapter Registry
 * Phase 68: Add voice reporting
 *
 * Automatically provides the configured ASR provider, defaulting safely to Mock Sandbox.
 */

import { MockSpeechAdapter } from './mock-speech.adapter.js';
import { BhashiniSpeechAdapter } from './bhashini-speech.adapter.js';

class SpeechRegistry {
  constructor() {
    this.mockAdapter = new MockSpeechAdapter();
    this.bhashiniAdapter = new BhashiniSpeechAdapter();
    this.forceMock = process.env.SPEECH_FORCE_MOCK !== 'false';
  }

  getAdapter() {
    if (!this.forceMock && this.bhashiniAdapter.isConfigured()) {
      return this.bhashiniAdapter;
    }
    return this.mockAdapter;
  }

  setMockAdapter(adapter) {
    this.mockAdapter = adapter;
  }
}

export const speechRegistry = new SpeechRegistry();
export const getSpeechAdapter = () => speechRegistry.getAdapter();
