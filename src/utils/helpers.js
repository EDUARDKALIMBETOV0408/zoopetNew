// src/utils/helpers.js
export function formatPrice(priceRsd, lang = 'ru') {
    const rates = { ru: 1.2, sr: 1.0, en: 117 };
    const codes = { ru: 'RUB', sr: 'RSD', en: 'EUR' };
    const rate = rates[lang] || 1;
    const code = codes[lang] || 'RSD';
    return `${(priceRsd / rate).toFixed(2)} ${code}`;
}

export function getProductName(product, lang) {
    if (!product) return '';
    return product.name?.[lang] || product.name?.ru || 'Без названия';
}

export function getProductAttr(product, attrKey, lang) {
    if (!product || !product.attributes || !product.attributes[attrKey]) return '';
    return product.attributes[attrKey][lang] || product.attributes[attrKey].ru || '';
}
