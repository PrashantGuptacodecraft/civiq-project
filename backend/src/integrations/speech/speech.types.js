/**
 * Speech-to-Text Types and Constants
 * Phase 68: Add voice reporting
 *
 * Implements speech transcription specifications for Indian languages,
 * audio privacy options, and transcript normalization rules.
 */

export const SPEECH_PROVIDERS = {
  MOCK_SANDBOX: 'MOCK_SPEECH_SANDBOX',
  BHASHINI_ASR: 'BHASHINI_NLTM_ASR',
  WHISPER_FALLBACK: 'WHISPER_FALLBACK',
};

export const SUPPORTED_AUDIO_MIMES = [
  'audio/webm',
  'audio/wav',
  'audio/mp4',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/x-m4a',
];

export const AUDIO_RETENTION_POLICIES = {
  DISCARD_IMMEDIATELY: 'DISCARD_IMMEDIATELY',
  RETAIN_WITH_CONSENT: 'RETAIN_WITH_CONSENT',
};

export const MAX_AUDIO_DURATION_SEC = 120; // 2 minutes maximum for civic issue reports
export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const SPEECH_SOURCE_LABEL = 'CIVIQ_SPEECH_TRANSCRIBER';

export const SPEECH_DISCLAIMER =
  'Automated voice transcription is an assistive entry aid. ' +
  'Transcripts must be confirmed and may be edited by the citizen prior to official ticket submission.';
