// src/components/Cart.js
import { t } from '../services/i18n.js';
import { formatPrice, getProductName } from '../utils/helpers.js';
import { addToCart, removeFromCart } from '../store/actions.js';

export function Cart(store) {
    const container = document.createElement('div');
    container.id = 'cartItemsModal';

    const render = () => {
        const state = store.getState();
        const cart = state.cart;
        if (cart.length === 0) {
            container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding:20px 0;">${t('cart_empty')}</p>`;
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
        // Можно добавить общую сумму, но она уже есть в модалке

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
    };

    store.subscribe(render);
    render();
    return container;
}
