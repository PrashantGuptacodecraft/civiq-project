/**
 * Multilingual Express Request Middleware
 * Phase 67: Add multilingual architecture
 *
 * Detects client language preference from query parameters (?lang=),
 * authenticated user profile, or standard Accept-Language request header,
 * and attaches `req.locale` and `req.t()` helper to the request context.
 */

import { i18nService } from './i18n.service.js';

export function i18nMiddleware(options = {}) {
  const service = options.service || i18nService;

  return (req, res, next) => {
    try {
      const queryLang = req.query?.lang;
      const headerLang = req.headers?.['accept-language'];
      const userId = req.user?.id || req.user?.sub;

      const locale = service.resolveLanguage({
        queryLang,
        headerLang,
        userId,
      });

      req.locale = locale;
      req.t = (keyPath, params = {}) => service.translateKey(keyPath, locale, params);

      // Set response header
      res.setHeader('Content-Language', locale);
    } catch (err) {
      req.locale = service.defaultLanguage;
      req.t = (keyPath, params = {}) => service.translateKey(keyPath, service.defaultLanguage, params);
    }

    next();
  };
}
