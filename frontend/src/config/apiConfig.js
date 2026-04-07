export const LOCAL_IP = 'localhost'; // Current local IP
export const BASE_URL = `http://${LOCAL_IP}:8080`;

export const API_URLS = {
    BASE_URL: BASE_URL,
    AUTH: `${BASE_URL}/api/auth`,
    USERS: `${BASE_URL}/api/users`,
    CHATS: `${BASE_URL}/api/chat`,
    MESSAGES: `${BASE_URL}/api/messages`,
    CONVERSATIONS: `${BASE_URL}/api/conversations`,
    GROUPS: `${BASE_URL}/api/groups`,
    AGORA: `${BASE_URL}/api/agora`,
    WS: `ws://${LOCAL_IP}:8080/ws/websocket`,
};

export default API_URLS;
