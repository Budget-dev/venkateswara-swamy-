import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TRANSLATIONS } from '../data/translations';
import { useFirebase } from '../hooks/useFirebase';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  
  // Optionally, if we still want to sync with Firebase, we could do it here
  // or we could keep the Firebase sync in AppContext/useFirebase.
  // The user requested LanguageContext and I18nProvider that wraps the App.
  // We'll bring the firebase sync logic here for completeness.
  const firebase = useFirebase();

  useEffect(() => {
    if (firebase.profile?.language) {
      setLanguageState(firebase.profile.language);
    }
  }, [firebase.profile?.language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (firebase.updateProfile) {
      firebase.updateProfile({ language: lang });
    }
  };

  const t = (key: string): string => {
    if (language !== 'en' && TRANSLATIONS[language]?.[key]) {
      return TRANSLATIONS[language][key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return context;
};
