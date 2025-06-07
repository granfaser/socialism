// netlify/functions/_utils.js
const fs = require('fs').promises;
const path = require('path');

// В Netlify Functions, __dirname будет указывать на папку с функцией.
// Нам нужно подняться на уровень выше, чтобы найти папку data.
// Это НЕ очень надежно, так как структура сборки может меняться.
// Лучше использовать process.env.LAMBDA_TASK_ROOT (для AWS Lambda, на которой Netlify Functions работают)
// и от него строить путь.
// Для локальной разработки `netlify dev` это может работать иначе.
// Более надежный способ - использовать Vercel Blob или базу данных.

// Определяем путь к data относительно корня проекта
// process.cwd() в Netlify Functions указывает на корень проекта во время выполнения
const DATA_DIR = path.join(process.cwd(), 'data');
const NEWS_FILE_PATH = path.join(DATA_DIR, 'news.json');


async function ensureDataDirExists() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error("Критическая ошибка: не удалось создать директорию data.", error);
            throw error;
        }
    }
}

async function getNews() {
    // ВАЖНО: Файловая система в Netlify Functions эфемерна для записи!
    // Чтение из файла, который был задеплоен, возможно.
    // Запись в файл будет работать только на время жизни инстанса функции и не сохранится.
    await ensureDataDirExists(); // Попытаемся создать, если нет
    try {
        const data = await fs.readFile(NEWS_FILE_PATH, 'utf-8');
        const jsonData = JSON.parse(data);
        if (!Array.isArray(jsonData)) {
            console.warn(`Файл ${NEWS_FILE_PATH} не содержал массив. Инициализация пустым массивом.`);
            // Запись здесь не будет иметь долгосрочного эффекта в проде
            // await saveNews([]);
            return []; // Возвращаем пустой, если структура неверна
        }
        return jsonData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // await saveNews([]); // Запись здесь не будет иметь долгосрочного эффекта
            return []; // Возвращаем пустой, если файла нет
        }
        if (error instanceof SyntaxError) {
            console.error(`Ошибка парсинга ${NEWS_FILE_PATH}. Файл может быть поврежден. Возвращаем пустой массив.`, error);
            // await saveNews([]);
            return [];
        }
        console.error("Ошибка чтения файла новостей:", error);
        // В случае серьезной ошибки, лучше вернуть пустой массив, чем падать
        return [];
        // throw error; // Можно пробросить, но это уронит функцию
    }
}

async function saveNews(news) {
    // ВАЖНО: Эта функция НЕ БУДЕТ надежно сохранять данные в Netlify Functions!
    // Любые изменения будут потеряны.
    console.warn("Вызов saveNews в Netlify Function. Изменения в news.json не будут постоянными!");
    await ensureDataDirExists();
    try {
        await fs.writeFile(NEWS_FILE_PATH, JSON.stringify(news, null, 2), 'utf-8');
    } catch (error) {
        console.error("Ошибка записи файла новостей (изменения не сохранятся в проде):", error);
        // throw error; // Не пробрасываем, чтобы не уронить функцию из-за временной записи
    }
}

// Middleware для проверки isAdmin (пока не используется из-за проблем с сессиями)
// function isAdmin(req, res, next) {
//     if (req.session && req.session.isAdmin) {
//         return next();
//     }
//     res.status(401).json({ success: false, message: 'Не авторизован' });
// }

module.exports = { getNews, saveNews /*, isAdmin */ };