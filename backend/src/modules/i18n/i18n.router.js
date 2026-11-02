/**
 * Multilingual Architecture API Router
 * Phase 67: Add multilingual architecture
 */

import { Router } from 'express';
import { i18nService } from './i18n.service.js';

export const i18nRouter = Router();

/**
 * GET /i18n/languages
 * Returns configured languages, active languages, and default language.
 */
i18nRouter.get('/languages', (req, res) => {
  res.json({
    defaultLanguage: i18nService.defaultLanguage,
    supportedLanguages: i18nService.getSupportedLanguages(),
    activeLanguages: i18nService.getActiveLanguages(),
  });
});

/**
 * GET /i18n/locales/:lang
 * Returns full localization dictionary for the requested language code.
 */
i18nRouter.get('/locales/:lang', (req, res) => {
  const { lang } = req.params;
  const normalized = String(lang).toLowerCase().trim().slice(0, 2);

  if (!i18nService.isLanguageSupported(normalized)) {
    return res.status(400).json({
      error: `Unsupported language code: ${lang}`,
      supportedLanguages: i18nService.getActiveLanguages().map((l) => l.code),
    });
  }

  const dictionary = i18nService.getLocaleDictionary(normalized);
  res.json({
    language: normalized,
    dictionary,
  });
});

/**
 * GET /i18n/preference
 * Returns saved language preference for user.
 */
i18nRouter.get('/preference', (req, res) => {
  const userId = req.user?.id || req.query.userId;
  const pref = i18nService.getUserPreference(userId);
  res.json(pref);
});

/**
 * PUT /i18n/preference
 * Updates user language preference.
 */
i18nRouter.put('/preference', (req, res) => {
  const userId = req.user?.id || req.body.userId || 'guest-user';
  const { language } = req.body;

  if (!language) {
    return res.status(400).json({ error: 'Language code is required.' });
  }

  try {
    const updated = i18nService.setUserPreference(userId, language, 'API');
    res.json({
      success: true,
      preference: updated,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /i18n/translate
 * Translates text or batch of texts using the BHASHINI translation adapter.
 */
i18nRouter.post('/translate', async (req, res) => {
  const { text, texts, sourceLang = 'en', targetLang = 'hi' } = req.body;

  if (!text && (!texts || !Array.isArray(texts))) {
    return res.status(400).json({
      error: 'Either "text" (string) or "texts" (array of strings) is required.',
    });
  }

  try {
    if (Array.isArray(texts)) {
      const result = await i18nService.translateBatchDynamic({
        texts,
        sourceLang,
        targetLang,
      });
      return res.json(result);
    }

    const result = await i18nService.translateDynamicText({
      text,
      sourceLang,
      targetLang,
    });
    return res.json(result);
  } catch (err) {
    res.status(502).json({
      error: 'Translation provider failed',
      details: err.message,
    });
  }
});

/**
 * GET /i18n/health
 * Checks translation provider health.
 */
i18nRouter.get('/health', async (req, res) => {
  const health = await i18nService.bhashiniAdapter.healthCheck();
  res.json(health);
});
