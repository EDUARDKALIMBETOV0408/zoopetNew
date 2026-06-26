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

    let adminPanelComponent = null;

    document.getElementById('profileCloseBtn').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    function renderAddresses() {
        const user = store.getState().user;
        if (!user) return;
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
        if (!user) return;
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
                    header.after(adminPanelComponent);
                } else {
                    adminPanel.prepend(adminPanelComponent);
                }
            }
            adminPanelComponent.update();
        } else {
            adminPanel.style.display = 'none';
        }
    }

    function open() {
        const user = store.getState().user;
        if (!user) return;
        profFirstName.value = user.firstName || '';
        profLastName.value = user.lastName || '';
        profPhone.value = user.phone || '';
        profEmail.value = user.email || '';
        renderAddresses();
        renderPets();
        profileStatus.textContent = '';
        addAddressForm.classList.remove('open');
        addPetForm.classList.remove('open');
        renderAdminPanel();
        modal.classList.add('open');
    }

    store.subscribe((state) => {
        if (modal.classList.contains('open')) {
            const user = state.user;
            if (user) {
                renderAddresses();
                renderPets();
                renderAdminPanel();
            }
        }
    });

    return { open, modal };
}
