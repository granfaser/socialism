// netlify/functions/_utils.js
const { getStore } = require('@netlify/blobs');

// Название хранилища. Может быть любым.
const NEWS_STORE_NAME = 'news_data';
// Ключ, под которым будут храниться все новости в хранилище.
const NEWS_BLOB_KEY = 'all_news';

async function getNews() {
    try {
        const store = getStore(NEWS_STORE_NAME);
        const data = await store.get(NEWS_BLOB_KEY, { type: 'json' });
        
        // Если данных еще нет, вернем пустой массив
        if (!data) {
            console.log("Blob is empty, returning [].");
            return [];
        }
        
        // Убедимся, что это массив
        if (!Array.isArray(data)) {
            console.warn(`Data in blob '${NEWS_BLOB_KEY}' was not an array. Initializing with [].`);
            await saveNews([]);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error("Error reading from Netlify Blob Storage:", error);
        // В случае ошибки возвращаем пустой массив, чтобы сайт не упал
        return [];
    }
}

async function saveNews(news) {
    try {
        const store = getStore(NEWS_STORE_NAME);
        // Сохраняем весь массив новостей целиком
        await store.setJSON(NEWS_BLOB_KEY, news);
        console.log(`Successfully saved news to blob '${NEWS_BLOB_KEY}'.`);
    } catch (error) {
        console.error("Error writing to Netlify Blob Storage:", error);
        throw error; // Пробрасываем ошибку, чтобы вызывающая функция знала о проблеме
    }
}

module.exports = { getNews, saveNews };