// src/components/ProductDetail.js
import { t } from '../services/i18n.js';
import { formatPrice, getProductName, getProductAttr } from '../utils/helpers.js';
import { addToCart } from '../store/actions.js';

export function ProductDetail(store, productId) {
    const container = document.createElement('div');
    container.className = 'product-detail';

    const render = () => {
        const state = store.getState();
        const product = state.products.find(p => p.id === productId);
        if (!product) {
            container.innerHTML = '<p>Товар не найден</p>';
            return;
        }
        const lang = state.lang;
        const name = getProductName(product, lang);
        const desc = product.description?.[lang] || product.description?.ru || '';
        const weight = getProductAttr(product, 'weight', lang);
        const foodType = getProductAttr(product, 'food_type', lang);
        const age = getProductAttr(product, 'age', lang);
        const stockLabel = product.stock > 0 ? t('in_stock') : t('out_of_stock');
        const addLabel = t('add_to_cart');

        let reviewsHtml = '';
        if (product.reviews && product.reviews.length) {
            reviewsHtml = `<div class="reviews-block"><h5>Отзывы (${product.reviews.length})</h5>`;
            product.reviews.forEach(r => {
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                reviewsHtml += `
                    <div class="review-item">
                        <div class="review-user">${r.user}</div>
                        <div class="review-rating">${stars}</div>
                        <div>${r.comment}</div>
                        <small>${r.date}</small>
                    </div>
                `;
            });
            reviewsHtml += `</div>`;
        } else {
            reviewsHtml = `<div class="reviews-block"><p>Пока нет отзывов. Будьте первым!</p></div>`;
        }

        let reviewFormHtml = '';
        if (state.user && !state.user.isAdmin) {
            reviewFormHtml = `
                <div class="review-form">
                    <h5>Оставить отзыв</h5>
                    <select id="reviewRating">
                        <option value="5">5 ★</option>
                        <option value="4">4 ★</option>
                        <option value="3">3 ★</option>
                        <option value="2">2 ★</option>
                        <option value="1">1 ★</option>
                    </select>
                    <textarea id="reviewComment" placeholder="Ваш комментарий..." rows="3"></textarea>
                    <button id="submitReview" data-product-id="${product.id}">Отправить</button>
                </div>
            `;
        }

        container.innerHTML = `
            <img class="detail-image" src="${product.image}" alt="${name}">
            <div class="detail-header">
                <div>
                    <div class="detail-title">${name}</div>
                    <div class="detail-brand">${product.brand}</div>
                </div>
                <div class="detail-price">${formatPrice(product.price_rsd, lang)}</div>
            </div>
            <div class="detail-stock">${stockLabel} (${product.stock} шт.)</div>
            <div class="detail-description">${desc}</div>
            <div class="detail-attributes">
                <div class="attr-item"><span class="attr-label">${t('weight')}</span><span class="attr-value">${weight}</span></div>
                <div class="attr-item"><span class="attr-label">${t('food_type')}</span><span class="attr-value">${foodType}</span></div>
                <div class="attr-item"><span class="attr-label">${t('age')}</span><span class="attr-value">${age}</span></div>
            </div>
            <button class="btn btn-primary detail-add-btn" data-id="${product.id}">${addLabel}</button>
            ${reviewsHtml}
            ${reviewFormHtml}
        `;

        container.querySelector('.detail-add-btn').addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            store.dispatch(addToCart(id, 1));
            window.showToast(t('toast_added'));
        });

        const submitBtn = container.querySelector('#submitReview');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId);
                const rating = parseInt(document.getElementById('reviewRating').value);
                const comment = document.getElementById('reviewComment').value.trim();
                if (!comment) {
                    alert('Напишите комментарий');
                    return;
                }
                const prod = store.getState().products.find(p => p.id === productId);
                if (!prod) return;
                if (!prod.reviews) prod.reviews = [];
                prod.reviews.push({
                    user: state.user.firstName || 'Пользователь',
                    rating: rating,
                    comment: comment,
                    date: new Date().toLocaleDateString()
                });
                // Сохраняем в localStorage
                import('../services/localStorageService.js').then(({ LocalStorageService }) => {
                    LocalStorageService.saveProducts(store.getState().products);
                });
                render();
                window.showToast('✅ Отзыв добавлен!');
            });
        }
    };

    store.subscribe(render);
    render();
    return container;
}
