// src/components/AuthModal.js
import { t } from '../services/i18n.js';
import { ValidationService } from '../services/validationService.js';
import { LocalStorageService } from '../services/localStorageService.js';
import { setUser } from '../store/actions.js';

export function AuthModal(store) {
    const modal = document.getElementById('authModal');
    const container = modal.querySelector('.modal'); // содержимое уже есть, мы управляем логикой

    // Элементы
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginStatus = document.getElementById('loginStatus');
    const registerStatus = document.getElementById('registerStatus');
    const tabs = document.querySelectorAll('#authTabs button');
    const tabContents = document.querySelectorAll('#authModal .tab-content');
    const closeBtn = document.getElementById('authCloseBtn');

    // Переключение табов
    tabs.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            tabs.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(t => t.classList.remove('active'));
            document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
            loginStatus.textContent = '';
            registerStatus.textContent = '';
        });
    });

    // Закрытие
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    // Логин
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        // Временный админ
        if (email === 'admin@admin.com' && password === 'admin123') {
            const user = { id: 999, email, firstName: 'Admin', lastName: '', phone: '', addresses: [], pets: [], isAdmin: true };
            store.dispatch(setUser(user));
            LocalStorageService.saveUser(user);
            modal.classList.remove('open');
            window.renderAll();
            window.showToast('🔧 Добро пожаловать, администратор!');
            return;
        }

        const saved = LocalStorageService.loadUser();
        if (saved && saved.email === email && saved.password === password) {
            store.dispatch(setUser(saved));
            modal.classList.remove('open');
            window.renderAll();
            window.showToast(t('toast_login'));
            return;
        }
        loginStatus.textContent = t('login_failed');
    });

    // Регистрация
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('regEmail').value.trim();
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const consent = document.getElementById('consentPd').checked;

        if (!consent) {
            registerStatus.textContent = t('consent_required');
            return;
        }
        if (!ValidationService.isPhoneValid(phone)) {
            registerStatus.textContent = t('phone_invalid');
            return;
        }
        const newUser = {
            id: Date.now(),
            email,
            firstName,
            lastName,
            phone,
            password,
            addresses: [],
            pets: [],
            isAdmin: false
        };
        LocalStorageService.saveUser(newUser);
        store.dispatch(setUser(newUser));
        modal.classList.remove('open');
        window.renderAll();
        window.showToast(t('toast_success'));
    });

    // Открытие модалки (вызывается из app.js)
    function open() {
        loginStatus.textContent = '';
        registerStatus.textContent = '';
        // Сброс табов на логин
        tabs.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="login"]').classList.add('active');
        tabContents.forEach(t => t.classList.remove('active'));
        document.getElementById('tabLogin').classList.add('active');
        modal.classList.add('open');
    }

    return { open, modal };
}
