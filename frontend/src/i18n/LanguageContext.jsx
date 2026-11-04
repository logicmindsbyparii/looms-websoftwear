import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from './translations';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' }
];

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('loomus_lang');
      if (saved && ['en', 'gu', 'hi', 'mr'].includes(saved)) return saved;
    } catch (e) {}
    return 'en';
  });

  const setLang = useCallback((newLang) => {
    if (!['en', 'gu', 'hi', 'mr'].includes(newLang)) return;
    setLangState(newLang);
    try {
      localStorage.setItem('loomus_lang', newLang);
      document.documentElement.lang = newLang;
    } catch (e) {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((path, vars = {}) => {
    if (!path) return '';

    const keys = path.split('.');
    let val = TRANSLATIONS[lang];
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = null;
        break;
      }
    }

    // English Fallback
    if (val === null || val === undefined) {
      let fallbackVal = TRANSLATIONS.en;
      for (const k of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
          fallbackVal = fallbackVal[k];
        } else {
          fallbackVal = null;
          break;
        }
      }
      val = fallbackVal;
    }

    if (typeof val !== 'string') {
      return path;
    }

    // Interpolate variables like {count}, {role}, etc.
    return val.replace(/\{(\w+)\}/g, (match, p1) => {
      return vars[p1] !== undefined ? vars[p1] : match;
    });
  }, [lang]);

  const value = {
    lang,
    setLang,
    t,
    languages: LANGUAGES
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

