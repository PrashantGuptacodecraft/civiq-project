/**
 * Language Selector Component
 * Phase 67: Add multilingual architecture
 *
 * Fully accessible, mobile-first language switcher.
 * Conforms to CivIQ design system: >=44px touch targets, keyboard navigation,
 * native script display, and screen-reader accessible labeling.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from './use-translation.js';

export function LanguageSelector({ className = '', variant = 'compact' }) {
  const { locale, setLocale, activeLanguages, currentLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard ESC
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (langCode) => {
    setLocale(langCode);
    setIsOpen(false);
  };

  if (variant === 'pills') {
    return (
      <div
        className={`flex flex-wrap gap-2 items-center ${className}`}
        role="group"
        aria-label={t('accessibility.languageSelectorAria') || 'Select Language'}
      >
        {activeLanguages.map((lang) => {
          const isActive = lang.code === locale;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              aria-pressed={isActive}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span className="block leading-none">{lang.nativeName}</span>
              {lang.name !== lang.nativeName && (
                <span className="text-[10px] text-slate-400 block mt-0.5">{lang.name}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Toggle Button (min 44x44px touch target) */}
      <button
        type="button"
        id="civiq-language-menu-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('accessibility.languageSelectorAria') || 'Select language'}
        className="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center justify-between gap-2 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <div className="flex items-center gap-2">
          {/* Globe Icon */}
          <svg
            className="w-4 h-4 text-blue-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold text-slate-100">{currentLanguage.nativeName}</span>
        </div>

        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="civiq-language-menu-button"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl shadow-black/40 py-1.5 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            {t('settings.chooseLanguage') || 'Select Language'}
          </div>

          <div className="py-1">
            {activeLanguages.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left min-h-[44px] px-3.5 py-2.5 flex items-center justify-between transition-colors focus:outline-none focus:bg-slate-800 ${
                    isSelected
                      ? 'bg-blue-900/30 text-blue-400 font-semibold'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-slate-400">{lang.name}</span>
                  </div>

                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
