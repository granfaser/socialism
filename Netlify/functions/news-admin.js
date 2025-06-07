// netlify/functions/news-admin.js
const express = require('express');
const serverless = require('serverless-http');
const { getNews, saveNews /*, isAdmin */ } = require('./_utils'); // isAdmin пока не используем

const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ВАЖНО: Убрали isAdmin для упрощения из-за проблем с сессиями в serverless.
// В реальном приложении здесь должна быть проверка аутентификации (например, через JWT).

// POST /api/news - создать новость
router.post('/api/news', /* isAdmin, */ async (req, res) => {
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
            reactions: { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😠": 0 }
        };
        news.push(newArticle);
        await saveNews(news); // Помним, что это не сохранится надолго
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сохранения новости' });
    }
});

// GET /api/news/:id - получить одну новость (для админки, если нужно)
router.get('/api/news/:id', /* isAdmin, */ async (req, res) => {
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
        res.status(500).json({ message: 'Ошибка загрузки новости' });
    }
});

// PUT /api/news/:id - обновить новость
router.put('/api/news/:id', /* isAdmin, */ async (req, res) => {
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
            title: title || news[articleIndex].title,
            content: content || news[articleIndex].content,
            imageUrl: imageUrl !== undefined ? imageUrl : news[articleIndex].imageUrl,
            author: author !== undefined ? author : news[articleIndex].author,
        };
        news[articleIndex] = updatedArticle;
        await saveNews(news); // Помним, что это не сохранится надолго
        res.json(updatedArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка обновления новости' });
    }
});

// DELETE /api/news/:id - удалить новость
router.delete('/api/news/:id', /* isAdmin, */ async (req, res) => {
    try {
        const { id } = req.params;
        let news = await getNews();
        const filteredNews = news.filter(article => article.id !== id);

        if (news.length === filteredNews.length) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }
        await saveNews(filteredNews); // Помним, что это не сохранится надолго
        res.status(200).json({ success: true, message: 'Новость удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления новости' });
    }
});

app.use('/', router);
module.exports.handler = serverless(app);