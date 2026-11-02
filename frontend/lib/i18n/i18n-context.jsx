/**
 * Multilingual Context & Provider for React Frontend
 * Phase 67: Add multilingual architecture
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguage,
  isLanguageSupported,
  getActiveLanguages,
} from './languages.js';
import { LOCALES } from './locales/index.js';

export const I18nContext = createContext(null);

const STORAGE_KEY = 'civiq_lang_pref';

/**
 * Deep key lookup in dictionary object.
 */
function resolveDeepKey(obj, path) {
  if (!obj || !path) return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Parameter interpolation in string.
 */
function interpolate(template, params = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    return params[key] !== undefined && params[key] !== null ? String(params[key]) : `{{${key}}}`;
  });
}

export function I18nProvider({ children, initialLocale = DEFAULT_LANGUAGE }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && isLanguageSupported(saved)) {
          return saved;
        }
      } catch (e) {
        // Ignore storage access errors
      }
    }
    return isLanguageSupported(initialLocale) ? initialLocale : DEFAULT_LANGUAGE;
  });

  // Keep <html> tag attributes synced with active locale
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      const langConfig = getLanguage(locale);
      document.documentElement.dir = langConfig.direction || 'ltr';
    }
  }, [locale]);

  const setLocale = useCallback((newLocale) => {
    const clean = String(newLocale || '').toLowerCase().trim().slice(0, 2);
    if (!isLanguageSupported(clean)) return;

    setLocaleState(clean);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, clean);
      } catch (e) {
        // Ignore storage write errors
      }
    }
  }, []);

  /**
   * Translate key with optional variable interpolation and fallback to English.
   */
  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath || typeof keyPath !== 'string') return '';

      const currentDict = LOCALES[locale] || LOCALES[DEFAULT_LANGUAGE];
      let value = resolveDeepKey(currentDict, keyPath);

      // Fallback to default language dictionary if missing
      if (!value && locale !== DEFAULT_LANGUAGE) {
        value = resolveDeepKey(LOCALES[DEFAULT_LANGUAGE], keyPath);
      }

      // If missing everywhere, return keyPath
      if (!value) {
        return keyPath;
      }

      return interpolate(value, params);
    },
    [locale]
  );

  const currentLanguage = useMemo(() => getLanguage(locale), [locale]);
  const supportedLanguages = useMemo(() => Object.values(SUPPORTED_LANGUAGES), []);
  const activeLanguages = useMemo(() => getActiveLanguages(), []);
  const isRtl = useMemo(() => currentLanguage.direction === 'rtl', [currentLanguage]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      currentLanguage,
      supportedLanguages,
      activeLanguages,
      isRtl,
    }),
    [locale, setLocale, t, currentLanguage, supportedLanguages, activeLanguages, isRtl]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a standalone fallback implementation if rendered outside provider
    const fallbackT = (keyPath, params = {}) => {
      const dict = LOCALES[DEFAULT_LANGUAGE] || {};
      const val = resolveDeepKey(dict, keyPath) || keyPath;
      return interpolate(val, params);
    };

    return {
      locale: DEFAULT_LANGUAGE,
      setLocale: () => {},
      t: fallbackT,
      currentLanguage: getLanguage(DEFAULT_LANGUAGE),
      supportedLanguages: Object.values(SUPPORTED_LANGUAGES),
      activeLanguages: getActiveLanguages(),
      isRtl: false,
    };
  }
  return context;
}
