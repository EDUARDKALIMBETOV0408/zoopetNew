// src/app.js
import { createStore } from './store/index.js';
import { rootReducer } from './store/reducers.js';
import { 
    setProducts, setUser, setOrders, setLang, 
    setFilters, addToCart, removeFromCart, addOrder,
    setPage, addProduct, updateProduct
} from './store/actions.js';
import { LocalStorageService } from './services/localStorageService.js';
import { GitHubService } from './services/githubService.js';
import { ValidationService } from './services/validationService.js';
import { setLang as setI18nLang, t, getCurrentLang } from './services/i18n.js';
import { ProductList } from './components/ProductList.js';
import { Cart } from './components/Cart.js';
import { Filters } from './components/Filters.js';
import { Pagination } from './components/Pagination.js';
import { AuthModal } from './components/AuthModal.js';
import { Profile } from './components/Profile.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ProductDetail } from './components/ProductDetail.js';
import { EditProductModal } from './components/EditProductModal.js';
import { AddProductModal } from './components/AddProductModal.js';
import { Toast } from './components/Toast.js';
import { formatPrice, getProductName } from './utils/helpers.js';
import { mount, createElement } from './utils/dom.js';

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

// === Глобальные ссылки для компонентов ===
const components = {};

// === Загрузка данных ===
async function loadInitialData() {
    // Язык
    const savedLang = LocalStorageService.loadLang() || 'ru';
    store.dispatch(setLang(savedLang));
    setI18nLang(savedLang);
    updateLangUI(savedLang);

    // Пользователь
    const user = LocalStorageService.loadUser();
    if (user) {
        store.dispatch(setUser(user));
    }

    // Товары
    let products = LocalStorageService.loadProducts();
    if (!products || products.length === 0) {
        try {
            const resp = await fetch('products.json');
            if (resp.ok) {
                products = await resp.json();
                if (!Array.isArray(products)) products = [];
            }
        } catch (e) {
            console.warn('Не удалось загрузить products.json', e);
            products = [];
        }
    }
    store.dispatch(setProducts(products));
    LocalStorageService.saveProducts(products);

    // Заказы
    const orders = LocalStorageService.loadOrders() || [];
    store.dispatch(setOrders(orders));

    // Обновить фильтр брендов
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

// === Рендеринг компонентов ===
function renderApp() {
    const productGrid = document.getElementById('productGrid');
    const paginationContainer = document.getElementById('paginationControls');
    const filtersContainer = document.getElementById('filtersContainer');

    // Очищаем контейнеры (но сохраняем сами элементы)
    if (productGrid) {
        const list = ProductList(store);
        productGrid.parentNode.replaceChild(list, productGrid);
        list.id = 'productGrid';
        components.productList = list;
    }

    if (paginationContainer) {
        const pag = Pagination(store);
        paginationContainer.parentNode.replaceChild(pag, paginationContainer);
        pag.id = 'paginationControls';
        components.pagination = pag;
    }

    // Фильтры инициализируются отдельно
    if (filtersContainer) {
        // Фильтры уже есть в разметке, навешиваем обработчики (см. ниже)
    }

    // Корзина (рендерится внутри модалки, но можно обновлять при изменении)
    renderCartModal();

    // Обновить пользовательскую зону
    renderUserArea();

    // Обновить админ-панель, если открыта
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && adminPanel.style.display !== 'none') {
        // Инициализация админ-панели уже произошла, обновляем списки
        if (components.adminPanel) {
            components.adminPanel.update();
        }
    }
}

// === Рендеринг корзины в модалке ===
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

    // Обработчики
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
    const state = store.getState();
    const user = state.user;
    if (user) {
        const initial = (user.firstName || 'U')[0].toUpperCase();
        area.innerHTML = `
            <div class="user-area" id="profileBtn" title="Личный кабинет">
                <div class="avatar">${initial}</div>
                <span class="user-name">${user.firstName || 'User'}</span>
            </div>
        `;
        document.getElementById('profileBtn').addEventListener('click', () => openProfileModal());
    } else {
        area.innerHTML = `
            <button class="login-btn" id="loginBtn" data-i18n="login_btn">Войти</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => openAuthModal());
    }
}

// === Модальные функции (глобальные для простоты) ===
function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// === Авторизация ===
function openAuthModal() {
    document.getElementById('loginStatus').textContent = '';
    document.getElementById('registerStatus').textContent = '';
    document.querySelectorAll('#authTabs button').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="login"]').classList.add('active');
    document.querySelectorAll('#authModal .tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tabLogin').classList.add('active');
    openModal('authModal');
}

// Обработчики форм (уже в разметке, но навесим через app.js)
function initAuthHandlers() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        // Проверка администратора (временно)
        if (email === 'admin@admin.com' && password === 'admin123') {
            const user = { id: 999, email, firstName: 'Admin', lastName: '', phone: '', addresses: [], pets: [], isAdmin: true };
            store.dispatch(setUser(user));
            LocalStorageService.saveUser(user);
            closeModal('authModal');
            renderAll();
            showToast('🔧 Добро пожаловать, администратор!');
            return;
        }
        const saved = LocalStorageService.loadUser();
        if (saved && saved.email === email && saved.password === password) {
            store.dispatch(setUser(saved));
            closeModal('authModal');
            renderAll();
            showToast(t('toast_login'));
            return;
        }
        document.getElementById('loginStatus').textContent = t('login_failed');
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('regEmail').value.trim();
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const consent = document.getElementById('consentPd').checked;
        if (!consent) {
            document.getElementById('registerStatus').textContent = t('consent_required');
            return;
        }
        if (!ValidationService.isPhoneValid(phone)) {
            document.getElementById('registerStatus').textContent = t('phone_invalid');
            return;
        }
        const newUser = {
            id: Date.now(),
            email,
            firstName,
            lastName,
            phone,
            password, // позже убрать
            addresses: [],
            pets: [],
            isAdmin: false
        };
        LocalStorageService.saveUser(newUser);
        store.dispatch(setUser(newUser));
        closeModal('authModal');
        renderAll();
        showToast(t('toast_success'));
    });

    document.querySelectorAll('#authTabs button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('#authTabs button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('#authModal .tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
            document.getElementById('loginStatus').textContent = '';
            document.getElementById('registerStatus').textContent = '';
        });
    });

    document.getElementById('authCloseBtn').addEventListener('click', () => closeModal('authModal'));
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('authModal');
    });
}

// === Профиль ===
function openProfileModal() {
    const state = store.getState();
    if (!state.user) return;
    const user = state.user;
    document.getElementById('profFirstName').value = user.firstName || '';
    document.getElementById('profLastName').value = user.lastName || '';
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profEmail').value = user.email || '';
    renderProfileAddresses();
    renderProfilePets();
    document.getElementById('profileStatus').textContent = '';
    document.getElementById('addAddressForm').classList.remove('open');
    document.getElementById('addPetForm').classList.remove('open');

    const adminPanel = document.getElementById('adminPanel');
    if (user.isAdmin) {
        adminPanel.style.display = 'block';
        if (!components.adminPanel) {
            components.adminPanel = AdminPanel(store);
            const container = document.getElementById('adminPanel');
            // Вставляем админ-панель после существующего заголовка
            const existing = container.querySelector('.admin-tabs');
            if (existing) {
                container.insertBefore(components.adminPanel, existing);
            } else {
                container.appendChild(components.adminPanel);
            }
        }
        components.adminPanel.update();
    } else {
        adminPanel.style.display = 'none';
    }
    openModal('profileModal');
}

function renderProfileAddresses() {
    const container = document.getElementById('profileAddresses');
    const state = store.getState();
    const user = state.user;
    container.innerHTML = '';
    if (!user || !user.addresses) return;
    user.addresses.forEach((addr, index) => {
        const div = document.createElement('div');
        div.className = 'address-card';
        const badge = addr.isPrimary ? t('address_primary') : t('address_secondary');
        div.innerHTML = `
            <div style="flex:1;">
                <strong>${addr.street}, ${addr.city}</strong>
                <span class="primary-badge">${badge}</span>
                <br><small>${addr.postal}</small>
            </div>
            <button class="remove-address" data-index="${index}" style="background:none; border:none; color:#c0392b; font-size:20px; cursor:pointer;">✕</button>
        `;
        container.appendChild(div);
    });
    container.querySelectorAll('.remove-address').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const user = store.getState().user;
            if (!user) return;
            user.addresses.splice(idx, 1);
            LocalStorageService.saveUser(user);
            store.dispatch(setUser(user));
            renderProfileAddresses();
        });
    });
}

function renderProfilePets() {
    const container = document.getElementById('profilePets');
    const state = store.getState();
    const user = state.user;
    container.innerHTML = '';
    if (!user || !user.pets) return;
    user.pets.forEach((pet, index) => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        div.innerHTML = `
            <div style="flex:1;">
                <strong>${pet.name}</strong> (${pet.type || ''}) ${pet.birthday ? '— ' + pet.birthday : ''}
            </div>
            <button class="item-remove" data-index="${index}">✕</button>
        `;
        container.appendChild(div);
    });
    container.querySelectorAll('.item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const user = store.getState().user;
            if (!user) return;
            user.pets.splice(idx, 1);
            LocalStorageService.saveUser(user);
            store.dispatch(setUser(user));
            renderProfilePets();
        });
    });
}

function initProfileHandlers() {
    document.getElementById('showAddressFormBtn').addEventListener('click', () => {
        document.getElementById('addAddressForm').classList.toggle('open');
    });
    document.getElementById('cancelAddressBtn').addEventListener('click', () => {
        document.getElementById('addAddressForm').classList.remove('open');
    });
    document.getElementById('saveAddressBtn').addEventListener('click', function() {
        const street = document.getElementById('addrStreet').value.trim();
        const city = document.getElementById('addrCity').value.trim();
        const postal = document.getElementById('addrPostal').value.trim();
        if (!street || !city || !postal) {
            showToast('Заполните все поля');
            return;
        }
        const user = store.getState().user;
        if (!user) return;
        if (!user.addresses) user.addresses = [];
        const isPrimary = user.addresses.length === 0;
        user.addresses.push({ street, city, postal, isPrimary });
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        renderProfileAddresses();
        document.getElementById('addAddressForm').classList.remove('open');
        showToast(t('toast_profile_saved'));
    });

    document.getElementById('showPetFormBtn').addEventListener('click', () => {
        document.getElementById('addPetForm').classList.toggle('open');
    });
    document.getElementById('cancelPetBtn').addEventListener('click', () => {
        document.getElementById('addPetForm').classList.remove('open');
    });
    document.getElementById('savePetBtn').addEventListener('click', function() {
        const name = document.getElementById('petName').value.trim();
        const type = document.getElementById('petType').value.trim();
        const birthday = document.getElementById('petBirthday').value;
        if (!name) {
            showToast('Введите имя питомца');
            return;
        }
        const user = store.getState().user;
        if (!user) return;
        if (!user.pets) user.pets = [];
        user.pets.push({ name, type, birthday });
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        renderProfilePets();
        document.getElementById('addPetForm').classList.remove('open');
        showToast(t('toast_profile_saved'));
    });

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = store.getState().user;
        if (!user) return;
        user.firstName = document.getElementById('profFirstName').value.trim();
        user.lastName = document.getElementById('profLastName').value.trim();
        user.phone = document.getElementById('profPhone').value.trim();
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        document.getElementById('profileStatus').textContent = t('toast_profile_saved');
        showToast(t('toast_profile_saved'));
        renderUserArea();
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        store.dispatch(setUser(null));
        LocalStorageService.saveUser(null);
        closeModal('profileModal');
        renderAll();
        showToast('👋 Вы вышли из аккаунта');
    });

    document.getElementById('profileCloseBtn').addEventListener('click', () => closeModal('profileModal'));
    document.getElementById('profileModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('profileModal');
    });
}

// === Корзина и оформление заказа ===
function initCartHandlers() {
    document.getElementById('cartOpenBtn').addEventListener('click', function() {
        openModal('cartModal');
        renderCartModal();
    });
    document.getElementById('cartCloseBtn').addEventListener('click', () => closeModal('cartModal'));
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('cartModal');
    });

    document.getElementById('checkoutBtnModal').addEventListener('click', function() {
        if (store.getState().cart.length === 0) {
            showToast(t('cart_empty'));
            return;
        }
        openCheckoutModal();
    });
}

function openCheckoutModal() {
    const state = store.getState();
    if (state.cart.length === 0) {
        showToast(t('cart_empty'));
        return;
    }
    renderCheckoutAddresses();
    document.getElementById('checkoutTotal').textContent = formatPrice(calculateTotal(), state.lang);
    document.getElementById('checkoutStatus').textContent = '';
    openModal('checkoutModal');
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

function initCheckoutHandlers() {
    document.getElementById('checkoutAddAddressBtn').addEventListener('click', function() {
        if (!store.getState().user) {
            showToast('Сначала войдите в аккаунт');
            return;
        }
        closeModal('checkoutModal');
        openProfileModal();
        document.getElementById('addAddressForm').classList.add('open');
    });

    document.getElementById('confirmOrderBtn').addEventListener('click', function() {
        const state = store.getState();
        if (state.cart.length === 0) {
            showToast(t('cart_empty'));
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
        // Очистить корзину
        state.cart.forEach(item => store.dispatch(removeFromCart(item.productId)));
        closeModal('checkoutModal');
        renderAll();
        showToast(t('toast_order'));
    });

    document.getElementById('checkoutCloseBtn').addEventListener('click', () => closeModal('checkoutModal'));
    document.getElementById('checkoutModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('checkoutModal');
    });
}

// === Фильтры и поиск ===
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

// === Язык ===
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
            showToast(`🌐 ${lang.toUpperCase()}`);
        });
    });
}

// === Toast ===
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// === Product Detail ===
function openProductDetail(productId) {
    const state = store.getState();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const container = document.getElementById('productDetail');
    // Используем компонент ProductDetail для рендеринга
    const detailComponent = ProductDetail(store, productId);
    container.innerHTML = '';
    container.appendChild(detailComponent);
    openModal('productModal');
}

function initProductDetailHandlers() {
    document.getElementById('productCloseBtn').addEventListener('click', () => closeModal('productModal'));
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('productModal');
    });
}

// === Admin: добавление товара (модалка) ===
function initAdminHandlers() {
    // Открытие модалки добавления
    document.getElementById('openAddProductBtn').addEventListener('click', function() {
        openAddProductModal();
    });

    document.getElementById('addProductCloseBtn').addEventListener('click', () => closeModal('addProductModal'));
    document.getElementById('addProductCancelBtn').addEventListener('click', () => closeModal('addProductModal'));
    document.getElementById('addProductModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('addProductModal');
    });

    // Форма добавления
    document.getElementById('addProductForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const brand = document.getElementById('addBrand').value.trim();
        const category = document.getElementById('addCategory').value.trim();
        const price = parseFloat(document.getElementById('addPrice').value);
        const stock = parseInt(document.getElementById('addStock').value);
        const nameRu = document.getElementById('addNameRu').value.trim();
        if (!brand || !category || !price || !stock || !nameRu) {
            document.getElementById('addProductStatus').textContent = '⚠️ Заполните обязательные поля';
            return;
        }
        const image = document.getElementById('addImage').value.trim() || 'https://placehold.co/300x300/ccc?text=Новый+товар';
        const nameSr = document.getElementById('addNameSr').value.trim() || nameRu;
        const nameEn = document.getElementById('addNameEn').value.trim() || nameRu;
        const descRu = document.getElementById('addDescRu').value.trim();
        const descSr = document.getElementById('addDescSr').value.trim() || descRu;
        const descEn = document.getElementById('addDescEn').value.trim() || descRu;
        const weightRu = document.getElementById('addWeightRu').value.trim() || '—';
        const foodRu = document.getElementById('addFoodRu').value.trim() || '—';
        const ageRu = document.getElementById('addAgeRu').value.trim() || '—';

        const newProduct = {
            id: Date.now(),
            brand,
            category,
            price_rsd: price,
            stock: stock,
            image: image,
            name: { ru: nameRu, sr: nameSr, en: nameEn },
            description: { ru: descRu, sr: descSr, en: descEn },
            attributes: {
                weight: { ru: weightRu, sr: weightRu, en: weightRu },
                food_type: { ru: foodRu, sr: foodRu, en: foodRu },
                age: { ru: ageRu, sr: ageRu, en: ageRu }
            },
            reviews: []
        };
        store.dispatch(addProduct(newProduct));
        LocalStorageService.saveProducts(store.getState().products);
        closeModal('addProductModal');
        renderAll();
        showToast('✅ Товар добавлен!');
        // Синхронизация с GitHub
        const token = GitHubService.getToken();
        if (token) {
            GitHubService.syncProducts(store.getState().products)
                .then(() => showToast('✅ Синхронизировано с GitHub'))
                .catch(err => showToast('⚠️ Ошибка синхронизации: ' + err.message));
        }
    });

    // Экспорт JSON
    document.getElementById('exportJsonBtn').addEventListener('click', function() {
        const products = store.getState().products;
        if (!products.length) {
            showToast('Нет товаров для экспорта');
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
        showToast('📥 JSON скачан!');
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
            showToast('✅ Товары загружены');
        } catch (error) {
            status.textContent = '⚠️ Ошибка: ' + error.message;
            status.style.color = 'var(--accent-orange)';
        }
    });

    // GitHub токен и синхронизация
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
            showToast('✅ Токен сохранён!');
        } else {
            showToast('⚠️ Введите токен');
        }
    });

    syncBtn.addEventListener('click', async function() {
        const products = store.getState().products;
        if (!products.length) {
            showToast('❌ Товары не загружены');
            return;
        }
        try {
            await GitHubService.syncProducts(products);
            showToast('✅ Синхронизация с GitHub выполнена!');
        } catch (error) {
            showToast('❌ Ошибка: ' + error.message);
        }
    });

    updateTokenStatusUI();
}

function openAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('addProductStatus').textContent = '';
        document.getElementById('addProductForm').reset();
    }
}

// === Редактирование товара ===
function initEditProductHandlers() {
    document.getElementById('editProductCloseBtn').addEventListener('click', () => closeModal('editProductModal'));
    document.getElementById('editProductModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal('editProductModal');
    });

    document.getElementById('editProductForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('editProductId').value);
        const product = store.getState().products.find(p => p.id === id);
        if (!product) return;
        const updated = {
            ...product,
            price_rsd: parseFloat(document.getElementById('editPrice').value),
            stock: parseInt(document.getElementById('editStock').value),
            name: {
                ru: document.getElementById('editNameRu').value.trim(),
                sr: document.getElementById('editNameSr').value.trim(),
                en: document.getElementById('editNameEn').value.trim()
            },
            description: {
                ru: document.getElementById('editDescRu').value.trim(),
                sr: document.getElementById('editDescSr').value.trim(),
                en: document.getElementById('editDescEn').value.trim()
            }
        };
        store.dispatch(updateProduct(updated));
        LocalStorageService.saveProducts(store.getState().products);
        closeModal('editProductModal');
        renderAll();
        showToast('✅ Товар обновлён!');
    });
}

function openEditProductModal(productId) {
    const product = store.getState().products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('editProductId').value = productId;
    document.getElementById('editPrice').value = product.price_rsd;
    document.getElementById('editStock').value = product.stock;
    document.getElementById('editNameRu').value = product.name?.ru || '';
    document.getElementById('editNameSr').value = product.name?.sr || '';
    document.getElementById('editNameEn').value = product.name?.en || '';
    document.getElementById('editDescRu').value = product.description?.ru || '';
    document.getElementById('editDescSr').value = product.description?.sr || '';
    document.getElementById('editDescEn').value = product.description?.en || '';
    openModal('editProductModal');
}

// === Обновление всей страницы ===
function renderAll() {
    renderApp();
    renderCartModal();
    renderUserArea();
    updateCartBadge();
    // Обновить тексты (i18n)
    updateUITexts();
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

// === Подписка на изменения Store ===
store.subscribe((state) => {
    // Обновляем корзину, если модалка открыта
    if (document.getElementById('cartModal').classList.contains('open')) {
        renderCartModal();
    }
    updateCartBadge();
    // Обновляем админ-панель, если она видна
    if (components.adminPanel && document.getElementById('adminPanel').style.display !== 'none') {
        components.adminPanel.update();
    }
});

// === Инициализация ===
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    renderAll();
    initAuthHandlers();
    initProfileHandlers();
    initCartHandlers();
    initCheckoutHandlers();
    initFiltersHandlers();
    initLangHandlers();
    initProductDetailHandlers();
    initAdminHandlers();
    initEditProductHandlers();

    // Делаем функции глобально доступными для компонентов (временное решение)
    window.openProductDetail = openProductDetail;
    window.openEditProductModal = openEditProductModal;
    window.openAddProductModal = openAddProductModal;
    window.showToast = showToast;
    window.t = t;
    window.store = store;

    console.log('🐾 ZooPet (рефакторинг) загружен!');
});
