// src/app.js
import { createStore } from './store/index.js';
import { rootReducer } from './store/reducers.js';
import { 
    setProducts, setUser, setOrders, setLang, 
    setFilters, addToCart, removeFromCart, addOrder,
    setPage
} from './store/actions.js';
import { LocalStorageService } from './services/localStorageService.js';
import { GitHubService } from './services/githubService.js';
import { setLang as setI18nLang, t } from './services/i18n.js';
import { ProductList } from './components/ProductList.js';
import { Pagination } from './components/Pagination.js';
import { AuthModal } from './components/AuthModal.js';
import { Profile } from './components/Profile.js';
import { EditProductModal } from './components/EditProductModal.js';
import { AddProductModal } from './components/AddProductModal.js';
import { Toast } from './components/Toast.js';
import { formatPrice, getProductName } from './utils/helpers.js';

// === Инициализация Store ===
const initialState = {
    products: [],
    cart: [],
    user: null,
    orders: [],
    lang: 'ru',
    filters: { pet: '', brand: '', priceMax: Infinity, search: '', sort: 'default' },
    page: 1,
    itemsPerPage: 12,
};
const store = createStore(initialState, rootReducer);

// === Компоненты ===
const toast = Toast();
const authModal = AuthModal(store);
const profile = Profile(store);
const editProductModal = EditProductModal(store);
const addProductModal = AddProductModal(store);

// Глобальные ссылки (для доступа из компонентов)
window.store = store;
window.toast = toast;
window.t = t;
window.formatPrice = formatPrice;
window.getProductName = getProductName;
window.renderAll = renderAll;
window.showToast = toast.show;
window.openProductDetail = openProductDetail;
window.openEditProductModal = editProductModal.open;
window.openAddProductModal = addProductModal.open;
window.openAuthModal = () => authModal.open();
window.openProfileModal = () => profile.open();

// === Загрузка данных ===
async function loadInitialData() {
    const savedLang = LocalStorageService.loadLang() || 'ru';
    store.dispatch(setLang(savedLang));
    setI18nLang(savedLang);
    updateLangUI(savedLang);

    const user = LocalStorageService.loadUser();
    if (user) store.dispatch(setUser(user));

    let products = LocalStorageService.loadProducts();
    if (!products || products.length === 0) {
        try {
            const resp = await fetch('products.json');
            if (resp.ok) {
                products = await resp.json();
                if (!Array.isArray(products)) products = [];
            }
        } catch (e) {
            products = [];
        }
    }
    store.dispatch(setProducts(products));
    LocalStorageService.saveProducts(products);

    const orders = LocalStorageService.loadOrders() || [];
    store.dispatch(setOrders(orders));

    updateBrandFilter(products);
}

function updateBrandFilter(products) {
    const brands = [...new Set(products.map(p => p.brand))].sort();
    const select = document.getElementById('filterBrand');
    if (select) {
        const current = select.value;
        select.innerHTML = '<option value="">Все</option>';
        brands.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            select.appendChild(opt);
        });
        if (current && brands.includes(current)) select.value = current;
    }
}

function updateLangUI(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// === Рендеринг ===
function renderApp() {
    const productGrid = document.getElementById('productGrid');
    const paginationContainer = document.getElementById('paginationControls');

    if (productGrid) {
        const list = ProductList(store);
        productGrid.parentNode.replaceChild(list, productGrid);
        list.id = 'productGrid';
    }
    if (paginationContainer) {
        const pag = Pagination(store);
        paginationContainer.parentNode.replaceChild(pag, paginationContainer);
        pag.id = 'paginationControls';
    }
    renderCartModal();
    renderUserArea();
    updateUITexts();
    updateCartBadge();
}

function renderCartModal() {
    const container = document.getElementById('cartItemsModal');
    const totalEl = document.getElementById('totalPriceModal');
    if (!container) return;
    const state = store.getState();
    const cart = state.cart;
    if (cart.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding:20px 0;">${t('cart_empty')}</p>`;
        totalEl.textContent = formatPrice(0, state.lang);
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return;
        total += product.price_rsd * item.quantity;
        const name = getProductName(product, state.lang);
        html += `
            <div class="cart-item" data-id="${item.productId}">
                <div style="flex:1;">
                    <h4 style="font-weight:500; font-size:15px;">${name}</h4>
                    <p style="color:var(--text-secondary); font-size:13px;">${item.quantity} × ${formatPrice(product.price_rsd, state.lang)}</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="cart-qty-btn cart-qty-dec" data-id="${item.productId}">−</button>
                    <span style="font-weight:600;">${item.quantity}</span>
                    <button class="cart-qty-btn cart-qty-inc" data-id="${item.productId}">+</button>
                    <button class="cart-item-remove" data-id="${item.productId}">✕</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    totalEl.textContent = formatPrice(total, state.lang);

    container.querySelectorAll('.cart-qty-inc').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            store.dispatch(addToCart(id, 1));
        });
    });
    container.querySelectorAll('.cart-qty-dec').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            store.dispatch(addToCart(id, -1));
        });
    });
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            store.dispatch(removeFromCart(id));
        });
    });
}

function renderUserArea() {
    const area = document.getElementById('userArea');
    if (!area) return;
    const user = store.getState().user;
    if (user) {
        const initial = (user.firstName || 'U')[0].toUpperCase();
        area.innerHTML = `
            <div class="user-area" id="profileBtn" title="Личный кабинет">
                <div class="avatar">${initial}</div>
                <span class="user-name">${user.firstName || 'User'}</span>
            </div>
        `;
    } else {
        area.innerHTML = `
            <button class="login-btn" id="loginBtn" data-i18n="login_btn">Войти</button>
        `;
    }
}

function updateUITexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    document.querySelectorAll('#sortOrder option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = store.getState().cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
    }
}

// === Детали товара ===
function openProductDetail(productId) {
    const state = store.getState();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const container = document.getElementById('productDetail');
    import('./components/ProductDetail.js').then(({ ProductDetail }) => {
        const detail = ProductDetail(store, productId);
        container.innerHTML = '';
        container.appendChild(detail);
        document.getElementById('productModal').classList.add('open');
    });
}

// === Оформление заказа ===
function openCheckoutModal() {
    const state = store.getState();
    if (state.cart.length === 0) {
        toast.show(t('cart_empty'));
        return;
    }
    renderCheckoutAddresses();
    document.getElementById('checkoutTotal').textContent = formatPrice(calculateTotal(), state.lang);
    document.getElementById('checkoutStatus').textContent = '';
    document.getElementById('checkoutModal').classList.add('open');
}

function renderCheckoutAddresses() {
    const container = document.getElementById('checkoutAddresses');
    const user = store.getState().user;
    container.innerHTML = '';
    if (!user || !user.addresses || user.addresses.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary);">${t('no_addresses')}</p>`;
        return;
    }
    user.addresses.forEach(addr => {
        const div = document.createElement('div');
        div.className = 'address-card';
        const badge = addr.isPrimary ? t('address_primary') : t('address_secondary');
        div.innerHTML = `
            <input type="radio" name="checkoutAddress" value="${addr.id || Math.random()}" ${addr.isPrimary ? 'checked' : ''}>
            <div>
                <strong>${addr.street}, ${addr.city}</strong>
                <span class="primary-badge">${badge}</span>
                <br><small>${addr.postal}</small>
            </div>
        `;
        container.appendChild(div);
    });
}

function calculateTotal() {
    const state = store.getState();
    let total = 0;
    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) total += product.price_rsd * item.quantity;
    });
    return total;
}

// === Обработчики для фильтров и языка ===
function initFiltersHandlers() {
    const applyBtn = document.getElementById('applyFilters');
    const searchInput = document.getElementById('searchInput');
    const filterPet = document.getElementById('filterPet');
    const filterBrand = document.getElementById('filterBrand');
    const filterPrice = document.getElementById('filterPriceMax');
    const sortOrder = document.getElementById('sortOrder');

    const updateFilters = () => {
        const pet = filterPet.value;
        const brand = filterBrand.value;
        const priceMax = parseFloat(filterPrice.value) || Infinity;
        const search = searchInput.value.trim();
        const sort = sortOrder.value;
        store.dispatch(setFilters({ pet, brand, priceMax, search, sort }));
    };

    applyBtn.addEventListener('click', updateFilters);
    searchInput.addEventListener('input', () => {
        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(updateFilters, 300);
    });
    filterPet.addEventListener('change', updateFilters);
    filterBrand.addEventListener('change', updateFilters);
    filterPrice.addEventListener('change', updateFilters);
    sortOrder.addEventListener('change', updateFilters);
}

function initLangHandlers() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            if (lang === store.getState().lang) return;
            store.dispatch(setLang(lang));
            setI18nLang(lang);
            LocalStorageService.saveLang(lang);
            updateLangUI(lang);
            renderAll();
            toast.show(`🌐 ${lang.toUpperCase()}`);
        });
    });
}

function initCartHandlers() {
    document.getElementById('cartOpenBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('open');
        renderCartModal();
    });
    document.getElementById('cartCloseBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('open');
    });
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) document.getElementById('cartModal').classList.remove('open');
    });
    document.getElementById('checkoutBtnModal').addEventListener('click', openCheckoutModal);
}

function initCheckoutHandlers() {
    document.getElementById('checkoutAddAddressBtn').addEventListener('click', function() {
        if (!store.getState().user) {
            toast.show('Сначала войдите в аккаунт');
            return;
        }
        document.getElementById('checkoutModal').classList.remove('open');
        profile.open();
        document.getElementById('addAddressForm').classList.add('open');
    });
    document.getElementById('confirmOrderBtn').addEventListener('click', function() {
        const state = store.getState();
        if (state.cart.length === 0) {
            toast.show(t('cart_empty'));
            return;
        }
        const selected = document.querySelector('input[name="checkoutAddress"]:checked');
        if (!selected) {
            document.getElementById('checkoutStatus').textContent = '⚠️ Выберите адрес доставки';
            return;
        }
        const delivery = document.getElementById('deliveryMethod').value;
        const payment = document.getElementById('paymentMethod').value;
        const order = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            items: state.cart.map(item => {
                const product = state.products.find(p => p.id === item.productId);
                return { name: getProductName(product, state.lang), quantity: item.quantity, price: product.price_rsd };
            }),
            total: calculateTotal(),
            delivery_method: delivery,
            payment_method: payment,
            status: 'Ожидает обработки',
            user: state.user ? state.user.email : 'Гость'
        };
        store.dispatch(addOrder(order));
        LocalStorageService.saveOrders([...state.orders, order]);
        state.cart.forEach(item => store.dispatch(removeFromCart(item.productId)));
        document.getElementById('checkoutModal').classList.remove('open');
        renderAll();
        toast.show(t('toast_order'));
    });
    document.getElementById('checkoutCloseBtn').addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('open');
    });
    document.getElementById('checkoutModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) document.getElementById('checkoutModal').classList.remove('open');
    });
}

function initProductModalHandlers() {
    document.getElementById('productCloseBtn').addEventListener('click', () => {
        document.getElementById('productModal').classList.remove('open');
    });
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) document.getElementById('productModal').classList.remove('open');
    });
}

// === Инициализация делегированных обработчиков для пользовательской зоны ===
function initUserAreaHandlers() {
    const userArea = document.getElementById('userArea');
    if (!userArea) return;
    userArea.addEventListener('click', function(e) {
        // Клик по кнопке профиля
        const profileBtn = e.target.closest('#profileBtn');
        if (profileBtn) {
            profile.open();
            return;
        }
        // Клик по кнопке входа
        const loginBtn = e.target.closest('#loginBtn');
        if (loginBtn) {
            authModal.open();
        }
    });
}

// === Общая функция обновления ===
function renderAll() {
    renderApp();
    renderCartModal();
    renderUserArea();
    updateCartBadge();
}

// === Подписка на изменения Store ===
store.subscribe((state) => {
    if (document.getElementById('cartModal').classList.contains('open')) {
        renderCartModal();
    }
    updateCartBadge();
});

// === Инициализация ===
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    renderAll();
    initFiltersHandlers();
    initLangHandlers();
    initCartHandlers();
    initCheckoutHandlers();
    initProductModalHandlers();
    initUserAreaHandlers();   // <-- Один раз навешиваем делегирование

    // Экспорт JSON (из админки)
    document.getElementById('exportJsonBtn').addEventListener('click', function() {
        const products = store.getState().products;
        if (!products.length) {
            toast.show('Нет товаров для экспорта');
            return;
        }
        const dataStr = JSON.stringify(products, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.json';
        a.click();
        URL.revokeObjectURL(url);
        toast.show('📥 JSON скачан!');
    });

    // Загрузка JSON
    document.getElementById('loadJsonBtn').addEventListener('click', async function() {
        const status = document.getElementById('loadJsonStatus');
        try {
            const baseUrl = window.location.pathname.replace(/\/[^/]*$/, '/');
            const resp = await fetch(baseUrl + 'products.json');
            if (!resp.ok) throw new Error('Файл не найден');
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) throw new Error('Файл пуст или невалиден');
            store.dispatch(setProducts(data));
            LocalStorageService.saveProducts(data);
            renderAll();
            status.textContent = '✅ Загружено ' + data.length + ' товаров!';
            status.style.color = 'var(--accent-green)';
            toast.show('✅ Товары загружены');
        } catch (error) {
            status.textContent = '⚠️ Ошибка: ' + error.message;
            status.style.color = 'var(--accent-orange)';
        }
    });

    // GitHub токен
    const tokenInput = document.getElementById('githubTokenInput');
    const saveTokenBtn = document.getElementById('saveGitHubTokenBtn');
    const syncBtn = document.getElementById('syncToGitHubBtn');
    const tokenStatus = document.getElementById('tokenStatus');

    function updateTokenStatusUI() {
        const token = GitHubService.getToken();
        if (token) {
            tokenStatus.textContent = '✅ Токен установлен';
            tokenStatus.style.color = 'var(--accent-green)';
            tokenInput.value = token;
        } else {
            tokenStatus.textContent = '❌ Токен не установлен';
            tokenStatus.style.color = 'var(--accent-orange)';
        }
    }

    saveTokenBtn.addEventListener('click', function() {
        const token = tokenInput.value.trim();
        if (token) {
            GitHubService.setToken(token);
            updateTokenStatusUI();
            toast.show('✅ Токен сохранён!');
        } else {
            toast.show('⚠️ Введите токен');
        }
    });

    syncBtn.addEventListener('click', async function() {
        const products = store.getState().products;
        if (!products.length) {
            toast.show('❌ Товары не загружены');
            return;
        }
        try {
            await GitHubService.syncProducts(products);
            toast.show('✅ Синхронизация с GitHub выполнена!');
        } catch (error) {
            toast.show('❌ Ошибка: ' + error.message);
        }
    });

    updateTokenStatusUI();

    console.log('🐾 ZooPet (рефакторинг с делегированием) загружен!');
});
