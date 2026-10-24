'use client';

import React, { useRef } from 'react';

export interface UploadFile {
  name;
  size;
  type;
  previewUrl?;
}

interface UploadZoneProps {
  files;
  onAddFiles: (newFiles) => void;
  onRemoveFile: (index) => void;
  maxFiles?;
}

export function UploadZone({
  files,
  onAddFiles,
  onRemoveFile,
  maxFiles = 3,
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;

    const validNewFiles = [];
    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Validate file size (< 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 10MB limit.`);
        continue;
      }

      // Valid mime types: images
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image. Only photos are supported.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validNewFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    }

    if (validNewFiles.length > 0) {
      onAddFiles(validNewFiles);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-text-primary">
          Attach Photos / Evidence <span className="text-text-tertiary font-normal">(Optional)</span>
        </label>
        <span className="text-xs text-text-tertiary">
          {files.length} / {maxFiles} photos
        </span>
      </div>
      <p className="text-xs text-text-secondary">
        Clear photos help verification officers prioritize repairs faster.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="evidence-file-input"
      />

      {files.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload photo evidence"
          className="border-2 border-dashed border-border-primary hover:border-primary/50 bg-surface-secondary/50 hover:bg-surface-secondary rounded-xl p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-h-[96px] flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-primary">Tap to take photo or upload</span>
            <span className="text-[11px] text-text-tertiary block mt-0.5">PNG, JPG, or WebP up to 10MB</span>
          </div>
        </div>
      )}

      {/* Thumbnails list */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="relative group rounded-lg overflow-hidden border border-border-primary bg-surface-elevated aspect-square flex flex-col items-center justify-center text-center p-2"
            >
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="text-[10px] text-text-secondary truncate max-w-full font-medium">
                  {file.name}
                </span>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(idx);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface-primary/90 text-text-primary hover:bg-red-600 hover:text-white flex items-center justify-center text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[24px] min-w-[24px]"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}