import React from 'react';
import { useTranslation } from 'react-i18next';

const supportedLanguages = {
  en: 'English',
  bg: 'Български',
  es: 'Español'
};

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <select 
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="language-switcher"
    >
      {Object.entries(supportedLanguages).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
};