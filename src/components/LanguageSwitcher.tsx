import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../lib/utils';

export function LanguageSwitcher() {
  const { lang, setLanguage } = useTranslation();
  
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-all duration-200">
        <img 
          src={lang === 'fr' ? 'https://i.imgur.com/yS9Hjy9.png' : 'https://i.imgur.com/NXtMImD.png'} 
          alt={lang} 
          className="w-5 h-5 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="text-sm font-semibold uppercase">{lang}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
        <div className="p-1">
          <button
            onClick={() => setLanguage('fr')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
              lang === 'fr' 
                ? "bg-primary/10 text-primary" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <img src="https://i.imgur.com/yS9Hjy9.png" alt="Français" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
            Français
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
              lang === 'en' 
                ? "bg-primary/10 text-primary" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <img src="https://i.imgur.com/NXtMImD.png" alt="English" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
            English
          </button>
        </div>
      </div>
    </div>
  );
}
