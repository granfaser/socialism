// public/admin_script.js
document.addEventListener('DOMContentLoaded', () => {
    const addNewsForm = document.getElementById('addNewsForm');
    const newsListAdminDiv = document.getElementById('newsListAdmin');
    const logoutButton = document.getElementById('logoutButton');

    // --- Модальное окно редактирования ---
    const editModal = document.getElementById('editNewsModal');
    const editNewsForm = document.getElementById('editNewsForm');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const editNewsIdInput = document.getElementById('editNewsId');
    const editNewsTitleInput = document.getElementById('editNewsTitle');
    const editNewsContentInput = document.getElementById('editNewsContent');
    const editNewsImageUrlInput = document.getElementById('editNewsImageUrl');
    const editNewsAuthorInput = document.getElementById('editNewsAuthor');
    
    // --- Главная функция ---
    async function initializeAdminPage() {
        const token = localStorage.getItem('authToken');

        // 1. Проверяем, есть ли токен вообще
        if (!token) {
            alert('Вы не авторизованы. Перенаправление на главную страницу.');
            window.location.href = 'index.html';
            return;
        }

        // 2. Проверяем валидность токена на сервере
        try {
            const response = await fetch('/admin/auth-check', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok || !data.isAuthenticated) {
                localStorage.removeItem('authToken');
                alert(data.message || 'Сессия истекла или недействительна. Пожалуйста, войдите снова.');
                window.location.href = 'index.html';
                return;
            }

            // 3. Если все в порядке, загружаем новости
            await loadAdminNews();

        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
            alert('Ошибка проверки авторизации. Перенаправление на главную.');
            window.location.href = 'index.html';
        }
    }

    async function loadAdminNews() {
        if (!newsListAdminDiv) return;
        newsListAdminDiv.innerHTML = '<p>Загрузка новостей...</p>';

        try {
            // Используем публичный API для получения списка, так как он уже есть
            const response = await fetch('/api/news'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const newsItems = await response.json();
            renderNewsList(newsItems);

        } catch (error) {
            console.error('Failed to load admin news:', error);
            newsListAdminDiv.innerHTML = '<p>Не удалось загрузить новости. Попробуйте обновить страницу.</p>';
        }
    }

    function renderNewsList(newsItems) {
        newsListAdminDiv.innerHTML = '';
        if (newsItems.length === 0) {
            newsListAdminDiv.innerHTML = '<p>Новостей пока нет.</p>';
            return;
        }

        newsItems.forEach(item => {
            const articleElement = document.createElement('article');
            articleElement.innerHTML = `
                <h3>${item.title}</h3>
                <p><strong>Автор:</strong> ${item.author || 'Редакция'}</p>
                <p><strong>Дата:</strong> ${new Date(item.publishedDate).toLocaleDateString('ru-RU')}</p>
                <div class="news-actions">
                    <button class="btn btn-secondary edit-btn" data-id="${item.id}">Редактировать</button>
                    <button class="btn btn-danger delete-btn" data-id="${item.id}">Удалить</button>
                </div>
            `;
            newsListAdminDiv.appendChild(articleElement);
        });

        // Добавляем обработчики на новые кнопки
        document.querySelectorAll('.edit-btn').forEach(button => button.addEventListener('click', handleEditClick));
        document.querySelectorAll('.delete-btn').forEach(button => button.addEventListener('click', handleDeleteClick));
    }
    
    // --- Отправка запросов с токеном ---
    async function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
            window.location.href = 'index.html';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка сервера' }));
            throw new Error(errorData.message || `Ошибка ${response.status}`);
        }
        return response;
    }

    // --- Обработчики событий ---
    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newsData = {
                title: document.getElementById('newsTitle').value,
                content: document.getElementById('newsContent').value,
                imageUrl: document.getElementById('newsImageUrl').value,
                author: document.getElementById('newsAuthor').value || 'Редакция'
            };

            try {
                const response = await fetchWithAuth('/admin-api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newsData)
                });
                await response.json();
                alert('Новость успешно добавлена!');
                addNewsForm.reset();
                await loadAdminNews();
            } catch (error) {
                if (error.message !== 'Unauthorized') alert(`Ошибка добавления новости: ${error.message}`);
            }
        });
    }

    async function handleEditClick(event) {
        const newsId = event.target.dataset.id;
        try {
            const response = await fetchWithAuth(`/admin-api/news/${newsId}`);
            const newsItem = await response.json();

            editNewsIdInput.value = newsItem.id;
            editNewsTitleInput.value = newsItem.title;
            editNewsContentInput.value = newsItem.content;
            editNewsImageUrlInput.value = newsItem.imageUrl || '';
            editNewsAuthorInput.value = newsItem.author || '';
            
            editModal.style.display = 'block';
        } catch (error) {
            if (error.message !== 'Unauthorized') alert(`Не удалось загрузить новость для редактирования: ${error.message}`);
        }
    }

    if (editNewsForm) {
        editNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newsId = editNewsIdInput.value;
            const updatedData = {
                title: editNewsTitleInput.value,
                content: editNewsContentInput.value,
                imageUrl: editNewsImageUrlInput.value,
                author: editNewsAuthorInput.value
            };

            try {
                await fetchWithAuth(`/admin-api/news/${newsId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                alert('Новость успешно обновлена!');
                editModal.style.display = 'none';
                await loadAdminNews();
            } catch (error) {
                if (error.message !== 'Unauthorized') alert(`Ошибка обновления новости: ${error.message}`);
            }
        });
    }
    
    async function handleDeleteClick(event) {
        const newsId = event.target.dataset.id;
        if (confirm('Вы уверены, что хотите удалить эту новость?')) {
            try {
                await fetchWithAuth(`/admin-api/news/${newsId}`, { method: 'DELETE' });
                alert('Новость успешно удалена!');
                await loadAdminNews();
            } catch (error) {
                if (error.message !== 'Unauthorized') alert(`Ошибка удаления новости: ${error.message}`);
            }
        }
    }

    // --- Управление модальным окном и выход ---
    if (closeEditModalBtn) closeEditModalBtn.onclick = () => editModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == editModal) editModal.style.display = "none";
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            alert('Вы вышли из системы.');
            window.location.href = 'index.html';
        });
    }

    // Запускаем инициализацию страницы
    initializeAdminPage();
});