import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="language-switcher">
      <label htmlFor="lang-select">{t('header.language')}: </label>
      <select 
        id="lang-select"
        value={i18n.language} 
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="lang-select"
      >
        <option value="fr">{t('header.french')}</option>
        <option value="en">{t('header.english')}</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
