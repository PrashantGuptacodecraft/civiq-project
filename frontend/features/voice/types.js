/**
 * Voice Reporting Types & Constants
 * Phase 68: Add voice reporting
 */

export const VOICE_RECORDING_STATES = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  TRANSCRIBING: 'TRANSCRIBING',
  CONFIRMATION_STEP: 'CONFIRMATION_STEP',
  ERROR: 'ERROR',
};

export const AUDIO_PRIVACY_OPTIONS = {
  DISCARD_IMMEDIATELY: 'DISCARD_IMMEDIATELY',
  RETAIN_WITH_CONSENT: 'RETAIN_WITH_CONSENT',
};

export const VOICE_ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NO_AUDIO_CAPTURED: 'NO_AUDIO_CAPTURED',
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

export const MAX_VOICE_DURATION_SECONDS = 120; // 2 minutes

export const VOICE_DISCLAIMER_TEXT =
  'Voice transcription is an assistive entry aid. Please verify and edit the text before submitting your official report.';
