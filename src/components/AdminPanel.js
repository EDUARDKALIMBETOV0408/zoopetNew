// src/components/AdminPanel.js
import { t } from '../services/i18n.js';
import { formatPrice, getProductName } from '../utils/helpers.js';

export function AdminPanel(store) {
    const container = document.createElement('div');
    container.className = 'admin-panel';

    let tabsInitialized = false;

    const render = () => {
        const state = store.getState();
        const products = state.products;
        const orders = state.orders;
        const lang = state.lang;

        // Обновляем список товаров
        const productsList = document.getElementById('adminProductsList');
        if (productsList) {
            let html = '<h5>Список товаров</h5>';
            products.forEach(p => {
                const name = getProductName(p, lang);
                html += `
                    <div class="product-edit-item">
                        <span>${name} (${p.brand}) — ${p.price_rsd} RSD, в наличии: ${p.stock}</span>
                        <button class="edit-btn" data-id="${p.id}">Редактировать</button>
                    </div>
                `;
            });
            productsList.innerHTML = html;
            productsList.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.dataset.id);
                    if (window.openEditProductModal) window.openEditProductModal(id);
                });
            });
        }

        // Обновляем список заказов
        const ordersList = document.getElementById('adminOrdersList');
        if (ordersList) {
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>Заказов пока нет.</p>';
                return;
            }
            let html = '';
            orders.forEach(order => {
                html += `
                    <div class="order-item">
                        <div class="order-header">
                            <span>Заказ #${order.id}</span>
                            <span>${order.date}</span>
                        </div>
                        <div class="order-details">
                            <div>Сумма: ${order.total} RSD</div>
                            <div>Статус: ${order.status}</div>
                            <div>Доставка: ${order.delivery_method}, Оплата: ${order.payment_method}</div>
                            <div>Товары: ${order.items.map(i => i.name).join(', ')}</div>
                        </div>
                    </div>
                `;
            });
            ordersList.innerHTML = html;
        }

        // Инициализация вкладок (один раз)
        if (!tabsInitialized) {
            const tabs = document.querySelectorAll('.admin-tabs button');
            tabs.forEach(btn => {
                btn.addEventListener('click', function() {
                    const tab = this.dataset.adminTab;
                    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
                    const target = document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1));
                    if (target) target.classList.add('active');
                    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
            tabsInitialized = true;
        }
    };

    store.subscribe(render);
    render();
    return container;
}
