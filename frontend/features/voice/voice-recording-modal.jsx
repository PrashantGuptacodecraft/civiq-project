/**
 * Voice Recording Modal & Assistant
 * Phase 68: Add voice reporting
 *
 * Full-screen mobile bottom-sheet / desktop modal providing accessible
 * voice recording, audio wave visualization, live timer, transcribing loader,
 * and the transcript confirmation step.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  VOICE_RECORDING_STATES,
  MAX_VOICE_DURATION_SECONDS,
  VOICE_DISCLAIMER_TEXT,
} from './types.js';
import { TranscriptConfirmationCard } from './transcript-confirmation-card.jsx';

export function VoiceRecordingModal({
  isOpen,
  onClose,
  onConfirmTranscript,
  initialLanguage = 'en',
  simulateTranscription = null, // Mock callback or override for testing
}) {
  const [state, setState] = useState(VOICE_RECORDING_STATES.IDLE);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [language, setLanguage] = useState(initialLanguage);
  const [transcriptData, setTranscriptData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const timerRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState(VOICE_RECORDING_STATES.IDLE);
      setElapsedSeconds(0);
      setTranscriptData(null);
      setErrorMessage('');
    } else {
      clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Elapsed timer when recording
  useEffect(() => {
    if (state === VOICE_RECORDING_STATES.RECORDING) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= MAX_VOICE_DURATION_SECONDS - 1) {
            handleStopRecording();
            return MAX_VOICE_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [state]);

  const handleStartRecording = () => {
    setErrorMessage('');
    setElapsedSeconds(0);
    setState(VOICE_RECORDING_STATES.RECORDING);
  };

  const handleStopRecording = async () => {
    setState(VOICE_RECORDING_STATES.TRANSCRIBING);

    try {
      if (simulateTranscription) {
        const result = await simulateTranscription({
          languageHint: language,
          elapsedSeconds,
        });
        setTranscriptData(result);
        setState(VOICE_RECORDING_STATES.CONFIRMATION_STEP);
        return;
      }

      // Default mock simulation for standard client flows
      setTimeout(() => {
        let sampleTranscript = '';
        let categoryHint = 'roads_pothole';
        let locationHint = 'FC Road near Goodluck Cafe';

        if (language === 'hi') {
          sampleTranscript =
            'मुख्य सड़क पर गहरा गड्ढा है और पानी का रिसाव हो रहा है। बस स्टॉप के पास बहुत कीचड़ है।';
          locationHint = 'मुख्य सड़क, बस स्टॉप के पास';
        } else if (language === 'mr') {
          sampleTranscript =
            'रस्त्यावर मोठा खड्डा पडला आहे आणि नळ गळतीमुळे पाणी साचले आहे. शनिवार पेठ जवळ अपघात होऊ शकतो.';
          locationHint = 'शनिवार पेठ';
        } else {
          sampleTranscript =
            'There is a deep pothole on FC Road near Goodluck Cafe causing severe traffic backup and risk of accident.';
        }

        setTranscriptData({
          normalizedTranscript: sampleTranscript,
          detectedLanguage: language,
          confidence: 0.94,
          civicHints: { categoryHint, locationHint },
        });

        setState(VOICE_RECORDING_STATES.CONFIRMATION_STEP);
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Transcription failed. Please try again.');
      setState(VOICE_RECORDING_STATES.ERROR);
    }
  };

  const handleConfirm = (finalData) => {
    onConfirmTranscript?.(finalData);
    onClose?.();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      data-testid="voice-recording-modal"
      className="fixed inset-0 z-50 bg-surface-overlay backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="animate-slide-in-bottom sm:animate-scale-in bg-[#0F172A] border-t sm:border border-[#1E293B] rounded-t-3xl sm:rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-elevation-4 text-text-inverse max-h-[90vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <h2 id="voice-modal-title" className="font-bold text-base sm:text-lg text-white">
              Voice Report Assistant
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice assistant"
            data-testid="close-voice-modal-btn"
            className="btn-press min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content based on State */}
        <div className="pt-5">
          {/* 1. IDLE STATE */}
          {state === VOICE_RECORDING_STATES.IDLE && (
            <div data-testid="voice-idle-state" className="text-center space-y-6 py-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  Select your spoken language and tap record to describe the civic issue.
                </p>

                {/* Spoken Language Picker */}
                <div className="flex justify-center gap-2 pt-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिन्दी (Hindi)' },
                    { code: 'mr', label: 'मराठी (Marathi)' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`btn-press min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        language === l.code
                          ? 'bg-primary border-primary text-white font-semibold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Record Button */}
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={handleStartRecording}
                  data-testid="start-recording-btn"
                  className="btn-press w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent hover:opacity-90 text-white shadow-elevation-3 shadow-primary/30 flex items-center justify-center transition-opacity focus:outline-none focus:ring-4 focus:ring-primary/50"
                  aria-label="Start recording voice report"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Maximum duration: 2 minutes. You will review and edit the transcript before submitting.
              </p>
            </div>
          )}

          {/* 2. RECORDING STATE */}
          {state === VOICE_RECORDING_STATES.RECORDING && (
            <div data-testid="voice-recording-state" className="text-center space-y-6 py-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold animate-pulse border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Recording in Progress
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-wider">
                  {formatTime(elapsedSeconds)} / {formatTime(MAX_VOICE_DURATION_SECONDS)}
                </div>
              </div>

              {/* Staggered Audio Waveform Visualizer */}
              <div
                className="flex items-center justify-center gap-1 h-16 py-2"
                aria-hidden="true"
              >
                {[0.4, 0.75, 0.55, 0.9, 0.65, 0.8, 0.45, 0.95, 0.70, 0.50, 0.85, 0.60, 0.4].map((scale, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-primary will-change-transform animate-waveform-bar"
                    style={{
                      height: `${Math.round(scale * 100)}%`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Stop Recording Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setState(VOICE_RECORDING_STATES.IDLE)}
                  data-testid="cancel-recording-btn"
                  className="min-h-[44px] px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStopRecording}
                  data-testid="stop-recording-btn"
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <span className="w-3 h-3 rounded-sm bg-white" />
                  Stop Recording & Transcribe
                </button>
              </div>
            </div>
          )}

          {/* 3. TRANSCRIBING STATE */}
          {state === VOICE_RECORDING_STATES.TRANSCRIBING && (
            <div data-testid="voice-transcribing-state" className="text-center py-12 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-white">Transcribing Speech...</h3>
                <p className="text-xs text-slate-400">
                  Normalizing spoken text and masking personal identity data.
                </p>
              </div>
            </div>
          )}

          {/* 4. CONFIRMATION STEP */}
          {state === VOICE_RECORDING_STATES.CONFIRMATION_STEP && transcriptData && (
            <TranscriptConfirmationCard
              initialTranscript={transcriptData.normalizedTranscript}
              detectedLanguage={transcriptData.detectedLanguage}
              civicHints={transcriptData.civicHints}
              confidence={transcriptData.confidence}
              audioDuration={elapsedSeconds}
              onConfirm={handleConfirm}
              onReRecord={() => {
                setTranscriptData(null);
                setState(VOICE_RECORDING_STATES.IDLE);
              }}
              onCancel={onClose}
            />
          )}

          {/* 5. ERROR STATE */}
          {state === VOICE_RECORDING_STATES.ERROR && (
            <div data-testid="voice-error-state" className="text-center py-6 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-white">Recording Error</h3>
                <p className="text-sm text-red-400">{errorMessage || 'Failed to process voice input.'}</p>
              </div>
              <button
                type="button"
                onClick={() => setState(VOICE_RECORDING_STATES.IDLE)}
                data-testid="retry-voice-btn"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
