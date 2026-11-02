/**
 * Supported Languages Configuration & Registry
 * Phase 67: Add multilingual architecture
 */

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    direction: 'ltr',
    isDefault: true,
    isEnabled: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    direction: 'ltr',
    isDefault: false,
    isEnabled: true,
  },
};

export const DEFAULT_LANGUAGE = 'en';

export const getLanguage = (code) => {
  const clean = String(code || '').toLowerCase().trim().slice(0, 2);
  return SUPPORTED_LANGUAGES[clean] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
};

export const isLanguageSupported = (code) => {
  if (!code || typeof code !== 'string') return false;
  const clean = code.toLowerCase().trim().slice(0, 2);
  return Boolean(SUPPORTED_LANGUAGES[clean]);
};

export const getActiveLanguages = () => {
  return Object.values(SUPPORTED_LANGUAGES).filter((l) => l.isEnabled);
};
