/**
 * Multilingual Architecture & Translation Service
 * Phase 67: Add multilingual architecture
 */

import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  ACTIVE_LANGUAGES,
} from './i18n.types.js';
import { LOCALES } from './i18n.locales.js';
import { getBhashiniAdapter } from '../../integrations/bhashini/index.js';

export class I18nService {
  constructor(options = {}) {
    this.defaultLanguage = options.defaultLanguage || DEFAULT_LANGUAGE;
    this.supportedLanguages = { ...SUPPORTED_LANGUAGES, ...(options.supportedLanguages || {}) };
    this.locales = { ...LOCALES, ...(options.locales || {}) };
    this.userPreferences = new Map();
    this.bhashiniAdapter = options.bhashiniAdapter || getBhashiniAdapter();
  }

  /**
   * Returns list of all configured languages.
   */
  getSupportedLanguages() {
    return Object.values(this.supportedLanguages);
  }

  /**
   * Returns list of currently active / enabled languages.
   */
  getActiveLanguages() {
    return Object.values(this.supportedLanguages).filter((l) => l.isEnabled);
  }

  /**
   * Checks if language code is valid and supported.
   * @param {string} code
   */
  isLanguageSupported(code) {
    if (!code || typeof code !== 'string') return false;
    const clean = code.toLowerCase().trim().slice(0, 2);
    return Boolean(this.supportedLanguages[clean]);
  }

  /**
   * Returns metadata for specific language code.
   */
  getLanguage(code) {
    const clean = String(code || '').toLowerCase().trim().slice(0, 2);
    return this.supportedLanguages[clean] || this.supportedLanguages[this.defaultLanguage];
  }

  /**
   * Resolves language preference from query, user profile preference, or Accept-Language header.
   * Priority: Query param -> User stored preference -> Accept-Language header -> Default
   * @param {Object} options
   * @param {string} [options.queryLang]
   * @param {string} [options.userId]
   * @param {string} [options.headerLang]
   * @returns {string} Normalized 2-letter language code
   */
  resolveLanguage({ queryLang, userId, headerLang } = {}) {
    // 1. Query parameter
    if (queryLang && this.isLanguageSupported(queryLang)) {
      return queryLang.toLowerCase().trim().slice(0, 2);
    }

    // 2. User profile preference
    if (userId && this.userPreferences.has(userId)) {
      const pref = this.userPreferences.get(userId)?.language;
      if (pref && this.isLanguageSupported(pref)) {
        return pref;
      }
    }

    // 3. Accept-Language header parsing (e.g. 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7')
    if (headerLang && typeof headerLang === 'string') {
      const parsed = this.parseAcceptLanguage(headerLang);
      for (const lang of parsed) {
        if (this.isLanguageSupported(lang)) {
          return lang;
        }
      }
    }

    // 4. System default
    return this.defaultLanguage;
  }

  /**
   * Parses Accept-Language header into prioritized list of 2-letter codes.
   */
  parseAcceptLanguage(header) {
    return header
      .split(',')
      .map((part) => {
        const [lang, qVal] = part.trim().split(';q=');
        const code = lang.split('-')[0].trim().toLowerCase();
        const weight = qVal ? parseFloat(qVal) : 1.0;
        return { code, weight };
      })
      .filter((item) => item.code && !isNaN(item.weight))
      .sort((a, b) => b.weight - a.weight)
      .map((item) => item.code);
  }

  /**
   * Returns user language preference.
   * @param {string} userId
   */
  getUserPreference(userId) {
    if (!userId) {
      return {
        userId: null,
        language: this.defaultLanguage,
        isDefault: true,
      };
    }

    const pref = this.userPreferences.get(userId);
    if (!pref) {
      return {
        userId,
        language: this.defaultLanguage,
        isDefault: true,
      };
    }

    return {
      userId,
      language: pref.language,
      isDefault: false,
      updatedAt: pref.updatedAt,
      updatedVia: pref.updatedVia,
    };
  }

  /**
   * Sets user language preference.
   * @param {string} userId
   * @param {string} language
   * @param {string} [updatedVia='API']
   */
  setUserPreference(userId, language, updatedVia = 'API') {
    if (!userId) {
      throw new Error('User ID is required to set language preference.');
    }

    const normalized = String(language || '').toLowerCase().trim().slice(0, 2);
    if (!this.isLanguageSupported(normalized)) {
      throw new Error(`Unsupported language code: ${language}`);
    }

    const record = {
      userId,
      language: normalized,
      updatedVia,
      updatedAt: new Date().toISOString(),
    };

    this.userPreferences.set(userId, record);
    return record;
  }

  /**
   * Returns complete dictionary for a given language.
   * Missing keys are transparently populated from the default language dictionary.
   */
  getLocaleDictionary(lang = this.defaultLanguage) {
    const clean = String(lang).toLowerCase().trim().slice(0, 2);
    const primary = this.locales[clean] || this.locales[this.defaultLanguage];
    const fallback = this.locales[this.defaultLanguage];

    if (clean === this.defaultLanguage) {
      return primary;
    }

    return this.deepMerge(fallback, primary);
  }

  /**
   * Translates a static key with parameter replacement.
   * @param {string} keyPath - e.g. 'issues.categories.pothole'
   * @param {string} [lang='en']
   * @param {Object} [params={}]
   * @returns {string}
   */
  translateKey(keyPath, lang = this.defaultLanguage, params = {}) {
    if (!keyPath || typeof keyPath !== 'string') return '';

    const clean = String(lang).toLowerCase().trim().slice(0, 2);
    const dict = this.getLocaleDictionary(clean);

    const keys = keyPath.split('.');
    let val = dict;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = null;
        break;
      }
    }

    // Fallback to default language if string not found
    if (typeof val !== 'string') {
      const fallbackDict = this.locales[this.defaultLanguage] || {};
      let fallbackVal = fallbackDict;
      for (const k of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
          fallbackVal = fallbackVal[k];
        } else {
          fallbackVal = null;
          break;
        }
      }
      val = typeof fallbackVal === 'string' ? fallbackVal : keyPath;
    }

    // Replace {{param}} tokens
    return this.interpolate(val, params);
  }

  /**
   * Interpolates {{param}} tokens inside string template.
   */
  interpolate(template, params = {}) {
    if (typeof template !== 'string') return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
      return params[key] !== undefined && params[key] !== null ? String(params[key]) : `{{${key}}}`;
    });
  }

  /**
   * Performs deep merge of fallback and target dictionaries.
   */
  deepMerge(fallback, target) {
    const result = { ...fallback };
    if (!target) return result;

    for (const [key, value] of Object.entries(target)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        fallback[key] &&
        typeof fallback[key] === 'object'
      ) {
        result[key] = this.deepMerge(fallback[key], value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Dynamic on-the-fly text translation using the BHASHINI adapter.
   */
  async translateDynamicText({ text, sourceLang = 'en', targetLang = 'hi' }) {
    return this.bhashiniAdapter.translateText({ text, sourceLang, targetLang });
  }

  /**
   * Dynamic batch translation using the BHASHINI adapter.
   */
  async translateBatchDynamic({ texts, sourceLang = 'en', targetLang = 'hi' }) {
    return this.bhashiniAdapter.translateBatch({ texts, sourceLang, targetLang });
  }
}

export const i18nService = new I18nService();
