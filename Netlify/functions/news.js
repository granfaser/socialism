const express = require('express');
const serverless = require('serverless-http');
const { getNews, saveNews } = require('./_utils');

const app = express();
const router = express.Router();

app.use(express.json());

router.get('/api/news', async (req, res) => {
    try {
        const news = await getNews();
        news.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки новостей' });
    }
});

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

app.use('/.netlify/functions/news', router);
module.exports.handler = serverless(app);