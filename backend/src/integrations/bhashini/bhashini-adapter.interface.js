/**
 * BHASHINI Translation Adapter Interface
 * Phase 67: Add multilingual architecture
 */

import {
  BHASHINI_TASK_TYPES,
  BHASHINI_SOURCE_LABEL,
  BHASHINI_DISCLAIMER,
  ISO_TO_BHASHINI_LANG,
} from './bhashini.types.js';

export class BaseBhashiniAdapter {
  constructor(options = {}) {
    this.sourceName = options.sourceName || BHASHINI_SOURCE_LABEL;
    this.isLiveIntegration = Boolean(options.isLiveIntegration || false);
    this.isMockOrSandbox = Boolean(options.isMockOrSandbox !== undefined ? options.isMockOrSandbox : true);
    this.endpoint = options.endpoint || 'https://dhruva-api.bhashini.gov.in';
    this.disclaimer = BHASHINI_DISCLAIMER;
  }

  /**
   * Translates a single text string from sourceLang to targetLang.
   * @param {Object} params
   * @param {string} params.text - Text to translate
   * @param {string} [params.sourceLang='en'] - Source ISO language code
   * @param {string} [params.targetLang='hi'] - Target ISO language code
   * @returns {Promise<{ translatedText: string, sourceLang: string, targetLang: string, provider: string, cached: boolean }>}
   */
  async translateText({ text, sourceLang = 'en', targetLang = 'hi' }) {
    throw new Error('translateText() must be implemented by subclass.');
  }

  /**
   * Translates multiple texts in a single batch request.
   * @param {Object} params
   * @param {Array<string>} params.texts - Array of strings to translate
   * @param {string} [params.sourceLang='en'] - Source ISO language code
   * @param {string} [params.targetLang='hi'] - Target ISO language code
   * @returns {Promise<{ translations: Array<{ source: string, target: string }>, sourceLang: string, targetLang: string, provider: string }>}
   */
  async translateBatch({ texts, sourceLang = 'en', targetLang = 'hi' }) {
    throw new Error('translateBatch() must be implemented by subclass.');
  }

  /**
   * Health check for provider availability.
   * @returns {Promise<{ healthy: boolean, provider: string, latencyMs: number, message?: string }>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass.');
  }

  /**
   * Normalizes ISO language code to Bhashini standard code.
   * @param {string} lang
   * @returns {string}
   */
  normalizeLanguage(lang) {
    if (!lang) return 'en';
    const clean = String(lang).toLowerCase().trim().slice(0, 2);
    if (!ISO_TO_BHASHINI_LANG[clean]) {
      throw new Error(`Unsupported Bhashini language: ${lang}`);
    }
    return ISO_TO_BHASHINI_LANG[clean];
  }
}
