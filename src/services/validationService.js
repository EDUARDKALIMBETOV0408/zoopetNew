// src/services/validationService.js
export const ValidationService = {
    isPhoneValid(phone) {
        const cleaned = phone.replace(/\s/g, '');
        return /^\+381[6][0-9]{7,8}$/.test(cleaned);
    },
    isEmailValid(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    isPriceValid(price) {
        return typeof price === 'number' && price >= 0;
    },
    isStockValid(stock) {
        return Number.isInteger(stock) && stock >= 0;
    }
};
