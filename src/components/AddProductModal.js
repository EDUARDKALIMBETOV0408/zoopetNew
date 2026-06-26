// src/components/AddProductModal.js
import { addProduct } from '../store/actions.js';
import { LocalStorageService } from '../services/localStorageService.js';
import { GitHubService } from '../services/githubService.js';

export function AddProductModal(store) {
    const modal = document.getElementById('addProductModal');
    const form = document.getElementById('addProductForm');
    const closeBtn = document.getElementById('addProductCloseBtn');
    const cancelBtn = document.getElementById('addProductCancelBtn');
    const statusEl = document.getElementById('addProductStatus');

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const brand = document.getElementById('addBrand').value.trim();
        const category = document.getElementById('addCategory').value.trim();
        const price = parseFloat(document.getElementById('addPrice').value);
        const stock = parseInt(document.getElementById('addStock').value);
        const nameRu = document.getElementById('addNameRu').value.trim();
        if (!brand || !category || !price || !stock || !nameRu) {
            statusEl.textContent = '⚠️ Заполните обязательные поля';
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
        modal.classList.remove('open');
        form.reset();
        statusEl.textContent = '';
        globalThis.renderAll();
        globalThis.showToast('✅ Товар добавлен!');

        const token = GitHubService.getToken();
        if (token) {
            GitHubService.syncProducts(store.getState().products)
                .then(() => globalThis.showToast('✅ Синхронизировано с GitHub'))
                .catch(err => globalThis.showToast('⚠️ Ошибка синхронизации: ' + err.message));
        }
    });

    function open() {
        modal.classList.add('open');
        statusEl.textContent = '';
        form.reset();
    }

    return { open, modal };
}
