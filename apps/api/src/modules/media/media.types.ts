import { MediaScanStatus } from '@civiq/db';
import { AllowedMimeType, ThreatScanResult } from '@civiq/contracts';

export type { AllowedMimeType, ThreatScanResult };

export interface SignedUploadTicket {
  uploadUrl: string;
  token: string;
  evidenceId: string;
  storageKey: string;
  expiresAt: Date;
  maxSizeBytes: number;
  allowedMimeTypes: AllowedMimeType[];
}

export interface SignedDownloadTicket {
  downloadUrl: string;
  token: string;
  evidenceId: string;
  expiresAt: Date;
}

export interface MediaUploadParams {
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  issueId?: string | undefined;
}

export interface MediaProcessResult {
  evidenceId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  fileHash: string;
  scanStatus: MediaScanStatus;
  quarantineReason: string | null;
  isClean: boolean;
}

export interface StorageObject {
  data: Buffer;
  contentType: string;
  metadata?: Record<string, string> | undefined;
}

export interface StoragePutOptions {
  contentType?: string | undefined;
  metadata?: Record<string, string> | undefined;
  isPrivate?: boolean | undefined;
}
