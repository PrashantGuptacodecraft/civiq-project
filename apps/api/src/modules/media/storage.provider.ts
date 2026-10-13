import { createHmac } from 'crypto';
import { StorageObject, StoragePutOptions } from './media.types';

export interface SignedUrlOptions {
  expiresInSeconds?: number;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  putObject(key: string, data: Buffer, options?: StoragePutOptions): Promise<void>;
  getObject(key: string): Promise<StorageObject | null>;
  deleteObject(key: string): Promise<void>;
  copyObject(sourceKey: string, destKey: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  generateSignedUrl(
    key: string,
    operation: 'upload' | 'download',
    options?: SignedUrlOptions
  ): { url: string; token: string; expiresAt: Date };
  verifySignature(key: string, operation: 'upload' | 'download', expiresAt: number, signature: string): boolean;
}

export class MemoryStorageProvider implements IStorageProvider {
  private store: Map<string, StorageObject> = new Map();
  private secretKey: string;
  private baseUrl: string;

  constructor(secretKey: string = 'civiq_media_storage_secret_key_v1', baseUrl: string = '/media') {
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  async putObject(key: string, data: Buffer, options?: StoragePutOptions): Promise<void> {
    const obj: StorageObject = {
      data,
      contentType: options?.contentType ?? 'application/octet-stream',
    };
    if (options?.metadata) {
      obj.metadata = options.metadata;
    }
    this.store.set(key, obj);
  }

  async getObject(key: string): Promise<StorageObject | null> {
    const obj = this.store.get(key);
    if (!obj) return null;
    const result: StorageObject = {
      data: Buffer.from(obj.data),
      contentType: obj.contentType,
    };
    if (obj.metadata) {
      result.metadata = { ...obj.metadata };
    }
    return result;
  }

  async deleteObject(key: string): Promise<void> {
    this.store.delete(key);
  }

  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const source = this.store.get(sourceKey);
    if (!source) {
      throw new Error(`Source object not found: ${sourceKey}`);
    }
    const copy: StorageObject = {
      data: Buffer.from(source.data),
      contentType: source.contentType,
    };
    if (source.metadata) {
      copy.metadata = { ...source.metadata };
    }
    this.store.set(destKey, copy);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  generateSignedUrl(
    key: string,
    operation: 'upload' | 'download',
    options?: SignedUrlOptions
  ): { url: string; token: string; expiresAt: Date } {
    const expiresIn = options?.expiresInSeconds ?? 900; // 15 mins default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const expiresEpoch = Math.floor(expiresAt.getTime() / 1000);

    const payload = `${operation}:${key}:${expiresEpoch}`;
    const signature = createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    // Token bundles key, expires, signature, and operation
    const token = Buffer.from(
      JSON.stringify({ op: operation, key, exp: expiresEpoch, sig: signature })
    ).toString('base64url');

    const url = `${this.baseUrl}/${operation}?token=${token}`;

    return { url, token, expiresAt };
  }

  verifySignature(
    key: string,
    operation: 'upload' | 'download',
    expiresEpoch: number,
    signature: string
  ): boolean {
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (nowEpoch > expiresEpoch) {
      return false; // Expired
    }

    const payload = `${operation}:${key}:${expiresEpoch}`;
    const expected = createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return signature === expected;
  }

  clear(): void {
    this.store.clear();
  }
}

let defaultProvider: IStorageProvider = new MemoryStorageProvider();

export function getStorageProvider(): IStorageProvider {
  return defaultProvider;
}

export function setStorageProvider(provider: IStorageProvider): void {
  defaultProvider = provider;
}
