// netlify/functions/auth.js
const express = require('express');
const session = require('express-session'); // Попытаемся использовать сессии
const serverless = require('serverless-http');
const path = require('path'); // Не используется здесь напрямую, но может понадобиться

const app = express();
const router = express.Router(); // Используем Express Router

// --- Configuration - Use Environment Variables ---
// Установите эти переменные в Netlify UI: Site settings > Build & deploy > Environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'RussianSocialist6';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RussianSocialist1234567890';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_change_this_again_please_really_netlify';

if (SESSION_SECRET === 'your_very_secret_key_change_this_again_please_really_netlify' && process.env.NODE_ENV === 'production') {
    console.warn("ПРЕДУПРЕЖДЕНИЕ: Используется секрет сессии по умолчанию в продакшене! Пожалуйста, установите надежную переменную окружения SESSION_SECRET.");
}
// --- End Configuration ---

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий для Netlify Functions (может быть не очень надежно)
// Netlify устанавливает `process.env.NETLIFY_DEV` в `true` при локальной разработке через `netlify dev`
const isNetlifyDev = process.env.NETLIFY_DEV === 'true';
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: !isNetlifyDev, // true для HTTPS (Netlify всегда HTTPS в проде)
        httpOnly: true,
        sameSite: 'lax', // или 'strict'
        // path: '/', // Убедитесь, что путь правильный, если функции на разных путях
    },
    // Для serverless может потребоваться store, но для простоты пока без него
}));


router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        console.log('Login successful, session:', req.session);
        res.json({ success: true, message: 'Вход успешен' });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

router.get('/admin/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Не удалось выйти' });
            }
            res.clearCookie('connect.sid'); // Имя cookie по умолчанию для express-session
            res.json({ success: true, message: 'Выход успешен' });
        });
    } else {
        res.json({ success: true, message: 'Сессия не найдена, выход не требуется' });
    }
});

router.get('/admin/auth-check', (req, res) => {
    console.log('Auth check, session:', req.session);
    if (req.session && req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Netlify ожидает, что путь к функции будет базовым для роутера
// Например, если функция доступна по /.netlify/functions/auth,
// то router.post('/admin/login') будет доступен по /.netlify/functions/auth/admin/login
// Но мы используем redirects в netlify.toml, чтобы мапить /admin/login напрямую на эту функцию.
// Поэтому пути в router должны соответствовать оригинальным путям.
// Однако, serverless-http обычно монтирует роутер на корень функции.
// Для Netlify Functions, путь к функции уже определен ее именем файла.
// Мы будем использовать app.use('/.netlify/functions/auth', router) или просто router,
// а netlify.toml сделает маппинг.
// Для простоты, serverless-http обернет весь app.

app.use('/', router); // Монтируем роутер на корень приложения функции

module.exports.handler = serverless(app);