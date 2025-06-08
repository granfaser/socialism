const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
const { getNews, saveNews } = require('./_utils');

const JWT_SECRET = process.env.SESSION_SECRET || 'default_secret_please_change';
const app = express();
const router = express.Router();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ success: false, message: 'Токен не предоставлен' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Невалидный токен или недостаточно прав' });
        }
        req.user = user;
        next();
    });
}

app.use(express.json());
app.use(authenticateToken);

router.post('/admin-api/news', async (req, res) => {
    try {
        const { title, content, imageUrl, author } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Заголовок и содержание обязательны' });
        const news = await getNews();
        const newArticle = {
            id: Date.now().toString(),
            title, content,
            imageUrl: imageUrl || '',
            author: author || 'Редакция',
            publishedDate: new Date().toISOString()
        };
        news.push(newArticle);
        await saveNews(news);
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сохранения новости' });
    }
});

router.get('/admin-api/news/:id', async (req, res) => {
    try {
        const news = await getNews();
        const article = news.find(n => n.id === req.params.id);
        if (article) res.json(article);
        else res.status(404).json({ message: 'Новость не найдена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки новости' });
    }
});

router.put('/admin-api/news/:id', async (req, res) => {
    try {
        const { title, content, imageUrl, author } = req.body;
        let news = await getNews();
        const articleIndex = news.findIndex(article => article.id === req.params.id);
        if (articleIndex === -1) return res.status(404).json({ message: 'Новость не найдена' });
        
        const updatedArticle = { ...news[articleIndex], title, content, imageUrl, author };
        news[articleIndex] = updatedArticle;
        await saveNews(news);
        res.json(updatedArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка обновления новости' });
    }
});

router.delete('/admin-api/news/:id', async (req, res) => {
    try {
        let news = await getNews();
        const filteredNews = news.filter(article => article.id !== req.params.id);
        if (news.length === filteredNews.length) return res.status(404).json({ message: 'Новость не найдена' });
        
        await saveNews(filteredNews);
        res.status(200).json({ success: true, message: 'Новость удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления новости' });
    }
});

app.use('/.netlify/functions/news-admin', router);
module.exports.handler = serverless(app);