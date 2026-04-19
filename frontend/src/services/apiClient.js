import axios from 'axios';
import { ACTIVE_BASE_URL } from '../config/api';
import { API_URLS } from '../config/apiConfig';
import { GlobalUI } from '../utils/GlobalUI';

const REQUEST_TIMEOUT_MS = 50000; // Increased to 50s for Render cold starts
const MAX_RETRIES = 3;

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
        return `Request timed out. The server might be waking up or struggling.`;
    }
    if (error.request) {
        return `Network Error: Could not reach the server. Please check your connection.`;
    }
    return error.message || 'Error setting up request';
};

// Map of pending requests and their loaders
const pendingRequests = new Map();

apiClient.interceptors.request.use((config) => {
    // Determine a unique key for the request overlay timer
    const requestKey = Math.random().toString(36).substring(7);
    config.requestKey = requestKey;

    // If the request takes longer than 2.5 seconds, we assume it's a cold start and show a loader
    const timerId = setTimeout(() => {
        GlobalUI.showLoader('Waking up server, please wait...');
    }, 2500);

    pendingRequests.set(requestKey, timerId);

    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        // Cleanup request overlay timer
        if (response.config?.requestKey && pendingRequests.has(response.config.requestKey)) {
            clearTimeout(pendingRequests.get(response.config.requestKey));
            pendingRequests.delete(response.config.requestKey);
            
            // If there's no more pending requests that might trigger loaders, we hide the loader.
            // Actually, any successful response means the server is awake, so we can hide.
            GlobalUI.hideLoader();
        }
        return response;
    },
    async (error) => {
        const config = error.config;
        
        // Cleanup timer on error too
        if (config?.requestKey && pendingRequests.has(config.requestKey)) {
            clearTimeout(pendingRequests.get(config.requestKey));
            pendingRequests.delete(config.requestKey);
            GlobalUI.hideLoader();
        }

        // Retry logic for 5xx errors or network aborts/timeouts
        if (config && (!config._retryCount || config._retryCount < MAX_RETRIES)) {
            const isServerError = error.response && error.response.status >= 500;
            const isNetworkError = error.code === 'ECONNABORTED' || !error.response;

            if (isServerError || isNetworkError) {
                config._retryCount = config._retryCount ? config._retryCount + 1 : 1;
                
                GlobalUI.showLoader(`Retrying connection... (${config._retryCount}/${MAX_RETRIES})`);
                
                // Exponential backoff: 2s, 4s, 8s
                const backoffMs = Math.pow(2, config._retryCount) * 1000;
                
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
                return apiClient(config);
            }
        }
        
        // Final failure after retries
        GlobalUI.hideLoader();
        
        // If it's a critical network or server error after retries, toast it globally
        const isCriticalError = (!error.response || (error.response && error.response.status >= 500));
        if (isCriticalError) {
            GlobalUI.showToast(toApiErrorMessage(error), 'error');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
