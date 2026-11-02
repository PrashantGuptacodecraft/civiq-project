/**
 * Voice Reporting Flow Integration Component
 * Phase 68: Add voice reporting
 *
 * Provides a ready-to-use drop-in voice recording widget combining the
 * trigger button, recording bottom sheet, and confirmation review card.
 */

'use client';

import React, { useState } from 'react';
import { VoiceReportButton } from './voice-report-button.jsx';
import { VoiceRecordingModal } from './voice-recording-modal.jsx';

export function VoiceReportingFlow({
  onTranscriptApplied,
  initialLanguage = 'en',
  simulateTranscription = null,
  buttonVariant = 'default',
  buttonLabel = 'Voice Report (आवाज़ से रिपोर्ट)',
  className = '',
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = (confirmedData) => {
    onTranscriptApplied?.(confirmedData);
    setIsModalOpen(false);
  };

  return (
    <div className={`inline-block ${className}`}>
      <VoiceReportButton
        onClick={() => setIsModalOpen(true)}
        variant={buttonVariant}
        label={buttonLabel}
      />

      <VoiceRecordingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmTranscript={handleConfirm}
        initialLanguage={initialLanguage}
        simulateTranscription={simulateTranscription}
      />
    </div>
  );
}
