// В admin_script.js

// --- Логин ---
// adminLoginForm.addEventListener('submit', async (e) => { ...
// Вместо window.location.href = 'admin.html';
if (result.success && result.token) {
    localStorage.setItem('authToken', result.token); // Сохраняем токен
    alert('Вход успешен!');
    // Перенаправляем на admin.html или обновляем UI
    window.location.href = 'admin.html';
} else {
    alert(`Ошибка входа: ${result.message || 'Неверный логин или пароль!'}`);
}
// ... });

// --- Проверка авторизации (например, при загрузке admin.html) ---
async function checkAdminAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html'; // Или показать форму логина
        return false;
    }
    try {
        const response = await fetch('/admin/auth-check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.isAuthenticated) {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html'; // Или показать форму логина
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
        return false;
    }
}
// Вызывать checkAdminAuth() при загрузке admin.html

// --- Логаут ---
// logoutButton.addEventListener('click', async () => { ...
localStorage.removeItem('authToken');
alert('Вы вышли из системы.');
window.location.href = 'index.html';
// Запрос /admin/logout на сервер больше не обязателен для сессий, но можно оставить для статистики
// });

// --- При отправке запросов на защищенные API (например, добавление новости) ---
async function addNewsRequest(newsData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ДОБАВЛЯЕМ ТОКЕН
        },
        body: JSON.stringify(newsData)
    });
    // ... обработка ответа
}
// Аналогично для PUT, DELETE запросов