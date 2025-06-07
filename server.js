// server.js
const express = require('express');
const session = require('express-session');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuration - Use Environment Variables ---
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE_PATH = path.join(DATA_DIR, 'news.json');

// Для Vercel установите эти переменные в Project Settings -> Environment Variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'RussianSocialist6';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RussianSocialist1234567890';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_very_secret_key_change_this_again_please_really';

if (SESSION_SECRET === 'your_very_secret_key_change_this_again_please_really' && process.env.NODE_ENV === 'production') {
    console.warn("ПРЕДУПРЕЖДЕНИЕ: Используется секрет сессии по умолчанию в продакшене! Пожалуйста, установите надежную переменную окружения SESSION_SECRET.");
}
// --- End Configuration ---

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    // Vercel работает по HTTPS, поэтому в продакшене cookie должны быть secure
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Обслуживание статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

async function ensureDataDirExists() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') { // Игнорируем, если папка уже существует
            console.error("Критическая ошибка: не удалось создать директорию data.", error);
            throw error;
        }
    }
}

async function getNews() {
    await ensureDataDirExists();
    try {
        const data = await fs.readFile(NEWS_FILE_PATH, 'utf-8');
        const jsonData = JSON.parse(data);
        // Убедимся, что это массив. Если нет, или файл поврежден, инициализируем пустым массивом.
        if (!Array.isArray(jsonData)) {
            console.warn(`Файл ${NEWS_FILE_PATH} не содержал массив. Инициализация пустым массивом.`);
            await saveNews([]);
            return [];
        }
        return jsonData;
    } catch (error) {
        if (error.code === 'ENOENT') { // Если файл не найден
            await saveNews([]);
            return [];
        }
        if (error instanceof SyntaxError) { // Если файл поврежден (невалидный JSON)
            console.error(`Ошибка парсинга ${NEWS_FILE_PATH}. Файл может быть поврежден. Инициализация пустым массивом.`, error);
            await saveNews([]);
            return [];
        }
        console.error("Ошибка чтения файла новостей:", error);
        throw error; // Для других ошибок лучше их пробросить, чтобы увидеть проблему
    }
}

async function saveNews(news) {
    await ensureDataDirExists();
    try {
        await fs.writeFile(NEWS_FILE_PATH, JSON.stringify(news, null, 2), 'utf-8');
    } catch (error) {
        console.error("Ошибка записи файла новостей:", error);
        throw error;
    }
}

function isAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Не авторизован' });
}

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Вход успешен' });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Не удалось выйти' });
        }
        res.json({ success: true, message: 'Выход успешен' });
    });
});

app.get('/admin/auth-check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await getNews();
        news.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка загрузки новостей' });
    }
});

app.get('/api/news/:id', async (req, res) => {
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


app.post('/api/news', isAdmin, async (req, res) => {
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
        await saveNews(news);
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сохранения новости' });
    }
});

app.put('/api/news/:id', isAdmin, async (req, res) => {
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
        await saveNews(news);
        res.json(updatedArticle);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка обновления новости' });
    }
});

app.delete('/api/news/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let news = await getNews();
        const filteredNews = news.filter(article => article.id !== id);

        if (news.length === filteredNews.length) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }
        await saveNews(filteredNews);
        res.status(200).json({ success: true, message: 'Новость удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления новости' });
    }
});

app.post('/api/news/:id/react', async (req, res) => {
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
        await saveNews(news);
        res.json({ success: true, reactions: news[articleIndex].reactions });

    } catch (error) {
        console.error("Error reacting to news:", error);
        res.status(500).json({ message: 'Ошибка при добавлении реакции' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log("Приложение запущено в режиме продакшена.");
        if (ADMIN_USERNAME === 'RussianSocialist6' || ADMIN_PASSWORD === 'RussianSocialist1234567890') {
            console.warn("ПРЕДУПРЕЖДЕНИЕ: Используются учетные данные администратора по умолчанию в продакшене! Пожалуйста, измените ADMIN_USERNAME и ADMIN_PASSWORD через переменные окружения.");
        }
    }
});