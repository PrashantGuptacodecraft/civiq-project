/**
 * Phase 67 Exit Checks: Multilingual Architecture & Translation Tests
 *
 * Validates:
 * 1. Translation Key Completeness: 100% 1:1 key parity between English (en), Hindi (hi), and Marathi (mr).
 * 2. Variable token preservation: Ensures {{variables}} match across localized strings.
 * 3. Fallback mechanism: Unknown/missing keys safely fall back to default English.
 * 4. Language resolution priority: Query param -> User stored preference -> Accept-Language header -> Default.
 * 5. BHASHINI adapter: Mock sandbox translation and error handling.
 * 6. REST API Endpoints: /i18n/languages, /i18n/locales/:lang, /i18n/preference, /i18n/translate.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  i18nService,
  I18nService,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LOCALES,
} from './index.js';
import {
  MockBhashiniAdapter,
  BhashiniAdapter,
  BHASHINI_DISCLAIMER,
} from '../../integrations/bhashini/index.js';

/**
 * Helper to collect all dot-notated key paths in an object.
 */
function getAllKeyPaths(obj, prefix = '') {
  let paths = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths = paths.concat(getAllKeyPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  return paths;
}

/**
 * Helper to extract {{param}} variable tokens from a template string.
 */
function extractTokens(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g) || [];
  return matches.map((m) => m.replace(/[\{\}\s]/g, '')).sort();
}

describe('Phase 67: Multilingual Architecture Exit Checks', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  describe('1. Translation Key Completeness & Parity Tests', () => {
    const enKeys = getAllKeyPaths(LOCALES.en);
    const hiKeys = getAllKeyPaths(LOCALES.hi);
    const mrKeys = getAllKeyPaths(LOCALES.mr);

    it('has non-empty locale dictionaries for en, hi, and mr', () => {
      expect(enKeys.length).toBeGreaterThan(30);
      expect(hiKeys.length).toBeGreaterThan(30);
      expect(mrKeys.length).toBeGreaterThan(30);
    });

    it('achieves 100% key parity between English (en) and Hindi (hi)', () => {
      const missingInHindi = enKeys.filter((k) => !hiKeys.includes(k));
      expect(missingInHindi).toEqual([]);

      const extraInHindi = hiKeys.filter((k) => !enKeys.includes(k));
      expect(extraInHindi).toEqual([]);
    });

    it('achieves 100% key parity between English (en) and Marathi (mr)', () => {
      const missingInMarathi = enKeys.filter((k) => !mrKeys.includes(k));
      expect(missingInMarathi).toEqual([]);

      const extraInMarathi = mrKeys.filter((k) => !enKeys.includes(k));
      expect(extraInMarathi).toEqual([]);
    });

    it('preserves all {{variable}} interpolation tokens across languages', () => {
      for (const keyPath of enKeys) {
        const enVal = i18nService.translateKey(keyPath, 'en');
        const hiVal = i18nService.translateKey(keyPath, 'hi');
        const mrVal = i18nService.translateKey(keyPath, 'mr');

        const enTokens = extractTokens(enVal);
        const hiTokens = extractTokens(hiVal);
        const mrTokens = extractTokens(mrVal);

        expect(hiTokens).toEqual(enTokens);
        expect(mrTokens).toEqual(enTokens);
      }
    });

    it('ensures no empty string values exist in any locale dictionary', () => {
      for (const keyPath of enKeys) {
        const enVal = i18nService.translateKey(keyPath, 'en');
        const hiVal = i18nService.translateKey(keyPath, 'hi');
        const mrVal = i18nService.translateKey(keyPath, 'mr');

        expect(enVal.trim().length).toBeGreaterThan(0);
        expect(hiVal.trim().length).toBeGreaterThan(0);
        expect(mrVal.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Translation Interpolation & Fallback Behavior', () => {
    it('interpolates single and multiple parameters accurately', () => {
      const resultEn = i18nService.translateKey('disaster.severityNotice', 'en', {
        severity: 'CRITICAL',
        authority: 'NDMA',
      });
      expect(resultEn).toBe('Severity: CRITICAL — Issued by NDMA');

      const resultHi = i18nService.translateKey('disaster.severityNotice', 'hi', {
        severity: 'गंभीर',
        authority: 'एनडीएमए',
      });
      expect(resultHi).toBe('गंभीरता: गंभीर — प्राधिकारी: एनडीएमए');
    });

    it('falls back to English when a key is missing in target language', () => {
      const customService = new I18nService({
        locales: {
          en: { test: { missing: 'Fallback English text' } },
          hi: { test: {} },
        },
      });

      const translated = customService.translateKey('test.missing', 'hi');
      expect(translated).toBe('Fallback English text');
    });

    it('returns the keyPath itself if key is missing in all locales', () => {
      const translated = i18nService.translateKey('non.existent.path', 'en');
      expect(translated).toBe('non.existent.path');
    });
  });

  describe('3. Language Preference Resolution Hierarchy', () => {
    const service = new I18nService();

    it('prioritizes query param over user preference and accept-language header', () => {
      service.setUserPreference('user-1', 'hi');
      const resolved = service.resolveLanguage({
        queryLang: 'mr',
        userId: 'user-1',
        headerLang: 'en-US,en;q=0.9',
      });
      expect(resolved).toBe('mr');
    });

    it('uses user stored preference when query param is absent', () => {
      service.setUserPreference('user-2', 'hi');
      const resolved = service.resolveLanguage({
        userId: 'user-2',
        headerLang: 'en-US,en;q=0.9',
      });
      expect(resolved).toBe('hi');
    });

    it('parses weighted Accept-Language header when query and user pref are absent', () => {
      const resolved = service.resolveLanguage({
        headerLang: 'fr-FR,fr;q=0.8,hi-IN;q=0.9,en;q=0.7',
      });
      expect(resolved).toBe('hi');
    });

    it('defaults to English when no supported language matches', () => {
      const resolved = service.resolveLanguage({
        queryLang: 'xx',
        headerLang: 'de-DE,de;q=0.9',
      });
      expect(resolved).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe('4. BHASHINI Translation Adapter Contract', () => {
    const mockAdapter = new MockBhashiniAdapter();

    it('translates pre-seeded civic phrases accurately', async () => {
      const resHi = await mockAdapter.translateText({
        text: 'Pothole on Main Road',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      expect(resHi.translatedText).toBe('मुख्य सड़क पर गड्ढा');
      expect(resHi.sourceLang).toBe('en');
      expect(resHi.targetLang).toBe('hi');

      const resMr = await mockAdapter.translateText({
        text: 'Pothole on Main Road',
        sourceLang: 'en',
        targetLang: 'mr',
      });
      expect(resMr.translatedText).toBe('मुख्य रस्त्यावरील खड्डा');
    });

    it('provides synthetic mock translation for unseen phrases', async () => {
      const res = await mockAdapter.translateText({
        text: 'Civic water pipeline maintenance',
        sourceLang: 'en',
        targetLang: 'hi',
      });
      expect(res.translatedText).toContain('[अनुवाद: Civic water pipeline maintenance]');
    });

    it('handles batch translations', async () => {
      const batch = await mockAdapter.translateBatch({
        texts: ['Pothole', 'Water Leakage', 'Blocked Drain'],
        sourceLang: 'en',
        targetLang: 'hi',
      });
      expect(batch.translations).toHaveLength(3);
      expect(batch.translations[0].target).toBe('गड्ढा');
      expect(batch.translations[1].target).toBe('पानी का रिसाव');
      expect(batch.translations[2].target).toBe('अवरुद्ध नाली');
    });

    it('live adapter validates missing credentials gracefully', async () => {
      const liveAdapter = new BhashiniAdapter({ userId: '', apiKey: '', inferenceKey: '' });
      expect(liveAdapter.isConfigured()).toBe(false);

      await expect(
        liveAdapter.translateText({ text: 'Hello', sourceLang: 'en', targetLang: 'hi' })
      ).rejects.toThrow(/not configured/i);

      const health = await liveAdapter.healthCheck();
      expect(health.healthy).toBe(false);
      expect(health.message).toMatch(/credentials unconfigured/i);
    });
  });

  describe('5. Multilingual REST API Endpoints', () => {
    it('GET /i18n/languages returns configured language options', async () => {
      const res = await request(app).get('/i18n/languages');
      expect(res.status).toBe(200);
      expect(res.body.defaultLanguage).toBe('en');
      expect(res.body.supportedLanguages.length).toBeGreaterThanOrEqual(10);
      expect(res.body.activeLanguages.length).toBeGreaterThanOrEqual(2);
      expect(res.body.supportedLanguages.some((l) => l.code === 'hi')).toBe(true);
      expect(res.body.supportedLanguages.some((l) => l.code === 'mr')).toBe(true);
    });

    it('GET /i18n/locales/:lang returns language dictionary', async () => {
      const resHi = await request(app).get('/i18n/locales/hi');
      expect(resHi.status).toBe(200);
      expect(resHi.body.language).toBe('hi');
      expect(resHi.body.dictionary.issues.categories.pothole).toBe('गड्ढा');
      expect(resHi.body.dictionary.common.submit).toBe('जमा करें');

      const resInvalid = await request(app).get('/i18n/locales/xx');
      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.error).toMatch(/unsupported/i);
    });

    it('PUT & GET /i18n/preference saves and retrieves user preference', async () => {
      const putRes = await request(app)
        .put('/i18n/preference')
        .send({ userId: 'test-citizen-01', language: 'hi' });

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.preference.language).toBe('hi');

      const getRes = await request(app)
        .get('/i18n/preference')
        .query({ userId: 'test-citizen-01' });

      expect(getRes.status).toBe(200);
      expect(getRes.body.language).toBe('hi');
      expect(getRes.body.isDefault).toBe(false);
    });

    it('POST /i18n/translate translates dynamic civic text via BHASHINI adapter', async () => {
      const res = await request(app)
        .post('/i18n/translate')
        .send({
          text: 'Pothole on Main Road',
          sourceLang: 'en',
          targetLang: 'hi',
        });

      expect(res.status).toBe(200);
      expect(res.body.translatedText).toBe('मुख्य सड़क पर गड्ढा');
      expect(res.body.targetLang).toBe('hi');
      expect(res.body.provider).toBeTruthy();
    });

    it('i18nMiddleware populates Content-Language header', async () => {
      const res = await request(app)
        .get('/i18n/languages')
        .set('Accept-Language', 'hi-IN,hi;q=0.9');

      expect(res.headers['content-language']).toBe('hi');
    });
  });
});
