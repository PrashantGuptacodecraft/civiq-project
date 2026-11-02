/**
 * Mock Speech-to-Text Sandbox Adapter
 * Phase 68: Add voice reporting
 *
 * Provides deterministic voice transcription for unit tests, offline development,
 * and staging environments.
 */

import { BaseSpeechAdapter } from './speech-adapter.interface.js';
import {
  SPEECH_PROVIDERS,
  AUDIO_RETENTION_POLICIES,
} from './speech.types.js';

export class MockSpeechAdapter extends BaseSpeechAdapter {
  constructor(options = {}) {
    super({
      ...options,
      providerName: SPEECH_PROVIDERS.MOCK_SANDBOX,
      isLiveIntegration: false,
    });
  }

  async transcribeAudio({
    audioBuffer,
    audioBase64,
    mimeType = 'audio/webm',
    languageHint = 'en',
    mockTranscript,
    retainAudio = false,
    consentGiven = false,
  } = {}) {
    this.validateMimeType(mimeType);

    // Normalize language hint
    const lang = String(languageHint || 'en').toLowerCase().trim().slice(0, 2);

    // Determine transcript text
    let rawText = '';
    if (mockTranscript && typeof mockTranscript === 'string') {
      rawText = mockTranscript;
    } else if (lang === 'hi') {
      rawText =
        'मुख्य सड़क पर गहरा गड्ढा है और पानी का रिसाव हो रहा है। बस स्टॉप के पास बहुत कीचड़ है।';
    } else if (lang === 'mr') {
      rawText =
        'रस्त्यावर मोठा खड्डा पडला आहे आणि नळ गळतीमुळे पाणी साचले आहे. शनिवार पेठ जवळ अपघात होऊ शकतो.';
    } else {
      rawText =
        'There is a large pothole on FC Road near Goodluck Cafe causing severe traffic backup and risk of accident.';
    }

    const normalizedTranscript = this.normalizeTranscript(rawText);
    const civicHints = this.extractCivicHints(normalizedTranscript);

    // Privacy logic: Audio is NEVER retained unless citizen explicitly opts in AND gives consent
    const audioRetained = Boolean(retainAudio && consentGiven);
    const retentionPolicy = audioRetained
      ? AUDIO_RETENTION_POLICIES.RETAIN_WITH_CONSENT
      : AUDIO_RETENTION_POLICIES.DISCARD_IMMEDIATELY;

    return {
      rawTranscript: rawText,
      normalizedTranscript,
      detectedLanguage: lang,
      confidence: 0.94,
      durationSec: 8.5,
      audioRetained,
      retentionPolicy,
      civicHints,
      provider: this.providerName,
      isAiTranscription: true,
    };
  }

  async healthCheck() {
    return {
      healthy: true,
      provider: this.providerName,
      mode: 'MOCK_SANDBOX',
      latencyMs: 12,
    };
  }
}
