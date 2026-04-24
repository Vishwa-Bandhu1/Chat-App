// src/config/api.js
const PRODUCTION_BASE_URL = 'https://chat-app-4nat.onrender.com';

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const assertProductionSafeUrl = (url) => {
    const isLocalUrl = /https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url);
    const isHttps = url.startsWith('https://');

    if (!__DEV__ && (isLocalUrl || !isHttps)) {
        throw new Error(`Invalid production API URL: ${url}. Release builds must use a public HTTPS backend.`);
    }

    return url;
};

export const BASE_URL = normalizeBaseUrl(PRODUCTION_BASE_URL);
export const ACTIVE_BASE_URL = assertProductionSafeUrl(BASE_URL);
export const API_HEALTH_URL = `${ACTIVE_BASE_URL}/api/health`;
