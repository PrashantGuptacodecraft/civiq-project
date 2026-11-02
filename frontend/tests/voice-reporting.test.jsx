/**
 * Phase 68 Exit Checks: Voice Reporting Frontend Tests
 *
 * Validates:
 * 1. VoiceReportButton: Touch-friendly min 44x44px targets, accessible labeling, microphone icon.
 * 2. TranscriptConfirmationCard: Mandatory confirmation step before submission,
 *    editable transcript textarea, AI advisory badge, detected language, civic clues.
 * 3. Audio Privacy: Audio discard option is enabled by default (privacy-first).
 * 4. VoiceRecordingModal: Lifecycle states (IDLE, RECORDING, TRANSCRIBING, CONFIRMATION_STEP, ERROR).
 * 5. Touch Accessibility: All interactive elements have >=44px touch targets.
 * 6. Report Form Integration: Voice reporting button renders inside citizen report wizard.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  VoiceReportButton,
  TranscriptConfirmationCard,
  VoiceRecordingModal,
  VoiceReportingFlow,
  VOICE_RECORDING_STATES,
  VOICE_DISCLAIMER_TEXT,
} from '../features/voice/index.js';
import { CitizenReportForm } from '../features/reporting/report-form.jsx';

describe('Phase 68: Voice Reporting Frontend Tests', () => {
  describe('1. VoiceReportButton Component', () => {
    it('renders default button with min 44px touch target and accessible label', () => {
      const markup = renderToStaticMarkup(
        <VoiceReportButton label="Record Voice Issue" />
      );

      expect(markup).toContain('min-h-[44px]');
      expect(markup).toContain('Record Voice Issue');
      expect(markup).toContain('<svg');
    });

    it('renders compact variant with min 44x44px square dimensions', () => {
      const markup = renderToStaticMarkup(
        <VoiceReportButton variant="compact" label="Voice Dictation" />
      );

      expect(markup).toContain('min-h-[44px]');
      expect(markup).toContain('min-w-[44px]');
      expect(markup).toContain('aria-label="Voice Dictation"');
    });
  });

  describe('2. TranscriptConfirmationCard (Mandatory Confirmation Step)', () => {
    const sampleProps = {
      initialTranscript: 'There is a deep pothole on FC Road near Goodluck Cafe',
      detectedLanguage: 'en',
      civicHints: {
        categoryHint: 'roads_pothole',
        locationHint: 'FC Road near Goodluck Cafe',
      },
      confidence: 0.94,
    };

    it('renders confirmation card with editable transcript textarea', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} />
      );

      expect(markup).toContain('Review Voice Transcript');
      expect(markup).toContain('Step 2 of 2: Verify and confirm before use');
      expect(markup).toContain('textarea');
      expect(markup).toContain('There is a deep pothole on FC Road near Goodluck Cafe');
      expect(markup).toContain('data-testid="transcript-editor"');
    });

    it('displays non-authoritative AI advisory tag and detected language', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} detectedLanguage="hi" />
      );

      expect(markup).toContain('AI Transcription (Advisory)');
      expect(markup).toContain('हिन्दी (Hindi)');
    });

    it('renders detected civic hints for category and location', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} />
      );

      expect(markup).toContain('Detected Civic Details');
      expect(markup).toContain('Pothole');
      expect(markup).toContain('FC Road near Goodluck Cafe');
    });

    it('enforces audio privacy: discard audio is checked by default', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} />
      );

      expect(markup).toContain('Delete original voice recording immediately');
      expect(markup).toContain('checked=""');
      expect(markup).toContain('No raw voice biometrics will be retained');
    });

    it('includes statutory voice transcription disclaimer', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} />
      );

      expect(markup).toContain(VOICE_DISCLAIMER_TEXT);
    });

    it('provides confirmation action buttons with >=44px touch targets', () => {
      const markup = renderToStaticMarkup(
        <TranscriptConfirmationCard {...sampleProps} />
      );

      expect(markup).toContain('Confirm &amp; Use in Report');
      expect(markup).toContain('Re-record');
      expect(markup).toContain('Discard');
      expect(markup).toContain('min-h-[44px]');
    });
  });

  describe('3. VoiceRecordingModal Component States', () => {
    it('does not render when isOpen is false', () => {
      const markup = renderToStaticMarkup(
        <VoiceRecordingModal isOpen={false} />
      );
      expect(markup).toBe('');
    });

    it('renders IDLE state with language pills and record button when opened', () => {
      const markup = renderToStaticMarkup(
        <VoiceRecordingModal isOpen={true} />
      );

      expect(markup).toContain('Voice Report Assistant');
      expect(markup).toContain('data-testid="voice-idle-state"');
      expect(markup).toContain('English');
      expect(markup).toContain('हिन्दी (Hindi)');
      expect(markup).toContain('मराठी (Marathi)');
      expect(markup).toContain('data-testid="start-recording-btn"');
    });

    it('renders accessible close button with min 44x44px touch target', () => {
      const markup = renderToStaticMarkup(
        <VoiceRecordingModal isOpen={true} />
      );

      expect(markup).toContain('min-h-[44px]');
      expect(markup).toContain('min-w-[44px]');
      expect(markup).toContain('aria-label="Close voice assistant"');
    });
  });

  describe('4. VoiceReportingFlow & CitizenReportForm Integration', () => {
    it('renders VoiceReportingFlow with trigger button', () => {
      const markup = renderToStaticMarkup(
        <VoiceReportingFlow buttonLabel="Dictate Report" />
      );

      expect(markup).toContain('Dictate Report');
      expect(markup).toContain('min-h-[44px]');
    });

    it('renders voice dictation trigger inside CitizenReportForm description field', () => {
      const markup = renderToStaticMarkup(
        <CitizenReportForm />
      );

      expect(markup).toContain('Detailed Description');
      expect(markup).toContain('Voice Dictation');
      expect(markup).toContain('min-h-[44px]');
    });
  });
});
