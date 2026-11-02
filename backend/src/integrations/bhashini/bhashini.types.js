/**
 * BHASHINI / NLTM Universal Language Contribution API (ULCA) Types & Specifications
 * Phase 67: Add multilingual architecture
 *
 * BHASHINI is the National Language Translation Mission (MeitY, Government of India)
 * platform providing open translation, ASR (speech-to-text), and TTS services for Indian languages.
 */

export const BHASHINI_TASK_TYPES = {
  TRANSLATION: 'translation',
  ASR: 'asr',
  TTS: 'tts',
};

/**
 * Standard ISO 639-1 to BHASHINI ULCA language code mapping
 */
export const ISO_TO_BHASHINI_LANG = {
  en: 'en',
  hi: 'hi',
  mr: 'mr',
  ta: 'ta',
  te: 'te',
  bn: 'bn',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
  pa: 'pa',
  or: 'or',
  as: 'as',
  ur: 'ur',
};

export const BHASHINI_TO_ISO_LANG = Object.entries(ISO_TO_BHASHINI_LANG).reduce(
  (acc, [iso, bhashini]) => {
    acc[bhashini] = iso;
    return acc;
  },
  {}
);

export const BHASHINI_SOURCE_LABEL = 'BHASHINI_NLTM_MEITY';

export const BHASHINI_DISCLAIMER =
  'Machine translation provided via BHASHINI NLTM (MeitY). ' +
  'Automated translations are supplementary civic communication aids and should be cross-verified for critical legal notices.';
