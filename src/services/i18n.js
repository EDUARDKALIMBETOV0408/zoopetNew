// src/services/i18n.js
import translations from '../i18n/translations.js';

let currentLang = 'ru';

export function setLang(lang) {
    if (translations[lang]) currentLang = lang;
}

export function t(key) {
    return translations[currentLang]?.[key] || key;
}

export function getCurrentLang() {
    return currentLang;
}
