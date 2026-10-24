import {
  AllowedMimeType,
  ALLOWED_MIME_TYPES,
  FORBIDDEN_EXTENSIONS,
  MAX_MEDIA_SIZE_BYTES,
  ThreatScanResult,
} from '@civiq/shared-contracts';

export { ALLOWED_MIME_TYPES, FORBIDDEN_EXTENSIONS, MAX_MEDIA_SIZE_BYTES };

export class MediaValidator {
  /**
   * Sanitizes filenames to eliminate directory traversal, null bytes, and dangerous characters.
   */
  static sanitizeFilename(rawFilename) {
    if (!rawFilename) return 'attachment.bin';

    // 1. Remove null bytes and carriage returns
    let sanitized = rawFilename.replace(/[\0\r\n]/g, '');

    // 2. Strip directory path separators (prevent path traversal ../ or ..\)
    sanitized = sanitized.replace(/^.*[\\/]/, '');

    // 3. Remove non-whitelisted characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 4. Ensure it doesn't begin with a dot (hidden file) or double dots
    sanitized = sanitized.replace(/^\.+/, '');

    // 5. Default fallback if empty
    if (!sanitized) {
      sanitized = `file_${Date.now()}.bin`;
    }

    return sanitized;
  }

  /**
   * Validates file size constraint.
   */
  static validateSize(sizeBytes, maxBytes = MAX_MEDIA_SIZE_BYTES): { valid; error? } {
    if (sizeBytes <= 0) {
      return { valid: false, error: 'File size must be greater than 0 bytes.' };
    }
    if (sizeBytes > maxBytes) {
      return {
        valid: false,
        error: `File size exceeds the maximum allowed limit of ${maxBytes / (1024 * 1024)}MB.`,
      };
    }
    return { valid: true };
  }

  /**
   * Validates MIME type against the civic platform allowlist.
   */
  static validateMimeType(mimeType): { valid; error? } {
    const normalized = mimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(normalized )) {
      return {
        valid: false,
        error: `Unsupported MIME type "${mimeType}". Allowed types, PNG, WebP, HEIC/HEIF, PDF.`,
      };
    }
    return { valid: true };
  }

  /**
   * Checks for dangerous file extensions.
   */
  static isForbiddenExtension(filename) {
    const extMatch = filename.match(/\.[^.]+$/);
    if (!extMatch) return false;
    const ext = extMatch[0].toLowerCase();
    return FORBIDDEN_EXTENSIONS.has(ext);
  }

  /**
   * Sniffs magic byte headers to detect spoofed content types.
   */
  static verifyMagicBytes(buffer, declaredMimeType): { matches; detectedMime? } {
    if (buffer.length < 4) {
      return { matches: false };
    }

    // JPEG D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return {
        matches: declaredMimeType === 'image/jpeg',
        detectedMime: 'image/jpeg',
      };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return {
        matches: declaredMimeType === 'image/png',
        detectedMime: 'image/png',
      };
    }

    // PDF: %PDF- (25 50 44 46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return {
        matches: declaredMimeType === 'application/pdf',
        detectedMime: 'application/pdf',
      };
    }

    // WebP ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return {
        matches: declaredMimeType === 'image/webp',
        detectedMime: 'image/webp',
      };
    }

    // For HEIC/HEIF or other formats without strict byte check here, allow if declared matches
    if (declaredMimeType === 'image/heic' || declaredMimeType === 'image/heif') {
      return { matches: true, detectedMime: declaredMimeType };
    }

    return { matches: false };
  }

  /**
   * Scans content buffer for known malware signatures and dangerous embedded payloads.
   */
  static scanThreats(buffer, declaredMimeType) {
    // 1. Check size limit
    if (buffer.length > MAX_MEDIA_SIZE_BYTES) {
      return {
        isSafe: false,
        threatType: 'SIZE_EXCEEDED',
        details: `Buffer length ${buffer.length} exceeds max allowed size ${MAX_MEDIA_SIZE_BYTES}`,
      };
    }

    // 2. Check for standard EICAR test string
    const bufferString = buffer.toString('utf-8');
    if (bufferString.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
      return {
        isSafe: false,
        threatType: 'MALWARE_SIGNATURE',
        details: 'Standard anti-malware test signature (EICAR) detected.',
      };
    }

    // 3. Executable binary headers check
    // Windows PE (MZ)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return {
        isSafe: false,
        threatType: 'EXECUTABLE_PAYLOAD',
        details: 'DOS/Windows executable header (MZ) detected in media payload.',
      };
    }

    // Linux ELF
    if (buffer.length >= 4 && buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return {
        isSafe: false,
        threatType: 'EXECUTABLE_PAYLOAD',
        details: 'Linux executable header (ELF) detected in media payload.',
      };
    }

    // 4. Magic byte inspection & MIME spoofing detection
    const magicCheck = this.verifyMagicBytes(buffer, declaredMimeType);
    if (!magicCheck.matches) {
      return {
        isSafe: false,
        threatType: 'MIME_SPOOFING',
        details: `Declared MIME "${declaredMimeType}" does not match file header signature.`,
      };
    }

    // 5. Embedded script inspection in image payloads (Prevent Polyglot XSS)
    if (declaredMimeType.startsWith('image/')) {
      const lower = bufferString.toLowerCase();
      if (
        lower.includes('<script') ||
        lower.includes('javascript:') ||
        lower.includes('<?php') ||
        lower.includes('onload=') ||
        lower.includes('onerror=')
      ) {
        return {
          isSafe: false,
          threatType: 'EMBEDDED_SCRIPT',
          details: 'Malicious active script tags or PHP payload embedded inside image buffer.',
        };
      }
    }

    return { isSafe: true };
  }
}