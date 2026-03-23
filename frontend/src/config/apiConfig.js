export const LOCAL_IP = '192.168.1.6'; // Current local IP
export const BASE_URL = `http://${LOCAL_IP}:8080`;

export const API_URLS = {
    AUTH: `${BASE_URL}/api/auth`,
    USERS: `${BASE_URL}/api/users`,
    CHATS: `${BASE_URL}/api/chat`,
    MESSAGES: `${BASE_URL}/messages`,
    CONVERSATIONS: `${BASE_URL}/conversations`,
    GROUPS: `${BASE_URL}/api/groups`,
    AGORA: `${BASE_URL}/api/agora`,
    WS: `ws://${LOCAL_IP}:8080/ws/websocket`,
};

export default API_URLS;
