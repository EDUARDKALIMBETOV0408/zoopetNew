// src/store/reducers.js
import { ActionTypes } from './actions.js';

const initialState = {
    products: [],
    cart: [],
    user: null,
    orders: [],
    lang: 'ru',
    filters: { pet: '', brand: '', priceMax: Infinity, search: '', sort: 'default' },
    page: 1,
    itemsPerPage: 12,
};

export function rootReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.SET_PRODUCTS:
            return { ...state, products: action.payload };
        case ActionTypes.ADD_PRODUCT:
            return { ...state, products: [...state.products, action.payload] };
        case ActionTypes.UPDATE_PRODUCT: {
            const index = state.products.findIndex(p => p.id === action.payload.id);
            if (index === -1) return state;
            const newProducts = [...state.products];
            newProducts[index] = { ...newProducts[index], ...action.payload };
            return { ...state, products: newProducts };
        }
        case ActionTypes.SET_CART:
            return { ...state, cart: action.payload };
        case ActionTypes.ADD_TO_CART: {
            const { productId, quantity } = action.payload;
            const existing = state.cart.find(item => item.productId === productId);
            let newCart;
            if (existing) {
                newCart = state.cart.map(item =>
                    item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                newCart = [...state.cart, { productId, quantity }];
            }
            newCart = newCart.filter(item => item.quantity > 0);
            return { ...state, cart: newCart };
        }
        case ActionTypes.REMOVE_FROM_CART:
            return { ...state, cart: state.cart.filter(item => item.productId !== action.payload) };
        case ActionTypes.SET_USER:
            return { ...state, user: action.payload };
        case ActionTypes.LOGOUT:
            return { ...state, user: null };
        case ActionTypes.SET_ORDERS:
            return { ...state, orders: action.payload };
        case ActionTypes.ADD_ORDER:
            return { ...state, orders: [...state.orders, action.payload] };
        case ActionTypes.SET_LANG:
            return { ...state, lang: action.payload };
        case ActionTypes.SET_FILTERS:
            return { ...state, filters: { ...state.filters, ...action.payload }, page: 1 };
        case ActionTypes.SET_PAGE:
            return { ...state, page: action.payload };
        default:
            return state;
    }
}
