// src/components/Filters.js
import { t } from '../services/i18n.js';
import { setFilters } from '../store/actions.js';

export function Filters(store) {
    const container = document.getElementById('filtersContainer');
    if (!container) return null;

    const updateBrands = (products) => {
        const select = document.getElementById('filterBrand');
        if (!select) return;
        const brands = [...new Set(products.map(p => p.brand))].sort();
        const current = select.value;
        select.innerHTML = '<option value="">Все</option>';
        brands.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            select.appendChild(opt);
        });
        if (current && brands.includes(current)) select.value = current;
    };

    const applyFilters = () => {
        const pet = document.getElementById('filterPet').value;
        const brand = document.getElementById('filterBrand').value;
        const priceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;
        const search = document.getElementById('searchInput').value.trim();
        const sort = document.getElementById('sortOrder').value;
        store.dispatch(setFilters({ pet, brand, priceMax, search, sort }));
    };

    // Навешиваем обработчики (они уже в app.js, но можно здесь)
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(applyFilters, 300);
    });
    document.getElementById('filterPet').addEventListener('change', applyFilters);
    document.getElementById('filterBrand').addEventListener('change', applyFilters);
    document.getElementById('filterPriceMax').addEventListener('change', applyFilters);
    document.getElementById('sortOrder').addEventListener('change', applyFilters);

    // Подписка на обновление брендов при изменении продуктов
    store.subscribe((state) => {
        updateBrands(state.products);
    });

    updateBrands(store.getState().products);
    return container;
}
