// netlify/functions/news.js
const express = require('express');
const serverless = require('serverless-http');
const { getNews, saveNews } = require('./_utils'); // Импортируем наши утилиты

const app = express();
const router = express.Router();

app.use(express.json());

// GET /api/news - получить все новости
router.get('/api/news', async (req, res) => {
    try {
        const news = await getNews();
        news.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки новостей' });
    }
});

// GET /api/news/:id - получить одну новость (дублируется в news-admin, но здесь для публичного доступа)
router.get('/api/news/:id', async (req, res) => {
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


// POST /api/news/:id/react - добавить реакцию
router.post('/api/news/:id/react', async (req, res) => {
    try {
        const newsId = req.params.id;
        const { reaction } = req.body;

        if (!reaction) {
            return res.status(400).json({ message: 'Реакция не предоставлена' });
        }

        let news = await getNews();
        const articleIndex = news.findIndex(n => n.id === newsId);

        if (articleIndex === -1) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }

        if (!news[articleIndex].reactions) {
            news[articleIndex].reactions = { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😠": 0 };
        }
        if (news[articleIndex].reactions[reaction] === undefined) {
            return res.status(400).json({ message: 'Недопустимый тип реакции' });
        }

        news[articleIndex].reactions[reaction]++;
        await saveNews(news); // Помним, что это не сохранится надолго
        res.json({ success: true, reactions: news[articleIndex].reactions });

    } catch (error) {
        console.error("Error reacting to news:", error);
        res.status(500).json({ message: 'Ошибка при добавлении реакции' });
    }
});

app.use('/', router);
module.exports.handler = serverless(app);