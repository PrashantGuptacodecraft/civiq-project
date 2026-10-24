import { MediaScanStatus } from '@civiq/shared-db';
import { AllowedMimeType, ThreatScanResult } from '@civiq/shared-contracts';

export interface SignedUploadTicket {
  uploadUrl;
  token;
  evidenceId;
  storageKey;
  expiresAt;
  maxSizeBytes;
  allowedMimeTypes;
}

export interface SignedDownloadTicket {
  downloadUrl;
  token;
  evidenceId;
  expiresAt;
}

export interface MediaUploadParams {
  userId;
  filename;
  mimeType;
  sizeBytes;
  issueId?;
}

export interface MediaProcessResult {
  evidenceId;
  storageKey;
  mimeType;
  sizeBytes;
  fileHash;
  scanStatus;
  quarantineReason;
  isClean;
}

export interface StorageObject {
  data;
  contentType;
  metadata?, string> | undefined;
}

export interface StoragePutOptions {
  contentType?;
  metadata?, string> | undefined;
  isPrivate?;
}