import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.resolvedLanguage || 'en';
    }, [i18n.resolvedLanguage]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="language-switcher">
            <button
                className={i18n.resolvedLanguage === 'en' ? 'active' : ''}
                onClick={() => changeLanguage('en')}
            >
                EN
            </button>
            <span className="divider">|</span>
            <button
                className={i18n.resolvedLanguage === 'he' ? 'active' : ''}
                onClick={() => changeLanguage('he')}
            >
                HE
            </button>
        </div>
    );
};
