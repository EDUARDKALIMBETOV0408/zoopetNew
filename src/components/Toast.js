// src/components/Toast.js
export function Toast() {
    const toast = document.getElementById('toast');
    let timeoutId = null;

    function show(message, duration = 3000) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    return { show };
}
