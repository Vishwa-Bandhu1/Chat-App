import { NativeModules, Platform } from 'react-native';

const API_PORT = '8080';

// Current Wi-Fi IP from this machine on 2026-04-17. Update this if your LAN IP changes.
const DEVICE_LAN_HOST = '192.168.1.6';
const IOS_SIMULATOR_HOST = 'localhost';

const extractHost = (url = '') => {
    const match = url.match(/^[a-zA-Z]+:\/\/([^/:?#]+)/);
    return match?.[1] || null;
};

const getMetroHost = () => {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    const host = extractHost(scriptURL);

    if (!host || host === 'localhost' || host === '127.0.0.1') {
        return null;
    }

    return host;
};

export const resolveApiHost = () => {
    const metroHost = getMetroHost();
    if (metroHost) {
        return metroHost;
    }

    if (__DEV__ && Platform.OS === 'ios') {
        return IOS_SIMULATOR_HOST;
    }

    return DEVICE_LAN_HOST;
};

export const API_HOST = resolveApiHost();
export const BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const API_URLS = {
    BASE_URL: BASE_URL,
    AUTH: `${BASE_URL}/api/auth`,
    USERS: `${BASE_URL}/api/users`,
    CHATS: `${BASE_URL}/api/chat`,
    MESSAGES: `${BASE_URL}/api/messages`,
    CONVERSATIONS: `${BASE_URL}/api/conversations`,
    GROUPS: `${BASE_URL}/api/groups`,
    AGORA: `${BASE_URL}/api/agora`,
    WS: `ws://${API_HOST}:${API_PORT}/ws/websocket`,
};

export default API_URLS;
