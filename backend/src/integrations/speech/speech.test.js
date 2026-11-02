/**
 * Phase 68 Exit Checks: Speech-to-Text Integration Tests
 *
 * Validates:
 * 1. Mock Speech Adapter: Transcription accuracy in en, hi, and mr.
 * 2. Transcript Normalization: Whitespace cleanup, punctuation, capitalization.
 * 3. Privacy Safeguards: Masking of Aadhaar (12-digit) and phone numbers (10-digit).
 * 4. Audio Privacy: Audio is discarded immediately by default (audioRetained: false).
 * 5. Civic Hints Extraction: Heuristic categorization and location detection.
 * 6. REST API Endpoints: /integrations/speech/transcribe, /normalize, /info, /health.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  MockSpeechAdapter,
  BhashiniSpeechAdapter,
  AUDIO_RETENTION_POLICIES,
  SPEECH_DISCLAIMER,
} from './index.js';

describe('Phase 68: Speech-to-Text Pipeline Exit Checks', () => {
  let app;
  let adapter;

  beforeEach(() => {
    app = createApp();
    adapter = new MockSpeechAdapter();
  });

  describe('1. Mock Speech Adapter Audio Transcription', () => {
    it('transcribes English spoken audio accurately', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/webm',
        languageHint: 'en',
      });

      expect(res.rawTranscript).toContain('pothole on FC Road');
      expect(res.normalizedTranscript).toContain('pothole on FC Road');
      expect(res.detectedLanguage).toBe('en');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
      expect(res.audioRetained).toBe(false);
      expect(res.retentionPolicy).toBe(AUDIO_RETENTION_POLICIES.DISCARD_IMMEDIATELY);
      expect(res.isAiTranscription).toBe(true);
    });

    it('transcribes Hindi spoken audio accurately', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/wav',
        languageHint: 'hi',
      });

      expect(res.normalizedTranscript).toContain('गड्ढा');
      expect(res.detectedLanguage).toBe('hi');
      expect(res.civicHints.categoryHint).toBe('roads_pothole');
    });

    it('transcribes Marathi spoken audio accurately', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/webm',
        languageHint: 'mr',
      });

      expect(res.normalizedTranscript).toContain('खड्डा');
      expect(res.detectedLanguage).toBe('mr');
      expect(res.civicHints.categoryHint).toBe('roads_pothole');
    });

    it('supports custom simulated transcripts for testing', async () => {
      const res = await adapter.transcribeAudio({
        mockTranscript: 'Broken streetlight at Model Colony Chowk',
        languageHint: 'en',
      });

      expect(res.normalizedTranscript).toBe('Broken streetlight at Model Colony Chowk');
      expect(res.civicHints.categoryHint).toBe('roads_streetlighting');
      expect(res.civicHints.locationHint).toMatch(/Model Colony Chowk/i);
    });

    it('rejects unsupported audio MIME formats', async () => {
      await expect(
        adapter.transcribeAudio({ mimeType: 'video/avi' })
      ).rejects.toThrow(/unsupported audio format/i);
    });
  });

  describe('2. Transcript Normalization & Privacy Protection', () => {
    it('masks 12-digit Aadhaar numbers from spoken transcripts', () => {
      const raw = 'My id is 1234 5678 9012 and the streetlight is broken';
      const normalized = adapter.normalizeTranscript(raw);
      expect(normalized).not.toContain('1234 5678 9012');
      expect(normalized).toContain('[REDACTED_AADHAAR]');
      expect(normalized).toContain('streetlight is broken');
    });

    it('masks 10-digit Indian mobile numbers from spoken transcripts', () => {
      const raw = 'Call me on 9876543210 regarding the water leakage';
      const normalized = adapter.normalizeTranscript(raw);
      expect(normalized).not.toContain('9876543210');
      expect(normalized).toContain('[REDACTED_PHONE]');
    });

    it('cleans up extra whitespace and zero-width characters', () => {
      const raw = '   Water   logging    near  swargate   station.  ';
      const normalized = adapter.normalizeTranscript(raw);
      expect(normalized).toBe('Water logging near swargate station.');
    });
  });

  describe('3. Audio Privacy & Consent Enforcement', () => {
    it('discards audio immediately by default (privacy-first)', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/webm',
        retainAudio: false,
        consentGiven: false,
      });

      expect(res.audioRetained).toBe(false);
      expect(res.retentionPolicy).toBe(AUDIO_RETENTION_POLICIES.DISCARD_IMMEDIATELY);
    });

    it('discards audio even if retainAudio=true when consentGiven=false', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/webm',
        retainAudio: true,
        consentGiven: false,
      });

      expect(res.audioRetained).toBe(false);
      expect(res.retentionPolicy).toBe(AUDIO_RETENTION_POLICIES.DISCARD_IMMEDIATELY);
    });

    it('retains audio only with explicit opt-in and consent', async () => {
      const res = await adapter.transcribeAudio({
        mimeType: 'audio/webm',
        retainAudio: true,
        consentGiven: true,
      });

      expect(res.audioRetained).toBe(true);
      expect(res.retentionPolicy).toBe(AUDIO_RETENTION_POLICIES.RETAIN_WITH_CONSENT);
    });
  });

  describe('4. Civic Hints Heuristic Extraction', () => {
    it('extracts pothole category hint', () => {
      const hints = adapter.extractCivicHints('Deep pothole on Karve Road');
      expect(hints.categoryHint).toBe('roads_pothole');
      expect(hints.locationHint).toMatch(/Karve Road/i);
    });

    it('extracts water leakage hint', () => {
      const hints = adapter.extractCivicHints('There is a major pipe burst near Deccan Gymkhana');
      expect(hints.categoryHint).toBe('water_leakage');
      expect(hints.locationHint).toMatch(/Deccan Gymkhana/i);
    });

    it('extracts open manhole hint', () => {
      const hints = adapter.extractCivicHints('Open manhole at Shivaji Nagar');
      expect(hints.categoryHint).toBe('sanitation_open_manhole');
      expect(hints.locationHint).toMatch(/Shivaji Nagar/i);
    });
  });

  describe('5. REST API Integration (/integrations/speech)', () => {
    it('POST /integrations/speech/transcribe returns normalized transcript and hints', async () => {
      const res = await request(app)
        .post('/integrations/speech/transcribe')
        .send({
          mimeType: 'audio/webm',
          languageHint: 'en',
          mockTranscript: 'Garbage accumulation on Senapati Bapat Road near JW Marriott',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.normalizedTranscript).toContain('Garbage accumulation');
      expect(res.body.data.civicHints.categoryHint).toBe('sanitation_garbage');
      expect(res.body.data.audioRetained).toBe(false);
      expect(res.body.disclaimer).toBe(SPEECH_DISCLAIMER);
    });

    it('POST /integrations/speech/normalize sanitizes and redacts PII', async () => {
      const res = await request(app)
        .post('/integrations/speech/normalize')
        .send({
          text: 'Pothole near station, contact 9988776655 for photos',
        });

      expect(res.status).toBe(200);
      expect(res.body.normalizedTranscript).toContain('[REDACTED_PHONE]');
      expect(res.body.civicHints.categoryHint).toBe('roads_pothole');
    });

    it('GET /integrations/speech/info returns constraints and privacy policy', async () => {
      const res = await request(app).get('/integrations/speech/info');
      expect(res.status).toBe(200);
      expect(res.body.supportedAudioMimes).toContain('audio/webm');
      expect(res.body.maxDurationSeconds).toBe(120);
      expect(res.body.privacyRule).toMatch(/discarded immediately/i);
    });

    it('GET /integrations/speech/health returns 200 and healthy status', async () => {
      const res = await request(app).get('/integrations/speech/health');
      expect(res.status).toBe(200);
      expect(res.body.healthy).toBe(true);
    });
  });
});
