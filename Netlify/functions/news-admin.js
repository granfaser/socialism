// netlify/functions/news-admin.js
const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken'); // Добавили JWT
const { getNews, saveNews } = require('./_utils');

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
        // req.user = user; // Можно сохранить расшифрованные данные пользователя в req
        if (!user || !user.isAdmin) { // Проверяем, что в токене есть права админа
             return res.status(403).json({ success: false, message: 'Недостаточно прав' });
        }
        next(); // Переходим к следующему обработчику, если токен валиден
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Применяем middleware ко всем админским маршрутам
router.post('/api/news', authenticateToken, async (req, res) => { /* ... ваш код ... */ });
router.get('/api/news/:id', authenticateToken, async (req, res) => { /* ... ваш код ... */ }); // Если это админский GET
router.put('/api/news/:id', authenticateToken, async (req, res) => { /* ... ваш код ... */ });
router.delete('/api/news/:id', authenticateToken, async (req, res) => { /* ... ваш код ... */ });

app.use('/', router);
module.exports.handler = serverless(app);