/**
 * Speech-to-Text Integration Router
 * Phase 68: Add voice reporting
 */

import { Router } from 'express';
import { getSpeechAdapter } from './speech-registry.js';
import {
  SUPPORTED_AUDIO_MIMES,
  MAX_AUDIO_DURATION_SEC,
  AUDIO_RETENTION_POLICIES,
  SPEECH_DISCLAIMER,
} from './speech.types.js';

export const speechRouter = Router();

/**
 * POST /integrations/speech/transcribe
 * Transcribes spoken audio into a normalized, privacy-sanitized text transcript.
 */
speechRouter.post('/transcribe', async (req, res) => {
  const {
    audioBase64,
    audioBuffer,
    mimeType = 'audio/webm',
    languageHint = 'en',
    retainAudio = false,
    consentGiven = false,
    mockTranscript,
  } = req.body;

  try {
    const adapter = getSpeechAdapter();
    const result = await adapter.transcribeAudio({
      audioBase64,
      audioBuffer,
      mimeType,
      languageHint,
      retainAudio,
      consentGiven,
      mockTranscript,
    });

    res.json({
      success: true,
      data: result,
      disclaimer: SPEECH_DISCLAIMER,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /integrations/speech/normalize
 * Helper endpoint to sanitize, redact PII, and extract civic hints from an edited transcript.
 */
speechRouter.post('/normalize', (req, res) => {
  const { text = '' } = req.body;
  const adapter = getSpeechAdapter();

  const normalizedTranscript = adapter.normalizeTranscript(text);
  const civicHints = adapter.extractCivicHints(normalizedTranscript);

  res.json({
    normalizedTranscript,
    civicHints,
  });
});

/**
 * GET /integrations/speech/info
 * Returns system constraints and privacy capabilities.
 */
speechRouter.get('/info', (req, res) => {
  const adapter = getSpeechAdapter();
  res.json({
    activeProvider: adapter.providerName,
    isLiveIntegration: adapter.isLiveIntegration,
    supportedAudioMimes: SUPPORTED_AUDIO_MIMES,
    maxDurationSeconds: MAX_AUDIO_DURATION_SEC,
    retentionPolicies: Object.values(AUDIO_RETENTION_POLICIES),
    privacyRule: 'Audio is discarded immediately by default unless explicit citizen consent is given.',
    disclaimer: SPEECH_DISCLAIMER,
  });
});

/**
 * GET /integrations/speech/health
 * Provider health check.
 */
speechRouter.get('/health', async (req, res) => {
  const adapter = getSpeechAdapter();
  const health = await adapter.healthCheck();
  res.json(health);
});
