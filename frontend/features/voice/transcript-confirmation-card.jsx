/**
 * Transcript Confirmation & Review Card
 * Phase 68: Add voice reporting
 *
 * Implements the mandatory confirmation step before report submission.
 * Enables the citizen to review, edit, or re-record the speech transcript,
 * verifies detected category hints, and enforces audio privacy safeguards.
 */

'use client';

import React, { useState } from 'react';
import { VOICE_DISCLAIMER_TEXT } from './types.js';

export function TranscriptConfirmationCard({
  initialTranscript = '',
  detectedLanguage = 'en',
  civicHints = {},
  confidence = 0.9,
  onConfirm,
  onReRecord,
  onCancel,
  audioDuration = 0,
}) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [discardAudio, setDiscardAudio] = useState(true); // Privacy-first default: discard original audio
  const [acceptedCategory, setAcceptedCategory] = useState(civicHints?.categoryHint || null);
  const [acceptedLocation, setAcceptedLocation] = useState(civicHints?.locationHint || null);

  const handleConfirm = () => {
    if (!transcript.trim()) return;
    onConfirm?.({
      transcript: transcript.trim(),
      retainAudio: !discardAudio,
      acceptedCategory,
      acceptedLocation,
      detectedLanguage,
      confidence,
    });
  };

  const getLanguageLabel = (lang) => {
    switch (lang) {
      case 'hi':
        return 'हिन्दी (Hindi)';
      case 'mr':
        return 'मराठी (Marathi)';
      case 'ta':
        return 'தமிழ் (Tamil)';
      default:
        return 'English';
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return null;
    return cat
      .replace(/^(roads_|sanitation_|disaster_)/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div
      data-testid="transcript-confirmation-card"
      className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-5 text-slate-100 max-w-xl mx-auto"
    >
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">Review Voice Transcript</h3>
            <p className="text-xs text-slate-400">Step 2 of 2: Verify and confirm before use</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Advisory Tag */}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            AI Transcription (Advisory)
          </span>
          {/* Language Pill */}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {getLanguageLabel(detectedLanguage)}
          </span>
        </div>
      </div>

      {/* Editable Transcript Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="voice-transcript-editor" className="text-sm font-medium text-slate-300">
            Spoken Transcript (Editable)
          </label>
          <span className="text-xs text-slate-400">{transcript.length} characters</span>
        </div>
        <textarea
          id="voice-transcript-editor"
          data-testid="transcript-editor"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors leading-relaxed resize-y"
          placeholder="Transcript text will appear here. You may edit before confirmation..."
        />
        <p className="text-xs text-slate-400">
          Tip: Tap the text above to correct any street names, landmarks, or misrecognized words.
        </p>
      </div>

      {/* Detected Civic Clues (Category & Location) */}
      {(acceptedCategory || acceptedLocation) && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected Civic Details
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {acceptedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/40">
                <span>Issue:</span>
                <span className="font-semibold text-white">{formatCategory(acceptedCategory)}</span>
              </span>
            )}
            {acceptedLocation && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                <span>Location:</span>
                <span className="font-semibold text-white">{acceptedLocation}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Audio Privacy & Retention Option */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            id="privacy-discard-audio"
            data-testid="privacy-discard-audio-checkbox"
            checked={discardAudio}
            onChange={(e) => setDiscardAudio(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200 block">
              Delete original voice recording immediately (Recommended for privacy)
            </span>
            <span className="text-slate-400 block mt-0.5">
              Only the verified text transcript will be stored with your civic issue. No raw voice
              biometrics will be retained.
            </span>
          </div>
        </label>
      </div>

      {/* Statutory Disclaimer */}
      <p className="text-[11px] text-slate-500 leading-tight">
        {VOICE_DISCLAIMER_TEXT}
      </p>

      {/* Confirmation Action Buttons (All >=44px Touch Targets) */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          data-testid="cancel-voice-btn"
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Discard
        </button>

        <button
          type="button"
          onClick={onReRecord}
          data-testid="rerecord-voice-btn"
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Re-record
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!transcript.trim()}
          data-testid="confirm-transcript-btn"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Confirm & Use in Report
        </button>
      </div>
    </div>
  );
}
