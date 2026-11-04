'use client';
import React from 'react';

export function VerificationNotice() {
  return (
    <section aria-labelledby="verification-expectations-heading" className="bg-surface-secondary border border-border-primary/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-elevation-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <h3 id="verification-expectations-heading" className="text-sm font-bold text-text-primary tracking-tight">
            What happens after you submit?
          </h3>
          <p className="text-xs text-text-tertiary">Cryptographic verification lifecycle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-text-secondary">
        <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary hover:border-primary/30 transition-all flex flex-col gap-1.5 shadow-sm">
          <span className="font-bold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-extrabold ring-1 ring-primary/20">1</span>
            Intake & Deduplication
          </span>
          <p className="leading-relaxed text-text-secondary">
            Report is assigned an immutable hash ID and scanned for duplicate nearby incidents.
          </p>
        </div>

        <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary hover:border-primary/30 transition-all flex flex-col gap-1.5 shadow-sm">
          <span className="font-bold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-extrabold ring-1 ring-primary/20">2</span>
            Officer Review
          </span>
          <p className="leading-relaxed text-text-secondary">
            A verified municipal officer validates the evidence and attaches guaranteed departmental SLA timelines.
          </p>
        </div>

        <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary hover:border-primary/30 transition-all flex flex-col gap-1.5 shadow-sm">
          <span className="font-bold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-extrabold ring-1 ring-primary/20">3</span>
            Resolution & Proof
          </span>
          <p className="leading-relaxed text-text-secondary">
            Field workers complete repairs and provide before/after photographic proof for citizen verification.
          </p>
        </div>
      </div>
    </section>
  );
}
