// src/services/localStorageService.js
const KEYS = {
    PRODUCTS: 'zoopet_products',
    USER: 'zooUser',
    ORDERS: 'zoopet_orders',
    LANG: 'zooLang',
    GITHUB_TOKEN: 'github_token',
};

export const LocalStorageService = {
    loadProducts() {
        try {
            const data = localStorage.getItem(KEYS.PRODUCTS);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    saveProducts(products) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    },
    loadUser() {
        try {
            const data = localStorage.getItem(KEYS.USER);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    saveUser(user) {
        if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
        else localStorage.removeItem(KEYS.USER);
    },
    loadOrders() {
        try {
            const data = localStorage.getItem(KEYS.ORDERS);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    saveOrders(orders) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    },
    loadLang() {
        return localStorage.getItem(KEYS.LANG) || null;
    },
    saveLang(lang) {
        localStorage.setItem(KEYS.LANG, lang);
    },
    loadGitHubToken() {
        return localStorage.getItem(KEYS.GITHUB_TOKEN) || null;
    },
    saveGitHubToken(token) {
        if (token) localStorage.setItem(KEYS.GITHUB_TOKEN, token);
        else localStorage.removeItem(KEYS.GITHUB_TOKEN);
    }
};
