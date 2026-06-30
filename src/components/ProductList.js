// src/components/ProductList.js
import { t } from '../services/i18n.js';
import { formatPrice, getProductName } from '../utils/helpers.js';
import { addToCart } from '../store/actions.js';

export function ProductList(store) {
    const container = document.createElement('div');
    container.className = 'product-grid';

    const render = () => {
        const state = store.getState();
        const { products, filters, visibleCount, lang } = state;

        // Фильтрация и сортировка
        let filtered = products.filter(p => {
            if (filters.pet && p.category !== filters.pet) return false;
            if (filters.brand && p.brand !== filters.brand) return false;
            if (p.price_rsd > filters.priceMax) return false;
            if (filters.search) {
                const name = getProductName(p, lang).toLowerCase();
                if (!name.includes(filters.search.toLowerCase())) return false;
            }
            return true;
        });
        if (filters.sort === 'price_asc') filtered.sort((a, b) => a.price_rsd - b.price_rsd);
        else if (filters.sort === 'price_desc') filtered.sort((a, b) => b.price_rsd - a.price_rsd);

        // Берём только первые visibleCount
        const visibleProducts = filtered.slice(0, visibleCount);

        if (visibleProducts.length === 0) {
            container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px 0; color:var(--text-secondary);">${t('no_products')}</p>`;
            return;
        }

        let html = '';
        visibleProducts.forEach(p => {
            const name = getProductName(p, lang);
            const stockLabel = p.stock > 0 ? t('in_stock') : t('out_of_stock');
            html += `
                <div class="product-card" data-id="${p.id}">
                    <img src="${p.image}" alt="${name}" loading="lazy">
                    <h3>${name}</h3>
                    <div class="brand">${p.brand}</div>
                    <div class="price">${formatPrice(p.price_rsd, lang)}</div>
                    <div class="stock">${stockLabel} (${p.stock})</div>
                    <button class="add-to-cart" data-id="${p.id}">${t('add_to_cart')}</button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                store.dispatch(addToCart(id, 1));
                globalThis.showToast(t('toast_added'));
            });
        });
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.add-to-cart')) return;
                const id = parseInt(card.dataset.id);
                if (globalThis.openProductDetail) globalThis.openProductDetail(id);
            });
        });
    };

    store.subscribe(render);
    render();
    return container;
}
