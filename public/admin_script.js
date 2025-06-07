// public/admin_script.js
document.addEventListener('DOMContentLoaded', async () => {
    // ... (существующий код проверки авторизации, logoutButton) ...

    const addNewsForm = document.getElementById('addNewsForm');
    const newsListAdmin = document.getElementById('newsListAdmin');
    
    const editNewsModal = document.getElementById('editNewsModal');
    const editNewsForm = document.getElementById('editNewsForm');
    const closeEditModalBtn = document.getElementById('closeEditModal');

    // --- НОВОЕ: Элементы для превью изображений ---
    const newsImageUrlInput = document.getElementById('newsImageUrl');
    const addNewsImagePreviewContainer = document.createElement('div');
    addNewsImagePreviewContainer.id = 'newsImagePreviewContainer';
    const addNewsImagePreview = document.createElement('img');
    addNewsImagePreview.id = 'newsImagePreview';
    addNewsImagePreview.alt = 'Превью изображения';
    addNewsImagePreviewContainer.appendChild(addNewsImagePreview);
    if (newsImageUrlInput) {
        newsImageUrlInput.parentNode.insertBefore(addNewsImagePreviewContainer, newsImageUrlInput.nextSibling);
        addNewsImagePreviewContainer.style.display = 'none'; // Скрыть по умолчанию

        newsImageUrlInput.addEventListener('input', () => {
            const url = newsImageUrlInput.value.trim();
            if (url) {
                addNewsImagePreview.src = url;
                addNewsImagePreviewContainer.style.display = 'block';
            } else {
                addNewsImagePreviewContainer.style.display = 'none';
            }
        });
    }
    
    const editNewsImageUrlInput = document.getElementById('editNewsImageUrl');
    const editNewsImagePreviewContainer = document.createElement('div');
    editNewsImagePreviewContainer.id = 'editNewsImagePreviewContainer';
    const editNewsImagePreview = document.createElement('img');
    editNewsImagePreview.id = 'editNewsImagePreview';
    editNewsImagePreview.alt = 'Превью изображения';
    editNewsImagePreviewContainer.appendChild(editNewsImagePreview);
    if (editNewsImageUrlInput) {
        editNewsImageUrlInput.parentNode.insertBefore(editNewsImagePreviewContainer, editNewsImageUrlInput.nextSibling);
        editNewsImagePreviewContainer.style.display = 'none'; // Скрыть по умолчанию

        editNewsImageUrlInput.addEventListener('input', () => {
            const url = editNewsImageUrlInput.value.trim();
            if (url) {
                editNewsImagePreview.src = url;
                editNewsImagePreviewContainer.style.display = 'block';
            } else {
                editNewsImagePreviewContainer.style.display = 'none';
            }
        });
    }


    // ... (существующий код loadAdminNews) ...
    async function loadAdminNews() {
        // ...
    }


    if (addNewsForm) { // Проверяем наличие формы
        addNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (существующий код сбора данных) ...
            const newsData = {
                title: document.getElementById('newsTitle').value,
                content: document.getElementById('newsContent').value,
                imageUrl: document.getElementById('newsImageUrl').value,
                author: document.getElementById('newsAuthor').value,
            };

            try {
                // ... (существующий код отправки) ...
                if (response.ok) {
                    addNewsForm.reset();
                    if (newsImageUrlInput) newsImageUrlInput.dispatchEvent(new Event('input')); // Обновить превью
                    loadAdminNews();
                    alert('Новость успешно добавлена!');
                } // ...
            } catch (error) {
                // ...
            }
        });
    }


    if (newsListAdmin) { // Проверяем наличие списка
        newsListAdmin.addEventListener('click', async (e) => {
            // ... (существующий код) ...
            if (target.classList.contains('edit-btn')) {
                // ... (существующий код) ...
                if (newsToEdit) {
                    // ... (заполнение полей) ...
                    document.getElementById('editNewsImageUrl').value = newsToEdit.imageUrl || '';
                    if (editNewsImageUrlInput) editNewsImageUrlInput.dispatchEvent(new Event('input')); // Обновить превью в модалке
                    // ...
                }
            }
            // ...
        });
    }

    if (editNewsForm) { // Проверяем наличие формы
        editNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (существующий код сбора данных) ...
            try {
                // ... (существующий код отправки) ...
                if (response.ok) {
                    editNewsModal.style.display = 'none';
                    if (editNewsImageUrlInput) editNewsImageUrlInput.dispatchEvent(new Event('input')); // Обновить превью
                    loadAdminNews();
                    alert('Новость успешно обновлена!');
                } // ...
            } catch (error) {
                // ...
            }
        });
    }
    
    // ... (существующий код closeEditModalBtn, window.onclick для модалки, logout) ...

    // Initial load
    if (newsListAdmin) loadAdminNews();
});