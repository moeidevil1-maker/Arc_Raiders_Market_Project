import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('app_lang') || 'TH';
    });

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || key;
    };

    const toggleLang = () => {
        setLang(prev => prev === 'TH' ? 'EN' : 'TH');
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
