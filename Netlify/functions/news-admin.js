// netlify/functions/news-admin.js
const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
const { getNews, saveNews } = require('./_utils'); // Убедитесь, что этот путь правильный

const JWT_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_change_this_again_please_really_netlify_jwt';

const app = express();
const router = express.Router();

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ success: false, message: 'Токен не предоставлен' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Невалидный или просроченный токен' });
        
        if (!user || !user.isAdmin) {
             return res.status(403).json({ success: false, message: 'Недостаточно прав' });
        }
        req.user = user; // Можно сохранить расшифрованные данные пользователя в req
        next(); // Переходим к следующему обработчику, если токен валиден и есть права
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Маршруты для администрирования новостей ---

// POST /admin-api/news - создать новую новость
router.post('/admin-api/news', authenticateToken, async (req, res) => {
    try {
        const { title, content, imageUrl, author } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Заголовок и содержание обязательны' });
        }
        const news = await getNews();
        const newArticle = {
            id: Date.now().toString(),
            title,
            content,
            imageUrl: imageUrl || '',
            author: author || 'Редакция',
            publishedDate: new Date().toISOString(),
            reactions: {
                "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😠": 0
            }
        };
        news.push(newArticle);
        await saveNews(news); // Помните: изменения в news.json не будут постоянными на Netlify
        res.status(201).json(newArticle);
    } catch (error) {
        console.error("Admin API - Error creating news:", error);
        res.status(500).json({ message: 'Ошибка сохранения новости' });
    }
});

// GET /admin-api/news (опционально, если админке нужен список всех новостей)
// Если этот эндпоинт нужен, добавьте его. Публичный GET /api/news есть в news.js
// router.get('/admin-api/news', authenticateToken, async (req, res) => {
//     try {
//         const news = await getNews();
//         news.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
//         res.json(news);
//     } catch (error) {
//         console.error("Admin API - Error fetching all news:", error);
//         res.status(500).json({ message: 'Ошибка загрузки новостей для админки' });
//     }
// });


// GET /admin-api/news/:id - получить одну новость для редактирования
router.get('/admin-api/news/:id', authenticateToken, async (req, res) => {
    try {
        const newsId = req.params.id;
        const news = await getNews();
        const article = news.find(n => n.id === newsId);
        if (article) {
            res.json(article);
        } else {
            res.status(404).json({ message: 'Новость не найдена' });
        }
    } catch (error) {
        console.error("Admin API - Error fetching news by id:", error);
        res.status(500).json({ message: 'Ошибка загрузки новости для редактирования' });
    }
});

// PUT /admin-api/news/:id - обновить новость
router.put('/admin-api/news/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, imageUrl, author } = req.body;
        let news = await getNews();
        const articleIndex = news.findIndex(article => article.id === id);

        if (articleIndex === -1) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }

        const updatedArticle = {
            ...news[articleIndex],
            title: title !== undefined ? title : news[articleIndex].title,
            content: content !== undefined ? content : news[articleIndex].content,
            imageUrl: imageUrl !== undefined ? imageUrl : news[articleIndex].imageUrl,
            author: author !== undefined ? author : news[articleIndex].author,
        };
        news[articleIndex] = updatedArticle;
        await saveNews(news); // Помните: изменения в news.json не будут постоянными на Netlify
        res.json(updatedArticle);
    } catch (error) {
        console.error("Admin API - Error updating news:", error);
        res.status(500).json({ message: 'Ошибка обновления новости' });
    }
});

// DELETE /admin-api/news/:id - удалить новость
router.delete('/admin-api/news/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let news = await getNews();
        const initialLength = news.length;
        const filteredNews = news.filter(article => article.id !== id);

        if (initialLength === filteredNews.length) {
            return res.status(404).json({ message: 'Новость не найдена для удаления' });
        }
        await saveNews(filteredNews); // Помните: изменения в news.json не будут постоянными на Netlify
        res.status(200).json({ success: true, message: 'Новость удалена' });
    } catch (error) {
        console.error("Admin API - Error deleting news:", error);
        res.status(500).json({ message: 'Ошибка удаления новости' });
    }
});

app.use('/', router); // Базовый путь для Netlify Functions обычно /
// Если Netlify Function вызывается как /.netlify/functions/news-admin/admin-api/news,
// то router.post('/admin-api/news', ...) сработает.

module.exports.handler = serverless(app);