// src/utils/dom.js
export function createElement(tag, className = '', attributes = {}, children = []) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]));
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
}

export function mount(parent, child) {
    if (typeof child === 'string') {
        parent.innerHTML = child;
    } else if (child instanceof Node) {
        parent.innerHTML = '';
        parent.appendChild(child);
    }
}
