const { getStore } = require('@netlify/blobs');

const NEWS_STORE_NAME = 'news_data';
const NEWS_BLOB_KEY = 'all_news';

async function getNews() {
    try {
        const store = getStore(NEWS_STORE_NAME);
        const data = await store.get(NEWS_BLOB_KEY, { type: 'json' });
        
        if (!data) {
            return [];
        }
        
        if (!Array.isArray(data)) {
            await saveNews([]);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error("Error reading from Netlify Blob Storage:", error);
        return [];
    }
}

async function saveNews(news) {
    try {
        const store = getStore(NEWS_STORE_NAME);
        await store.setJSON(NEWS_BLOB_KEY, news);
    } catch (error) {
        console.error("Error writing to Netlify Blob Storage:", error);
        throw error;
    }
}

module.exports = { getNews, saveNews };