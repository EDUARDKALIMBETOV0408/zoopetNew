// ============================================================
// 13. Глобальный обработчик кликов (резервный, надёжный)
// ============================================================
document.addEventListener('click', function(e) {
    // Проверяем клик по профилю
    const profileTrigger = e.target.closest('.profile-trigger');
    if (profileTrigger) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Global click: profile trigger detected');
        if (typeof profile.open === 'function') {
            profile.open();
        } else {
            console.error('Global click: profile.open is not a function');
            // Пробуем открыть через глобальную ссылку
            if (typeof globalThis.openProfileModal === 'function') {
                globalThis.openProfileModal();
            }
        }
        return;
    }

    // Проверяем клик по кнопке входа
    const loginTrigger = e.target.closest('.login-trigger');
    if (loginTrigger) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Global click: login trigger detected');
        if (typeof authModal.open === 'function') {
            authModal.open();
        } else if (typeof globalThis.openAuthModal === 'function') {
            globalThis.openAuthModal();
        }
        return;
    }
});

console.log('Global click handler installed');
