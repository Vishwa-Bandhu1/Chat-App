import axios from 'axios';
import { ACTIVE_BASE_URL } from '../config/api';
import { API_URLS } from '../config/apiConfig';

const REQUEST_TIMEOUT_MS = 10000;

const apiClient = axios.create({
    baseURL: ACTIVE_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

const buildRequestUrl = (config = {}) => {
    if (config.baseURL && config.url && !config.url.startsWith('http')) {
        return `${config.baseURL}${config.url}`;
    }

    return config.url || config.baseURL || API_URLS.BASE_URL;
};

export const getAxiosDebugContext = (error) => ({
    code: error.code || 'UNKNOWN',
    method: (error.config?.method || 'GET').toUpperCase(),
    timeout: error.config?.timeout || REQUEST_TIMEOUT_MS,
    url: buildRequestUrl(error.config),
});

export const toApiErrorMessage = (error) => {
    if (error.response) {
        if (typeof error.response.data === 'string' && error.response.data.trim()) {
            return error.response.data;
        }

        if (error.response.data?.message) {
            return error.response.data.message;
        }

        return `Server Error: ${error.response.status}`;
    }

    if (error.code === 'ECONNABORTED') {
        return `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s while reaching ${API_URLS.BASE_URL}.`;
    }

    if (error.request) {
        return `Network Error: Could not reach ${API_URLS.BASE_URL}. On a phone, this must be your PC LAN IP, not localhost.`;
    }

    return error.message || 'Error setting up request';
};

apiClient.interceptors.request.use((config) => {
    console.log('[API request]', {
        method: (config.method || 'GET').toUpperCase(),
        url: buildRequestUrl(config),
        timeout: config.timeout || REQUEST_TIMEOUT_MS,
    });
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[API response error]', {
            ...getAxiosDebugContext(error),
            status: error.response?.status,
            responseData: error.response?.data,
        });
        return Promise.reject(error);
    }
);

export default apiClient;
