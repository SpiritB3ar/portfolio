"use client";
import { useLanguage } from '../providers/LanguageProvider';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { lang, changeLanguage } = useLanguage();

  return (
    <button
      onClick={() => changeLanguage(lang === 'en' ? 'es' : 'en')}
      className="
        flex items-center justify-center gap-1.5 h-9 min-w-[3.5rem] px-3 rounded-full
        transition-colors duration-300 border
        border-border bg-card hover:bg-muted
        text-brand-green
      "
      title={lang === 'en' ? "Cambiar a Español" : "Switch to English"}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium tracking-wide">{lang === 'en' ? 'EN' : 'ES'}</span>
    </button>
  );
};
