import { useStore } from '../store/StoreContext';
import fr from '../locales/fr';
import en from '../locales/en';

const languages = { fr, en };

export function useTranslation() {
  const { language, setLanguage } = useStore();

  const t = (key: keyof typeof fr | string, dynamicValues?: Record<string, string | number>) => {
    let text = languages[language][key as keyof typeof fr] || languages['fr'][key as keyof typeof fr] || key;
    
    if (dynamicValues) {
      Object.entries(dynamicValues).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLang);
    // localStorage is handled in StoreContext
  };

  return { t, lang: language, toggleLanguage, setLanguage };
}
