// src/components/Pagination.js
import { setPage } from '../store/actions.js';
// t не используется, поэтому импорт удалён

export function Pagination(store) {
    const container = document.createElement('div');
    container.className = 'pagination-controls';

    const render = () => {
        const state = store.getState();
        const { products, filters, page, itemsPerPage } = state;
        const filtered = products.filter(p => {
            if (filters.pet && p.category !== filters.pet) return false;
            if (filters.brand && p.brand !== filters.brand) return false;
            if (p.price_rsd > filters.priceMax) return false;
            if (filters.search) {
                const name = (p.name?.ru || '').toLowerCase();
                if (!name.includes(filters.search.toLowerCase())) return false;
            }
            return true;
        });
        if (filters.sort === 'price_asc') filtered.sort((a, b) => a.price_rsd - b.price_rsd);
        else if (filters.sort === 'price_desc') filtered.sort((a, b) => b.price_rsd - a.price_rsd);

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        const hasMore = page < totalPages;
        container.innerHTML = `
            <button ${page === 1 ? 'disabled' : ''} id="prevPageBtn">← Назад</button>
            <span>Страница ${page} из ${totalPages}</span>
            <button ${!hasMore ? 'disabled' : ''} id="nextPageBtn">Вперёд →</button>
            ${hasMore ? `<button id="loadMoreBtn" class="load-more-btn">Загрузить ещё</button>` : ''}
        `;
        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            if (page > 1) {
                store.dispatch(setPage(page - 1));
                globalThis.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        document.getElementById('nextPageBtn')?.addEventListener('click', () => {
            if (page < totalPages) {
                store.dispatch(setPage(page + 1));
                globalThis.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            if (page < totalPages) {
                store.dispatch(setPage(page + 1));
                globalThis.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    store.subscribe(render);
    render();
    return container;
}
