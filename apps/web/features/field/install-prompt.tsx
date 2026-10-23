'use client';

import React, { useState, useEffect } from 'react';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone)
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setIsVisible(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <div
      role="banner"
      className="bg-primary text-text-inverse px-4 py-3 shadow-elevation-2 flex items-center justify-between gap-3 text-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center font-bold text-lg">
          📱
        </div>
        <div>
          <div className="font-bold">Install CivIQ Field App</div>
          <div className="text-xs text-white/80">
            Fast outdoor access, offline support &amp; instant GPS navigation
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="min-h-[44px] px-4 py-2 bg-white text-primary text-xs font-bold uppercase tracking-wider rounded-md shadow-sm hover:bg-slate-100 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
