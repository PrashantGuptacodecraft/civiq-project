import { createHmac } from 'crypto';
export class MemoryStorageProvider {
    store = new Map();
    secretKey;
    baseUrl;
    constructor(secretKey = 'civiq_media_storage_secret_key_v1', baseUrl = '/media') {
        this.secretKey = secretKey;
        this.baseUrl = baseUrl;
    }
    async putObject(key, data, options) {
        const obj = {
            data,
            contentType: options?.contentType ?? 'application/octet-stream',
        };
        if (options?.metadata) {
            obj.metadata = options.metadata;
        }
        this.store.set(key, obj);
    }
    async getObject(key) {
        const obj = this.store.get(key);
        if (!obj)
            return null;
        const result = {
            data: Buffer.from(obj.data),
            contentType: obj.contentType,
        };
        if (obj.metadata) {
            result.metadata = { ...obj.metadata };
        }
        return result;
    }
    async deleteObject(key) {
        this.store.delete(key);
    }
    async copyObject(sourceKey, destKey) {
        const source = this.store.get(sourceKey);
        if (!source) {
            throw new Error(`Source object not found: ${sourceKey}`);
        }
        const copy = {
            data: Buffer.from(source.data),
            contentType: source.contentType,
        };
        if (source.metadata) {
            copy.metadata = { ...source.metadata };
        }
        this.store.set(destKey, copy);
    }
    async exists(key) {
        return this.store.has(key);
    }
    generateSignedUrl(key, operation, options) {
        const expiresIn = options?.expiresInSeconds ?? 900; // 15 mins default
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        const expiresEpoch = Math.floor(expiresAt.getTime() / 1000);
        const payload = `${operation}:${key}:${expiresEpoch}`;
        const signature = createHmac('sha256', this.secretKey)
            .update(payload)
            .digest('hex');
        // Token bundles key, expires, signature, and operation
        const token = Buffer.from(JSON.stringify({ op: operation, key, exp: expiresEpoch, sig: signature })).toString('base64url');
        const url = `${this.baseUrl}/${operation}?token=${token}`;
        return { url, token, expiresAt };
    }
    verifySignature(key, operation, expiresEpoch, signature) {
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
    clear() {
        this.store.clear();
    }
}
let defaultProvider = new MemoryStorageProvider();
export function getStorageProvider() {
    return defaultProvider;
}
export function setStorageProvider(provider) {
    defaultProvider = provider;
}
