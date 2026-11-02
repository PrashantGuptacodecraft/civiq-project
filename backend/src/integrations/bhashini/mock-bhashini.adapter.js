/**
 * Mock BHASHINI Translation Sandbox Adapter
 * Phase 67: Add multilingual architecture
 *
 * Provides deterministic in-memory translations for civic, municipal, disaster,
 * and safety phrases across English, Hindi, and Marathi, with automatic fallback
 * mock translation for arbitrary inputs.
 */

import { BaseBhashiniAdapter } from './bhashini-adapter.interface.js';

// Pre-seeded civic dictionary for deterministic testing
const CIVIC_TRANSLATIONS = {
  // English to Hindi
  'en:hi': {
    'Pothole': 'गड्ढा',
    'Pothole on Main Road': 'मुख्य सड़क पर गड्ढा',
    'Broken Streetlight': 'टूटी हुई स्ट्रीटलाइट',
    'Water Leakage': 'पानी का रिसाव',
    'Damaged Footpath': 'क्षतिग्रस्त फुटपाथ',
    'Blocked Drain': 'अवरुद्ध नाली',
    'Open Manhole': 'खुला मैनहोल',
    'Garbage Dump': 'कचरे का ढेर',
    'Traffic Signal Failure': 'ट्रैफिक सिग्नल खराबी',
    'Fallen Tree': 'गिरा हुआ पेड़',
    'Waterlogging': 'जलभराव',
    'Active Emergency': 'सक्रिय आपातकाल',
    'Evacuation Order': 'निकासी आदेश',
    'Relief Camp': 'राहत शिविर',
    'Blocked Route': 'अवरुद्ध मार्ग',
    'Help is on the way': 'मदद रास्ते में है',
    'Report Submitted Successfully': 'शिकायत सफलतापूर्वक दर्ज की गई',
    'High Priority': 'उच्च प्राथमिकता',
    'Citizen Report': 'नागरिक रिपोर्ट',
    'Pune Municipal Corporation': 'पुणे महानगरपालिका',
    'Emergency Helpline': 'आपातकालीन हेल्पलाइन',
  },
  // English to Marathi
  'en:mr': {
    'Pothole': 'खड्डा',
    'Pothole on Main Road': 'मुख्य रस्त्यावरील खड्डा',
    'Broken Streetlight': 'बंद किंवा तुटलेला पथदिवा',
    'Water Leakage': 'पाण्याची गळती',
    'Damaged Footpath': 'खराब झालेला पदपथ',
    'Blocked Drain': 'तुंबलेली गटार',
    'Open Manhole': 'उघडे मॅनहोल',
    'Garbage Dump': 'कचऱ्याचा ढीग',
    'Traffic Signal Failure': 'वाहतूक दिवा बिघाड',
    'Fallen Tree': 'पडलेले झाड',
    'Waterlogging': 'पाणी साचणे',
    'Active Emergency': 'सक्रिय आणीबाणी',
    'Evacuation Order': 'स्थलांतर आदेश',
    'Relief Camp': 'मदत केंद्र',
    'Blocked Route': 'बंद रस्ता',
    'Help is on the way': 'मदत मार्गावर आहे',
    'Report Submitted Successfully': 'तक्रार यशस्वीरीत्या नोंदवली गेली',
    'High Priority': 'उच्च प्राधान्य',
    'Citizen Report': 'नागरिक तक्रार',
    'Pune Municipal Corporation': 'पुणे महानगरपालिका',
    'Emergency Helpline': 'तातडीची मदत हेल्पलाइन',
  },
  // Hindi to English
  'hi:en': {
    'गड्ढा': 'Pothole',
    'मुख्य सड़क पर गड्ढा': 'Pothole on Main Road',
    'टूटी हुई स्ट्रीटलाइट': 'Broken Streetlight',
    'पानी का रिसाव': 'Water Leakage',
    'अवरुद्ध नाली': 'Blocked Drain',
    'खुला मैनहोल': 'Open Manhole',
    'कचरे का ढेर': 'Garbage Dump',
    'जलभराव': 'Waterlogging',
  },
  // Marathi to English
  'mr:en': {
    'खड्डा': 'Pothole',
    'मुख्य रस्त्यावरील खड्डा': 'Pothole on Main Road',
    'तुटलेला पथदिवा': 'Broken Streetlight',
    'पाण्याची गळती': 'Water Leakage',
    'तुंबलेली गटार': 'Blocked Drain',
    'उघडे मॅनहोल': 'Open Manhole',
    'कचऱ्याचा ढीग': 'Garbage Dump',
    'पाणी साचणे': 'Waterlogging',
  },
};

export class MockBhashiniAdapter extends BaseBhashiniAdapter {
  constructor(options = {}) {
    super({
      ...options,
      sourceName: 'MOCK_BHASHINI_SANDBOX',
      isLiveIntegration: false,
      isMockOrSandbox: true,
    });
    this.cache = new Map();
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

    // Check predefined civic translations
    const dictKey = `${sLang}:${tLang}`;
    const dict = CIVIC_TRANSLATIONS[dictKey] || {};
    let translated = dict[text.trim()];

    if (!translated) {
      // Deterministic synthetic fallback for testing
      if (tLang === 'hi') {
        translated = `[अनुवाद: ${text}]`;
      } else if (tLang === 'mr') {
        translated = `[भाषांतर: ${text}]`;
      } else {
        translated = `[Translated (${tLang}): ${text}]`;
      }
    }

    this.cache.set(cacheKey, translated);

    return {
      translatedText: translated,
      sourceLang: sLang,
      targetLang: tLang,
      provider: this.sourceName,
      cached: false,
    };
  }

  async translateBatch({ texts = [], sourceLang = 'en', targetLang = 'hi' }) {
    const translations = await Promise.all(
      texts.map(async (text) => {
        const res = await this.translateText({ text, sourceLang, targetLang });
        return {
          source: text,
          target: res.translatedText,
        };
      })
    );

    return {
      translations,
      sourceLang: this.normalizeLanguage(sourceLang),
      targetLang: this.normalizeLanguage(targetLang),
      provider: this.sourceName,
    };
  }

  async healthCheck() {
    return {
      healthy: true,
      provider: this.sourceName,
      latencyMs: 5,
      mode: 'MOCK_SANDBOX',
    };
  }
}
