// src/components/EditProductModal.js
import { updateProduct } from '../store/actions.js';
import { LocalStorageService } from '../services/localStorageService.js';

export function EditProductModal(store) {
    const modal = document.getElementById('editProductModal');
    const form = document.getElementById('editProductForm');
    const closeBtn = document.getElementById('editProductCloseBtn');

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    form.addEventListener('submit', function(e) {
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
        modal.classList.remove('open');
        window.renderAll();
        window.showToast('✅ Товар обновлён!');
    });

    function open(productId) {
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
        modal.classList.add('open');
    }

    return { open, modal };
}
