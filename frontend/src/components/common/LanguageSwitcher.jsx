import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher({ variant = 'default' }) {
  const { lang, setLang, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition-all active:scale-95"
        title="Switch Language"
        aria-label="Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-sky-600" />
        <span className="font-semibold">{activeLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLang(item.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between font-medium transition-colors ${
                item.code === lang
                  ? 'bg-sky-50 text-sky-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.nativeName}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{item.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

