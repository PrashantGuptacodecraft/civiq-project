/**
 * useTranslation Hook
 * Phase 67: Add multilingual architecture
 */

'use client';

import { useI18n } from './i18n-context.jsx';

export function useTranslation() {
  return useI18n();
}
