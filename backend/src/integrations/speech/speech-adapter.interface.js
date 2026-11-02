/**
 * Base Speech-to-Text Adapter Interface
 * Phase 68: Add voice reporting
 */

import {
  SPEECH_PROVIDERS,
  SUPPORTED_AUDIO_MIMES,
  MAX_AUDIO_SIZE_BYTES,
  SPEECH_DISCLAIMER,
  AUDIO_RETENTION_POLICIES,
} from './speech.types.js';

export class BaseSpeechAdapter {
  constructor(options = {}) {
    this.providerName = options.providerName || SPEECH_PROVIDERS.MOCK_SANDBOX;
    this.isLiveIntegration = Boolean(options.isLiveIntegration || false);
    this.disclaimer = SPEECH_DISCLAIMER;
  }

  /**
   * Transcribes an audio payload into text and returns a normalized transcript.
   * @param {Object} params
   * @param {Buffer|string} [params.audioBuffer] - Raw binary buffer or base64 string
   * @param {string} [params.mimeType='audio/webm'] - Audio MIME type
   * @param {string} [params.languageHint='en'] - Expected spoken language ('en', 'hi', 'mr', etc.)
   * @param {boolean} [params.retainAudio=false] - Whether citizen opted to store audio
   * @param {boolean} [params.consentGiven=false] - Whether citizen explicitly consented
   * @returns {Promise<{
   *   rawTranscript: string,
   *   normalizedTranscript: string,
   *   detectedLanguage: string,
   *   confidence: number,
   *   durationSec: number,
   *   audioRetained: boolean,
   *   retentionPolicy: string,
   *   civicHints: Object,
   *   provider: string,
   *   isAiTranscription: boolean
   * }>}
   */
  async transcribeAudio(params = {}) {
    throw new Error('transcribeAudio() must be implemented by subclass.');
  }

  /**
   * Normalizes raw spoken transcript:
   * - Trims excess whitespace and normalizes line breaks.
   * - Masks potential citizen identity data (Aadhaar 12-digit patterns, phone numbers) per AGENTS.md.
   * - Fixes basic capitalization.
   * @param {string} rawText
   * @returns {string}
   */
  normalizeTranscript(rawText = '') {
    if (!rawText || typeof rawText !== 'string') return '';

    let cleaned = rawText
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Strip zero-width chars

    // Privacy Safeguard: Mask potential Aadhaar numbers (12 consecutive digits)
    cleaned = cleaned.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, '[REDACTED_AADHAAR]');

    // Privacy Safeguard: Mask potential Indian phone numbers (+91 or 10-digit mobiles)
    cleaned = cleaned.replace(
      /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g,
      '[REDACTED_PHONE]'
    );

    // Capitalize first character if Latin alphabet
    if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Extracts civic hints (category and location clues) from transcript text.
   * @param {string} text
   * @returns {{ categoryHint: string|null, locationHint: string|null }}
   */
  extractCivicHints(text = '') {
    if (!text) return { categoryHint: null, locationHint: null };
    const lower = text.toLowerCase();

    let categoryHint = null;
    if (/pothole|गड्ढा|खड्डा|road damage|crater/i.test(lower)) {
      categoryHint = 'roads_pothole';
    } else if (/streetlight|street light|light|पथदिवा|बत्ती|स्ट्रीटलाइट/i.test(lower)) {
      categoryHint = 'roads_streetlighting';
    } else if (/garbage|waste|trash|कचरा|कचऱ्याचा/i.test(lower)) {
      categoryHint = 'sanitation_garbage';
    } else if (/water leak|leakage|pipe|pipe burst|पानी का रिसाव|पाणी गळती/i.test(lower)) {
      categoryHint = 'water_leakage';
    } else if (/manhole|drain|sewer|gutter|नाली|गटार|मॅनहोल/i.test(lower)) {
      categoryHint = 'sanitation_open_manhole';
    } else if (/waterlog|flood|water standing|जलभराव|पाणी साचले/i.test(lower)) {
      categoryHint = 'disaster_waterlogging';
    }

    // Basic heuristic location extraction (after 'near', 'at', 'on', 'road', 'chowk', 'cafe')
    let locationHint = null;
    const locMatch = text.match(
      /(?:near|at|on|opposite|behind|जवळ|समोर|के पास|पर)\s+([A-Za-z0-9\u0900-\u097F\s]{3,35})(?:,|\.|$)/i
    );
    if (locMatch && locMatch[1]) {
      locationHint = locMatch[1].trim();
    }

    return { categoryHint, locationHint };
  }

  /**
   * Validates MIME type
   * @param {string} mimeType
   */
  validateMimeType(mimeType) {
    if (!mimeType) return true;
    const clean = mimeType.toLowerCase().split(';')[0].trim();
    if (!SUPPORTED_AUDIO_MIMES.includes(clean)) {
      throw new Error(
        `Unsupported audio format '${mimeType}'. Supported: ${SUPPORTED_AUDIO_MIMES.join(', ')}`
      );
    }
    return true;
  }

  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass.');
  }
}
