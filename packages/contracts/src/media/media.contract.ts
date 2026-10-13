export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif'
  | 'application/pdf';

export const ALLOWED_MIME_TYPES: readonly AllowedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js',
  '.html', '.htm', '.php', '.py', '.pl', '.jar', '.msi', '.dll',
  '.com', '.scr', '.pif', '.reg', '.wsf', '.cpl',
]);

export interface ThreatScanResult {
  isSafe: boolean;
  threatType?: 'MALWARE_SIGNATURE' | 'EXECUTABLE_PAYLOAD' | 'MIME_SPOOFING' | 'EMBEDDED_SCRIPT' | 'SIZE_EXCEEDED' | 'UNSUPPORTED_TYPE';
  details?: string;
}

export interface MediaScanJobPayload {
  evidenceId: string;
  storageKey: string;
}

export interface MediaScanJobResult {
  evidenceId: string;
  scanStatus: 'CLEAN' | 'QUARANTINED';
  quarantineReason: string | null;
  newStorageKey: string;
  isSafe: boolean;
}
