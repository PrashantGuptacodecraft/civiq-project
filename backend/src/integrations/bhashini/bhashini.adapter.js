/**
 * BHASHINI Live ULCA API Adapter
 * Phase 67: Add multilingual architecture
 *
 * Implements MeitY BHASHINI / ULCA Pipeline Inference API contract.
 * Uses configurable API credentials (BHASHINI_USER_ID, BHASHINI_API_KEY, BHASHINI_INFERENCE_KEY).
 * Falls back safely if API is unreachable.
 */

import { BaseBhashiniAdapter } from './bhashini-adapter.interface.js';
import { BHASHINI_TASK_TYPES, BHASHINI_SOURCE_LABEL } from './bhashini.types.js';

export class BhashiniAdapter extends BaseBhashiniAdapter {
  constructor(options = {}) {
    super({
      ...options,
      sourceName: BHASHINI_SOURCE_LABEL,
      isLiveIntegration: true,
      isMockOrSandbox: false,
    });

    this.userId = options.userId || process.env.BHASHINI_USER_ID || '';
    this.apiKey = options.apiKey || process.env.BHASHINI_API_KEY || '';
    this.inferenceKey = options.inferenceKey || process.env.BHASHINI_INFERENCE_KEY || '';
    this.endpoint = options.endpoint || process.env.BHASHINI_ENDPOINT || 'https://dhruva-api.bhashini.gov.in';
    this.pipelineEndpoint = `${this.endpoint}/services/inference/pipeline`;

    this.cache = new Map();
  }

  isConfigured() {
    return Boolean(this.userId && this.apiKey && this.inferenceKey);
  }

  async translateText({ text, sourceLang = 'en', targetLang = 'hi' }) {
    if (!text || typeof text !== 'string') {
      return {
        translatedText: '',
        sourceLang,
        targetLang,
        provider: this.sourceName,
        cached: false,
      };
    }

    const sLang = this.normalizeLanguage(sourceLang);
    const tLang = this.normalizeLanguage(targetLang);

    if (sLang === tLang) {
      return {
        translatedText: text,
        sourceLang: sLang,
        targetLang: tLang,
        provider: this.sourceName,
        cached: true,
      };
    }

    const cacheKey = `${sLang}:${tLang}:${text}`;
    if (this.cache.has(cacheKey)) {
      return {
        translatedText: this.cache.get(cacheKey),
        sourceLang: sLang,
        targetLang: tLang,
        provider: this.sourceName,
        cached: true,
      };
    }

    if (!this.isConfigured()) {
      throw new Error(
        'BHASHINI live integration is not configured. Missing BHASHINI_USER_ID, BHASHINI_API_KEY, or BHASHINI_INFERENCE_KEY.'
      );
    }

    const payload = {
      pipelineTasks: [
        {
          taskType: BHASHINI_TASK_TYPES.TRANSLATION,
          config: {
            language: {
              sourceLanguage: sLang,
              targetLanguage: tLang,
            },
          },
        },
      ],
      inputData: {
        input: [{ source: text }],
      },
    };

    const startTime = Date.now();
    try {
      const response = await fetch(this.pipelineEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          userId: this.userId,
          ulcaApiKey: this.apiKey,
          Authorization: this.inferenceKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BHASHINI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const output =
        data?.pipelineResponse?.[0]?.output?.[0]?.target ||
        data?.pipelineResponse?.[0]?.output?.[0]?.source ||
        text;

      this.cache.set(cacheKey, output);

      return {
        translatedText: output,
        sourceLang: sLang,
        targetLang: tLang,
        provider: this.sourceName,
        cached: false,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      throw new Error(`BHASHINI translation call failed: ${err.message}`);
    }
  }

  async translateBatch({ texts = [], sourceLang = 'en', targetLang = 'hi' }) {
    const sLang = this.normalizeLanguage(sourceLang);
    const tLang = this.normalizeLanguage(targetLang);

    if (!this.isConfigured()) {
      throw new Error('BHASHINI live integration credentials missing.');
    }

    const payload = {
      pipelineTasks: [
        {
          taskType: BHASHINI_TASK_TYPES.TRANSLATION,
          config: {
            language: {
              sourceLanguage: sLang,
              targetLanguage: tLang,
            },
          },
        },
      ],
      inputData: {
        input: texts.map((t) => ({ source: t })),
      },
    };

    const response = await fetch(this.pipelineEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        userId: this.userId,
        ulcaApiKey: this.apiKey,
        Authorization: this.inferenceKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`BHASHINI batch error (${response.status})`);
    }

    const data = await response.json();
    const outputs = data?.pipelineResponse?.[0]?.output || [];

    const translations = texts.map((source, idx) => ({
      source,
      target: outputs[idx]?.target || source,
    }));

    return {
      translations,
      sourceLang: sLang,
      targetLang: tLang,
      provider: this.sourceName,
    };
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        provider: this.sourceName,
        latencyMs: 0,
        message: 'Credentials unconfigured',
      };
    }

    try {
      const start = Date.now();
      const test = await this.translateText({ text: 'Hello', sourceLang: 'en', targetLang: 'hi' });
      return {
        healthy: Boolean(test?.translatedText),
        provider: this.sourceName,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        healthy: false,
        provider: this.sourceName,
        latencyMs: 0,
        message: err.message,
      };
    }
  }
}
