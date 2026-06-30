// src/store/actions.js
export const ActionTypes = {
    SET_PRODUCTS: 'SET_PRODUCTS',
    ADD_PRODUCT: 'ADD_PRODUCT',
    UPDATE_PRODUCT: 'UPDATE_PRODUCT',
    SET_CART: 'SET_CART',
    ADD_TO_CART: 'ADD_TO_CART',
    REMOVE_FROM_CART: 'REMOVE_FROM_CART',
    SET_USER: 'SET_USER',
    LOGOUT: 'LOGOUT',
    SET_ORDERS: 'SET_ORDERS',
    ADD_ORDER: 'ADD_ORDER',
    SET_LANG: 'SET_LANG',
    SET_FILTERS: 'SET_FILTERS',
    SET_VISIBLE_COUNT: 'SET_VISIBLE_COUNT', // новое
};

export const setProducts = (products) => ({ type: ActionTypes.SET_PRODUCTS, payload: products });
export const addProduct = (product) => ({ type: ActionTypes.ADD_PRODUCT, payload: product });
export const updateProduct = (product) => ({ type: ActionTypes.UPDATE_PRODUCT, payload: product });
export const setCart = (cart) => ({ type: ActionTypes.SET_CART, payload: cart });
export const addToCart = (productId, quantity = 1) => ({ type: ActionTypes.ADD_TO_CART, payload: { productId, quantity } });
export const removeFromCart = (productId) => ({ type: ActionTypes.REMOVE_FROM_CART, payload: productId });
export const setUser = (user) => ({ type: ActionTypes.SET_USER, payload: user });
export const logout = () => ({ type: ActionTypes.LOGOUT });
export const setOrders = (orders) => ({ type: ActionTypes.SET_ORDERS, payload: orders });
export const addOrder = (order) => ({ type: ActionTypes.ADD_ORDER, payload: order });
export const setLang = (lang) => ({ type: ActionTypes.SET_LANG, payload: lang });
export const setFilters = (filters) => ({ type: ActionTypes.SET_FILTERS, payload: filters });
export const setVisibleCount = (count) => ({ type: ActionTypes.SET_VISIBLE_COUNT, payload: count });
export const loadMore = () => ({ type: ActionTypes.LOAD_MORE }); // для увеличения на itemsPerPage
