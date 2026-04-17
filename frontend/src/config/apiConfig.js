import { ACTIVE_BASE_URL } from './api';

export const BASE_URL = ACTIVE_BASE_URL;

// Generate WS URL by replacing http with ws, or https with wss
export const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

export const API_URLS = {
    BASE_URL: BASE_URL,
    AUTH: `${BASE_URL}/api/auth`,
    USERS: `${BASE_URL}/api/users`,
    CHATS: `${BASE_URL}/api/chat`,
    MESSAGES: `${BASE_URL}/api/messages`,
    CONVERSATIONS: `${BASE_URL}/api/conversations`,
    GROUPS: `${BASE_URL}/api/groups`,
    AGORA: `${BASE_URL}/api/agora`,
    WS: `${WS_BASE_URL}/ws/websocket`,
};

export default API_URLS;
