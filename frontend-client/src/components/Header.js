import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './Header.css';

function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <header className="client-header">
      <div className="header-content">
        <h1 className="header-title">{t('app.title') || 'QR Reservation'}</h1>
        <div className="header-controls">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <select 
            value={i18n.language} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="language-select"
          >
            <option value="fr">{t('settings.french')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </div>
      </div>
    </header>
  );
}

export default Header;
