// netlify/functions/auth.js
const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken'); // Добавили JWT
// const session = require('express-session'); // Сессии больше не нужны в этом файле

const app = express();
const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'RussianSocialist6';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RussianSocialist1234567890';
// SESSION_SECRET теперь будет использоваться как JWT_SECRET
const JWT_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_change_this_again_please_really_netlify_jwt';

if (JWT_SECRET === 'your_very_secret_key_change_this_again_please_really_netlify_jwt' && process.env.NODE_ENV === 'production') {
    console.warn("ПРЕДУПРЕЖДЕНИЕ: Используется JWT_SECRET по умолчанию в продакшене! Пожалуйста, установите надежную переменную окружения SESSION_SECRET (которая теперь JWT_SECRET).");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Генерируем JWT
        const payload = { username: username, isAdmin: true };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Токен живет 1 час

        res.json({ success: true, message: 'Вход успешен', token: token });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// /admin/logout теперь обрабатывается на клиенте (удаление токена)
// Этот эндпоинт можно убрать или оставить для совместимости, но он ничего не будет делать с сессией
router.get('/admin/logout', (req, res) => {
    res.json({ success: true, message: 'Выход на клиенте (токен удален)' });
});

// /admin/auth-check теперь должен принимать токен и проверять его
router.get('/admin/auth-check', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (token) {
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.json({ isAuthenticated: false, message: 'Невалидный токен' });
                }
                // Токен валиден, проверяем isAdmin (хотя это уже есть в payload)
                if (decoded && decoded.isAdmin) {
                    return res.json({ isAuthenticated: true });
                } else {
                    return res.json({ isAuthenticated: false, message: 'Токен не содержит прав администратора' });
                }
            });
        } else {
            return res.json({ isAuthenticated: false, message: 'Токен не предоставлен в заголовке Authorization (нет Bearer)' });
        }
    } else {
        res.json({ isAuthenticated: false, message: 'Заголовок Authorization отсутствует' });
    }
});

app.use('/', router);
module.exports.handler = serverless(app);