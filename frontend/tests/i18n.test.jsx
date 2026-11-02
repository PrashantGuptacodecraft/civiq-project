/**
 * Phase 67 Exit Checks: Frontend Multilingual Architecture Tests
 *
 * Validates:
 * 1. Translation Key Completeness: 100% 1:1 key parity between en and hi.
 * 2. Marathi (mr) Key Parity: 100% parity with en.
 * 3. Parameter interpolation parity: {{variables}} match exactly.
 * 4. Context & Provider: I18nProvider nested key translation, fallback mechanics.
 * 5. LanguageSelector Component: Accessible markup, min 44px touch targets, native script rendering.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  en,
  hi,
  mr,
  LOCALES,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguage,
  isLanguageSupported,
  getActiveLanguages,
  I18nProvider,
  useTranslation,
  LanguageSelector,
} from '../lib/i18n/index.js';

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

function extractTokens(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g) || [];
  return matches.map((m) => m.replace(/[\{\}\s]/g, '')).sort();
}

// Consumer test component
function TranslationConsumer({ testKey, params }) {
  const { t, locale, currentLanguage } = useTranslation();
  return (
    <div data-testid="translation-consumer">
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="native-name">{currentLanguage.nativeName}</span>
      <p data-testid="translated-output">{t(testKey, params)}</p>
    </div>
  );
}

describe('Phase 67: Frontend Multilingual Architecture Exit Checks', () => {
  describe('1. Translation Key Completeness Tests', () => {
    const enKeys = getAllKeyPaths(en);
    const hiKeys = getAllKeyPaths(hi);
    const mrKeys = getAllKeyPaths(mr);

    it('has full coverage of civic categories, statuses, emergency handoffs, and accessibility', () => {
      expect(enKeys.length).toBeGreaterThan(35);
      expect(hiKeys.length).toBeGreaterThan(35);
      expect(mrKeys.length).toBeGreaterThan(35);
    });

    it('achieves 100% key parity between English (en) and Hindi (hi)', () => {
      const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
      expect(missingInHi).toEqual([]);

      const extraInHi = hiKeys.filter((k) => !enKeys.includes(k));
      expect(extraInHi).toEqual([]);
    });

    it('achieves 100% key parity between English (en) and Marathi (mr)', () => {
      const missingInMr = enKeys.filter((k) => !mrKeys.includes(k));
      expect(missingInMr).toEqual([]);

      const extraInMr = mrKeys.filter((k) => !enKeys.includes(k));
      expect(extraInMr).toEqual([]);
    });

    it('preserves all {{variable}} interpolation tokens across languages', () => {
      for (const key of enKeys) {
        const resolve = (obj, p) => p.split('.').reduce((acc, part) => acc?.[part], obj);
        const enVal = resolve(en, key);
        const hiVal = resolve(hi, key);
        const mrVal = resolve(mr, key);

        expect(extractTokens(hiVal)).toEqual(extractTokens(enVal));
        expect(extractTokens(mrVal)).toEqual(extractTokens(enVal));
      }
    });

    it('contains non-empty string values for all keys', () => {
      const resolve = (obj, p) => p.split('.').reduce((acc, part) => acc?.[part], obj);
      for (const key of enKeys) {
        expect(resolve(en, key).trim()).not.toBe('');
        expect(resolve(hi, key).trim()).not.toBe('');
        expect(resolve(mr, key).trim()).not.toBe('');
      }
    });
  });

  describe('2. Language Registry & Helpers', () => {
    it('supports English and Hindi out of the box with configuration-driven expansion', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('hi')).toBe(true);
      expect(isLanguageSupported('mr')).toBe(true);
      expect(isLanguageSupported('ta')).toBe(true);
      expect(isLanguageSupported('xx')).toBe(false);
    });

    it('retrieves language metadata with native script names', () => {
      const hiMeta = getLanguage('hi');
      expect(hiMeta.name).toBe('Hindi');
      expect(hiMeta.nativeName).toBe('हिन्दी');
      expect(hiMeta.script).toBe('Devanagari');

      const mrMeta = getLanguage('mr');
      expect(mrMeta.nativeName).toBe('मराठी');
    });

    it('returns active languages list', () => {
      const active = getActiveLanguages();
      expect(active.length).toBeGreaterThanOrEqual(2);
      expect(active.some((l) => l.code === 'en')).toBe(true);
      expect(active.some((l) => l.code === 'hi')).toBe(true);
    });
  });

  describe('3. I18nProvider & Hook Integration', () => {
    it('renders English translations correctly', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="en">
          <TranslationConsumer testKey="issues.categories.pothole" />
        </I18nProvider>
      );

      expect(markup).toContain('Pothole');
      expect(markup).toContain('English');
    });

    it('renders Hindi translations correctly', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="hi">
          <TranslationConsumer testKey="issues.categories.pothole" />
        </I18nProvider>
      );

      expect(markup).toContain('गड्ढा');
      expect(markup).toContain('हिन्दी');
    });

    it('renders Marathi translations correctly', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="mr">
          <TranslationConsumer testKey="issues.categories.pothole" />
        </I18nProvider>
      );

      expect(markup).toContain('खड्डा');
      expect(markup).toContain('मराठी');
    });

    it('interpolates parameters inside template strings', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="hi">
          <TranslationConsumer
            testKey="disaster.severityNotice"
            params={{ severity: 'अति गंभीर', authority: 'एनडीएमए' }}
          />
        </I18nProvider>
      );

      expect(markup).toContain('गंभीरता: अति गंभीर — प्राधिकारी: एनडीएमए');
    });

    it('gracefully falls back when rendered outside I18nProvider', () => {
      const markup = renderToStaticMarkup(
        <TranslationConsumer testKey="common.submit" />
      );

      expect(markup).toContain('Submit');
    });
  });

  describe('4. Accessible LanguageSelector Component', () => {
    it('renders compact language selector button with min 44px touch targets', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="hi">
          <LanguageSelector />
        </I18nProvider>
      );

      expect(markup).toContain('min-h-[44px]');
      expect(markup).toContain('min-w-[44px]');
      expect(markup).toContain('हिन्दी');
      expect(markup).toContain('aria-haspopup="true"');
      expect(markup).toContain('aria-expanded="false"');
    });

    it('renders pills variant for mobile/settings pages', () => {
      const markup = renderToStaticMarkup(
        <I18nProvider initialLocale="hi">
          <LanguageSelector variant="pills" />
        </I18nProvider>
      );

      expect(markup).toContain('role="group"');
      expect(markup).toContain('aria-pressed="true"');
      expect(markup).toContain('हिन्दी');
      expect(markup).toContain('English');
      expect(markup).toContain('मराठी');
      expect(markup).toContain('min-h-[44px]');
    });
  });
});
