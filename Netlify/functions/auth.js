const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');

const app = express();
const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const JWT_SECRET = process.env.SESSION_SECRET || 'default_secret_please_change';

app.use(express.json());

router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const payload = { username: username, isAdmin: true };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, message: 'Вход успешен', token: token });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

router.get('/admin/auth-check', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ isAuthenticated: false, message: 'Токен не предоставлен' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ isAuthenticated: false, message: 'Невалидный токен' });
        }
        if (decoded && decoded.isAdmin) {
            return res.json({ isAuthenticated: true });
        }
        res.status(403).json({ isAuthenticated: false, message: 'Недостаточно прав' });
    });
});

app.use('/.netlify/functions/auth', router);
module.exports.handler = serverless(app);