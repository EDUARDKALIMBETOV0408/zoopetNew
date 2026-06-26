// src/components/Profile.js
import { t } from '../services/i18n.js';
import { LocalStorageService } from '../services/localStorageService.js';
import { setUser } from '../store/actions.js';
import { AdminPanel } from './AdminPanel.js';

export function Profile(store) {
    const modal = document.getElementById('profileModal');
    const profFirstName = document.getElementById('profFirstName');
    const profLastName = document.getElementById('profLastName');
    const profPhone = document.getElementById('profPhone');
    const profEmail = document.getElementById('profEmail');
    const profileAddresses = document.getElementById('profileAddresses');
    const profilePets = document.getElementById('profilePets');
    const addAddressForm = document.getElementById('addAddressForm');
    const addPetForm = document.getElementById('addPetForm');
    const profileStatus = document.getElementById('profileStatus');
    const adminPanel = document.getElementById('adminPanel');

    const nameFieldsGroup = document.getElementById('nameFieldsGroup');
    const phoneFieldGroup = document.getElementById('phoneFieldGroup');
    const emailFieldGroup = document.getElementById('emailFieldGroup');
    const addressesSection = document.getElementById('addressesSection');
    const petsSection = document.getElementById('petsSection');

    let adminPanelComponent = null;

    // Закрытие
    document.getElementById('profileCloseBtn').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    function updateVisibility(user) {
        if (!user) return;
        if (user.isAdmin) {
            if (nameFieldsGroup) nameFieldsGroup.style.display = 'none';
            if (phoneFieldGroup) phoneFieldGroup.style.display = 'none';
            if (emailFieldGroup) emailFieldGroup.style.display = 'none';
            if (addressesSection) addressesSection.style.display = 'none';
            if (petsSection) petsSection.style.display = 'none';
        } else {
            if (nameFieldsGroup) nameFieldsGroup.style.display = 'block';
            if (phoneFieldGroup) phoneFieldGroup.style.display = 'block';
            if (emailFieldGroup) emailFieldGroup.style.display = 'block';
            if (addressesSection) addressesSection.style.display = 'block';
            if (petsSection) petsSection.style.display = 'block';
        }
    }

    function renderAddresses() {
        const user = store.getState().user;
        if (!user || user.isAdmin) return;
        profileAddresses.innerHTML = '';
        if (!user.addresses) user.addresses = [];
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
            profileAddresses.appendChild(div);
        });
        profileAddresses.querySelectorAll('.remove-address').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                const user = store.getState().user;
                if (!user) return;
                user.addresses.splice(idx, 1);
                LocalStorageService.saveUser(user);
                store.dispatch(setUser(user));
                renderAddresses();
            });
        });
    }

    document.getElementById('showAddressFormBtn').addEventListener('click', () => {
        addAddressForm.classList.toggle('open');
    });
    document.getElementById('cancelAddressBtn').addEventListener('click', () => {
        addAddressForm.classList.remove('open');
    });
    document.getElementById('saveAddressBtn').addEventListener('click', function() {
        const street = document.getElementById('addrStreet').value.trim();
        const city = document.getElementById('addrCity').value.trim();
        const postal = document.getElementById('addrPostal').value.trim();
        if (!street || !city || !postal) {
            globalThis.showToast('Заполните все поля');
            return;
        }
        const user = store.getState().user;
        if (!user) return;
        if (!user.addresses) user.addresses = [];
        const isPrimary = user.addresses.length === 0;
        user.addresses.push({ street, city, postal, isPrimary });
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        renderAddresses();
        addAddressForm.classList.remove('open');
        globalThis.showToast(t('toast_profile_saved'));
    });

    function renderPets() {
        const user = store.getState().user;
        if (!user || user.isAdmin) return;
        profilePets.innerHTML = '';
        if (!user.pets) user.pets = [];
        user.pets.forEach((pet, index) => {
            const div = document.createElement('div');
            div.className = 'profile-item';
            div.innerHTML = `
                <div style="flex:1;">
                    <strong>${pet.name}</strong> (${pet.type || ''}) ${pet.birthday ? '— ' + pet.birthday : ''}
                </div>
                <button class="item-remove" data-index="${index}">✕</button>
            `;
            profilePets.appendChild(div);
        });
        profilePets.querySelectorAll('.item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                const user = store.getState().user;
                if (!user) return;
                user.pets.splice(idx, 1);
                LocalStorageService.saveUser(user);
                store.dispatch(setUser(user));
                renderPets();
            });
        });
    }

    document.getElementById('showPetFormBtn').addEventListener('click', () => {
        addPetForm.classList.toggle('open');
    });
    document.getElementById('cancelPetBtn').addEventListener('click', () => {
        addPetForm.classList.remove('open');
    });
    document.getElementById('savePetBtn').addEventListener('click', function() {
        const name = document.getElementById('petName').value.trim();
        const type = document.getElementById('petType').value.trim();
        const birthday = document.getElementById('petBirthday').value;
        if (!name) {
            globalThis.showToast('Введите имя питомца');
            return;
        }
        const user = store.getState().user;
        if (!user) return;
        if (!user.pets) user.pets = [];
        user.pets.push({ name, type, birthday });
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        renderPets();
        addPetForm.classList.remove('open');
        globalThis.showToast(t('toast_profile_saved'));
    });

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = store.getState().user;
        if (!user) return;
        if (user.isAdmin) {
            globalThis.showToast('Администратору не нужно изменять эти данные');
            return;
        }
        user.firstName = profFirstName.value.trim();
        user.lastName = profLastName.value.trim();
        user.phone = profPhone.value.trim();
        LocalStorageService.saveUser(user);
        store.dispatch(setUser(user));
        profileStatus.textContent = t('toast_profile_saved');
        globalThis.showToast(t('toast_profile_saved'));
        globalThis.renderUserArea();
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        store.dispatch(setUser(null));
        LocalStorageService.saveUser(null);
        modal.classList.remove('open');
        globalThis.renderAll();
        globalThis.showToast('👋 Вы вышли из аккаунта');
    });

    function renderAdminPanel() {
        const user = store.getState().user;
        if (user && user.isAdmin) {
            adminPanel.style.display = 'block';
            if (!adminPanelComponent) {
                adminPanelComponent = AdminPanel(store);
                const header = adminPanel.querySelector('h4');
                if (header) {
                    header.after(adminPanelComponent.element);
                } else {
                    adminPanel.prepend(adminPanelComponent.element);
                }
            }
            adminPanelComponent.update();
        } else {
            adminPanel.style.display = 'none';
        }
    }

    function open() {
        console.log('🔵 Profile.open() вызван');
        const user = store.getState().user;
        if (!user) {
            globalThis.showToast('Пожалуйста, войдите в аккаунт');
            return;
        }

        profFirstName.value = user.firstName || '';
        profLastName.value = user.lastName || '';
        profPhone.value = user.phone || '';
        profEmail.value = user.email || '';

        updateVisibility(user);

        if (!user.isAdmin) {
            renderAddresses();
            renderPets();
        } else {
            profileAddresses.innerHTML = '';
            profilePets.innerHTML = '';
        }

        profileStatus.textContent = '';
        addAddressForm.classList.remove('open');
        addPetForm.classList.remove('open');
        renderAdminPanel();
        modal.classList.add('open');
        // Обновляем переводы при открытии
        updateUI();
        console.log('✅ Профиль открыт');
    }

    // === ОБНОВЛЕНИЕ UI ПРИ СМЕНЕ ЯЗЫКА ===
    function updateUI() {
        const user = store.getState().user;
        if (!user || !modal.classList.contains('open')) return;

        // Обновляем все элементы с data-i18n внутри модалки
        const elements = modal.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });

        // Обновляем placeholder'ы
        const placeholders = modal.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });

        // Перерисовываем адреса и питомцев, если они видны
        if (!user.isAdmin) {
            renderAddresses();
            renderPets();
        }

        // Обновляем статус, если он содержит текст, который можно перевести (например, "✅ Данные сохранены!")
        // Мы не будем автоматически переводить статус, потому что он может быть динамическим.
        // Но если он содержит какой-то ключ, можно его обновить, но обычно он устанавливается из t().
        // Поэтому просто оставим как есть.

        // Обновляем админ-панель (она может содержать переводы)
        if (adminPanelComponent) {
            adminPanelComponent.update();
        }

        // Обновляем кнопки, которые могут быть внутри профиля (например, "Сохранить изменения")
        // Они уже обновлены через data-i18n.

        console.log('🔄 Profile UI updated after language change');
    }

    // Подписка на изменения store
    store.subscribe((state) => {
        if (modal.classList.contains('open')) {
            const user = state.user;
            if (user) {
                updateVisibility(user);
                if (!user.isAdmin) {
                    renderAddresses();
                    renderPets();
                } else {
                    profileAddresses.innerHTML = '';
                    profilePets.innerHTML = '';
                }
                renderAdminPanel();
                // При обновлении состояния также обновляем переводы на случай смены языка,
                // но мы уже вызываем updateUI из app.js при смене языка.
                // Здесь можно вызвать updateUI(), но чтобы избежать лишних вызовов, не будем.
                // Однако, если язык изменился через store (например, при инициализации), то это учтётся.
                // Но в подписке мы не знаем, изменился ли язык, поэтому лучше вызывать updateUI при любом обновлении, если модалка открыта.
                // Для простоты вызовем:
                // updateUI();
                // Но это может привести к излишней перерисовке. Лучше вызывать только при смене языка из app.js.
            }
        }
    });

    return { open, modal, updateUI };
}
