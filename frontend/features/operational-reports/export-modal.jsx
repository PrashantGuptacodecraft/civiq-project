'use client';
import React, { useState, useEffect } from 'react';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  REDACTION_NOTICE,
} from './types.js';

export function ExportModal({
  isOpen,
  onClose,
  jurisdictionId = 'mh-pune-pmc',
  onExportSuccess,
}) {
  const [reportType, setReportType] = useState(REPORT_TYPES.ISSUES_LIST);
  const [format, setFormat] = useState(REPORT_FORMATS.CSV);
  const [timeRange, setTimeRange] = useState('30d');
  const [isAsync, setIsAsync] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedJob, setCompletedJob] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setCompletedJob(null);

    // Simulate export dispatch
    setTimeout(() => {
      const mockResult = {
        jobId: `rep-job-${Date.now()}`,
        reportType,
        format,
        fileName: `civiq-${reportType.toLowerCase().replace(/_/g, '-')}-${jurisdictionId}.${format.toLowerCase()}`,
        recordCount: reportType === REPORT_TYPES.SLA_PERFORMANCE ? 8 : 124,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        disclaimer: REDACTION_NOTICE,
      };

      setCompletedJob(mockResult);
      setIsGenerating(false);
      if (onExportSuccess) onExportSuccess(mockResult);
    }, 600);
  };

  const handleDownload = () => {
    if (!completedJob) return;

    // Client-side simulated download blob
    const content =
      completedJob.format === 'CSV'
        ? 'ID,Title,Category,Severity,Status,ReportedBy\r\n1,"Road Cavity",roads_pothole,HIGH,SUBMITTED,"[REDACTED_CITIZEN_PII]"'
        : JSON.stringify(
            {
              reportType: completedJob.reportType,
              jurisdiction: jurisdictionId,
              recordCount: completedJob.recordCount,
              disclaimer: completedJob.disclaimer,
            },
            null,
            2
          );

    const blob = new Blob([content], {
      type: completedJob.format === 'CSV' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = completedJob.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="w-full max-w-lg bg-surface-primary rounded-2xl border border-border-primary shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
          <div>
            <h2 id="export-dialog-title" className="text-lg font-bold text-text-primary">
              Export Operational Reports
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Generate jurisdiction-scoped compliance and performance data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close export dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Privacy & Redaction Banner */}
          <div
            className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3.5"
            role="note"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 text-blue-600 shrink-0 mt-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-blue-700 block uppercase tracking-wider text-[11px]">
                  Privacy & Data Protection Notice
                </span>
                <p className="text-text-secondary leading-relaxed">
                  {REDACTION_NOTICE}
                </p>
              </div>
            </div>
          </div>

          {/* Scope Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-primary">
            <span className="font-semibold text-text-secondary">Export Jurisdiction:</span>
            <span className="font-mono font-bold text-text-primary">{jurisdictionId}</span>
          </div>

          {/* Report Type Selector */}
          <div className="space-y-1.5">
            <label htmlFor="report-type" className="font-bold text-text-primary block">
              Report Catalog:
            </label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-surface-primary border border-border-primary rounded-xl px-3 py-2.5 font-medium text-text-primary outline-none focus:border-primary"
            >
              <option value={REPORT_TYPES.ISSUES_LIST}>
                {REPORT_TYPE_LABELS.ISSUES_LIST}
              </option>
              <option value={REPORT_TYPES.SLA_PERFORMANCE}>
                {REPORT_TYPE_LABELS.SLA_PERFORMANCE}
              </option>
              <option value={REPORT_TYPES.AUDIT_SUMMARY}>
                {REPORT_TYPE_LABELS.AUDIT_SUMMARY}
              </option>
            </select>
          </div>

          {/* Format and Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="report-format" className="font-bold text-text-primary block">
                Format:
              </label>
              <select
                id="report-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-surface-primary border border-border-primary rounded-xl px-3 py-2.5 font-medium text-text-primary outline-none focus:border-primary"
              >
                <option value={REPORT_FORMATS.CSV}>CSV (Spreadsheet)</option>
                <option value={REPORT_FORMATS.JSON}>JSON (Structured Data)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-time" className="font-bold text-text-primary block">
                Time Window:
              </label>
              <select
                id="report-time"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full bg-surface-primary border border-border-primary rounded-xl px-3 py-2.5 font-medium text-text-primary outline-none focus:border-primary"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Available</option>
              </select>
            </div>
          </div>

          {/* Asynchronous Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isAsync}
              onChange={(e) => setIsAsync(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border-primary"
            />
            <span className="text-text-secondary">
              Process asynchronously in background (recommended for large data volumes)
            </span>
          </label>

          {/* Completed State */}
          {completedJob && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 animate-in fade-in">
              <div>
                <span className="font-bold text-emerald-700 block">Report Ready</span>
                <span className="text-text-tertiary text-[11px]">
                  {completedJob.fileName} ({completedJob.recordCount} records)
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[36px]"
              >
                Download
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-secondary border-t border-border-primary flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover active:bg-primary-active transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Export</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
