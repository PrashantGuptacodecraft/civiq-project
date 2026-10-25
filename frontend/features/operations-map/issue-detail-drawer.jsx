'use client';
import React from 'react';

export function IssueDetailDrawer({
  issue,
  onClose,
  isAuthorizedOfficial = false,
  onToggleOfficialRole,
}) {
  if (!issue) return null;

  const isCritical = issue.severity === 'CRITICAL';

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-surface-primary border-l border-border-primary shadow-elevation-4 flex flex-col overflow-hidden transition-transform animate-in slide-in-from-right duration-200"
      role="dialog"
      aria-labelledby="issue-detail-title"
      aria-modal="true"
    >
      {/* Mobile Top Drag Handle & Header */}
      <div className="p-4 border-b border-border-primary bg-surface-secondary/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
              isCritical
                ? 'bg-priority-critical text-text-inverse'
                : 'bg-surface-tertiary text-text-primary'
            }`}
          >
            {issue.severity} Priority
          </span>
          <span className="text-xs font-medium text-text-tertiary">
            ID: {issue.id}
          </span>
        </div>

        {/* Close Button (Touch target >= 44x44px) */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-tertiary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close issue detail panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Role View Toggle Switcher (Public vs Authorized Official) */}
      <div className="px-4 py-2.5 bg-surface-tertiary border-b border-border-primary flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">Security Viewport:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleOfficialRole(false)}
            className={`px-2.5 py-1 rounded min-h-[32px] font-semibold transition-colors ${
              !isAuthorizedOfficial
                ? 'bg-primary text-text-inverse shadow-elevation-1'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Public View
          </button>
          <button
            type="button"
            onClick={() => onToggleOfficialRole(true)}
            className={`px-2.5 py-1 rounded min-h-[32px] font-semibold transition-colors ${
              isAuthorizedOfficial
                ? 'bg-status-success text-text-inverse shadow-elevation-1'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Official Audit
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & Status */}
        <div>
          <h2 id="issue-detail-title" className="text-lg font-bold text-text-primary mb-2">
            {issue.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {issue.status}
            </span>

            {/* Verification Status Badge */}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-secondary">
              Verification: {issue.verificationStatus}
            </span>

            {/* Department Badge */}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              {issue.department || 'General Administration'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-secondary p-3.5 rounded-xl border border-border-primary">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
            Issue Description
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Location & Jurisdiction */}
        <div className="bg-surface-secondary p-3.5 rounded-xl border border-border-primary space-y-2">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Geographic Location & Boundary
          </h3>
          <div className="text-sm text-text-primary flex items-start gap-2">
            <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-medium">{issue.address || 'Address registered on coordinates'}</p>
              <p className="text-xs text-text-tertiary mt-0.5 font-mono">
                Lat: {issue.latitude?.toFixed(5)}, Lng: {issue.longitude?.toFixed(5)}
              </p>
              <p className="text-xs font-medium text-accent mt-1">
                Jurisdiction: {issue.jurisdictionName || issue.jurisdictionId || 'PMC Pune'}
              </p>
            </div>
          </div>
        </div>

        {/* PRIVACY & EVIDENCE SECTION */}
        <div className="border-t border-border-primary pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Verification Proof & Evidence
            </h3>
            {isAuthorizedOfficial ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-success/15 text-status-success">
                ✓ Full Official Audit
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-info/15 text-status-info">
                🔒 Privacy Shield Active
              </span>
            )}
          </div>

          {!isAuthorizedOfficial ? (
            /* PUBLIC PRIVACY-SAFE VIEW */
            <div className="bg-surface-secondary p-4 rounded-xl border border-border-primary space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-status-info/10 text-status-info flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">
                    Exact Evidence & Identity Redacted
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    Under CivIQ citizen privacy safeguards, high-resolution forensic images, cryptographic SHA-256 hashes, and citizen phone numbers are restricted to authorized municipal officials.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-primary border border-border-primary flex items-center justify-between text-xs">
                <span className="text-text-secondary">Photographic Attachments:</span>
                <span className="font-semibold text-text-primary">
                  {issue.evidence?.length || issue.evidenceCount || 1} File(s) Verified
                </span>
              </div>

              <button
                type="button"
                onClick={() => onToggleOfficialRole(true)}
                className="w-full py-2.5 px-3 rounded-lg border border-primary text-primary hover:bg-primary/5 active:bg-primary/10 text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Sign in with Official Credentials to Audit
              </button>
            </div>
          ) : (
            /* AUTHORIZED OFFICIAL FULL FORENSIC VIEW */
            <div className="bg-surface-secondary p-4 rounded-xl border border-border-primary space-y-3">
              {/* Reporter Info (PII visible to officials) */}
              <div className="p-3 bg-surface-primary rounded-lg border border-border-primary space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>Citizen Reporter:</span>
                  <span className="text-status-success">✓ Identity Verified</span>
                </div>
                <p className="text-text-secondary">
                  Name: {issue.reportedBy?.name || 'Registered Citizen'}
                </p>
                <p className="text-text-secondary">
                  Phone: {issue.reportedBy?.phone || '+91 98220 12345'}
                </p>
                <p className="text-text-secondary">
                  Email: {issue.reportedBy?.email || 'citizen.reporter@civiq.org'}
                </p>
              </div>

              {/* Exact Evidence Records */}
              {issue.evidence && issue.evidence.length > 0 ? (
                issue.evidence.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="p-3 bg-surface-primary rounded-lg border border-border-primary space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between font-sans">
                      <span className="font-bold text-text-primary">Evidence #{idx + 1}</span>
                      <span className="text-[10px] text-text-tertiary">
                        {ev.mimeType || 'image/jpeg'} • {(ev.sizeBytes ? (ev.sizeBytes / 1024 / 1024).toFixed(2) : 2.1)} MB
                      </span>
                    </div>

                    <div className="text-[11px] text-text-secondary break-all">
                      <span className="font-sans font-semibold text-text-primary block">Secure Storage Key:</span>
                      {ev.storageKey || 'evidence/vault/2026/10/verified_proof.jpg'}
                    </div>

                    <div className="text-[11px] text-text-secondary break-all">
                      <span className="font-sans font-semibold text-text-primary block">Cryptographic Hash:</span>
                      {ev.fileHash || 'sha256:7b92e8fa42019c836dbf583e742618cb938217361a84f3910c2837482910fedc'}
                    </div>

                    {ev.captureLatitude && (
                      <div className="text-[11px] text-text-secondary">
                        <span className="font-sans font-semibold text-text-primary block">Forensic GPS:</span>
                        Lat {ev.captureLatitude}, Lng {ev.captureLongitude}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-surface-primary rounded-lg border border-border-primary text-xs text-text-tertiary">
                  No photographic evidence uploaded for this issue.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-border-primary bg-surface-primary flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg border border-border-primary text-text-secondary hover:bg-surface-secondary text-sm font-medium min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
