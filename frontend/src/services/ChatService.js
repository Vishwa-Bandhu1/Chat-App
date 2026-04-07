import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { Platform } from 'react-native';
import 'fast-text-encoding';

import { API_URLS } from '../config/apiConfig';

const API_URL = API_URLS.CHATS;
const BASE_URL = API_URLS.CHATS.replace('/api/chat', ''); // To handle conversations and messages
const API_MESSAGES = `${BASE_URL}/api/messages`;
const API_CONVERSATIONS = `${BASE_URL}/api/conversations`;
const API_GROUPS = `${BASE_URL}/api/groups`;

const getWebSocketUrl = () => {
    try {
        const parsedUrl = new URL(API_URLS.BASE_URL);
        let host = parsedUrl.hostname;
        if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
            // host = '10.0.2.2'; // Removed! 10.0.2.2 fails on Physical Devices!
        }
        return `ws://${host}:${parsedUrl.port}/ws/websocket`;
    } catch (error) {
        console.warn('Failed to parse API_URLS.BASE_URL, falling back to configured WS URL', error);
        return API_URLS.WS;
    }
};

class ChatService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.pendingMessages = [];
        this.messageTokens = {}; // Store tokens for pending messages
        this.subscriptions = [];
        this.currentUserId = null;
        this.onMessageReceived = null;
        this.onCallSignal = null;
        this.onTyping = null;
        this.onConversationUpdate = null;
    }

    async fetchConversations(userId, token) {
        try {
            const response = await axios.get(`${API_CONVERSATIONS}/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.warn('Error fetching conversations:', error?.message);
            return [];
        }
    }

    async fetchMessages(senderId, recipientId, token) {
        try {
            const response = await axios.get(`${API_MESSAGES}/${recipientId}?currentUserId=${senderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.warn('Error fetching messages:', error?.message);
            return [];
        }
    }

    async uploadImage(fileUri, token) {
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            type: 'image/jpeg',
            name: 'chat_image.jpg',
        });

        try {
            const response = await axios.post(`${BASE_URL}/api/chat/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading chat image:', error);
            throw error;
        }
    }

    async fetchGroupMessages(groupId, token) {
        try {
            const response = await axios.get(`${API_MESSAGES}/group/${groupId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching group messages:', error);
            throw error;
        }
    }

    connect(onMessageReceived, userId, onCallSignal, onTyping, onConversationUpdate) {
        if (onMessageReceived != null) {
            this.onMessageReceived = onMessageReceived;
        }
        if (onCallSignal != null) {
            this.onCallSignal = onCallSignal;
        }
        if (onTyping != null) {
            this.onTyping = onTyping;
        }
        if (onConversationUpdate != null) {
            this.onConversationUpdate = onConversationUpdate;
        }
        if (userId) {
            this.currentUserId = userId;
        }

        if (this.client && this.connected) {
            console.log('STOMP already connected, reusing existing connection and refreshing subscriptions');
            this.subscribeTopics();
            return;
        }

        if (this.client) {
            try { this.client.deactivate(); } catch (e) { }
        }

        const socketUrl = getWebSocketUrl();
        console.log('Connecting STOMP websocket to', socketUrl);
        this.client = new Client({
            webSocketFactory: () => new WebSocket(socketUrl, ['v10.stomp', 'v11.stomp', 'v12.stomp']),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: async () => {
                this.connected = true;
                console.log('Connected to STOMP');
                this.subscribeTopics();

                // Flush any pending messages via REST
                while (this.pendingMessages.length > 0) {
                    const msg = this.pendingMessages.shift();
                    const tempId = msg._tempId;
                    const token = this.messageTokens[tempId];
                    const { _tempId, ...msgData } = msg; // Remove temporary id
                    if (token) {
                        try {
                            await axios.post(`${BASE_URL}/api/messages`, msgData, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            delete this.messageTokens[tempId];
                            console.log('Sent queued message');
                        } catch (e) {
                            console.error('Failed to send queued message:', e);
                        }
                    }
                }
            },
            onDisconnect: () => {
                this.connected = false;
                console.log('Disconnected from STOMP');
            },
            onStompError: (frame) => {
                this.connected = false;
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketError: (event) => {
                this.connected = false;
                console.error('WebSocket error:', event);
            },
        });

        this.client.activate();
    }

    async sendMessage(chatMessage, token) {
        try {
            await axios.post(`${BASE_URL}/api/messages`, chatMessage, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return true;
        } catch (error) {
            console.error('REST Message Send Error:', error);
            if (!this.connected) {
                console.warn('Network offline, queuing message...');
                const msgId = Date.now().toString();
                this.pendingMessages.push({ ...chatMessage, _tempId: msgId });
                this.messageTokens[msgId] = token; // Store token for this message
            }
            throw error;
        }
    }

    cleanupSubscriptions() {
        if (!this.subscriptions?.length) return;
        this.subscriptions.forEach(subscription => {
            try {
                subscription.unsubscribe();
            } catch (e) {
                console.warn('Failed to clean up STOMP subscription', e);
            }
        });
        this.subscriptions = [];
    }

    subscribeTopics() {
        if (!this.client || !this.currentUserId) return;
        this.cleanupSubscriptions();

        if (this.onMessageReceived) {
            this.subscriptions.push(this.client.subscribe(`/topic/messages/${this.currentUserId}`, (message) => {
                const msg = JSON.parse(message.body);
                this.onMessageReceived(msg);
            }));
            this.subscriptions.push(this.client.subscribe(`/user/queue/messages`, (message) => {
                const msg = JSON.parse(message.body);
                this.onMessageReceived(msg);
            }));
        }

        if (this.onCallSignal) {
            this.subscriptions.push(this.client.subscribe(`/user/queue/calls`, (message) => {
                const signal = JSON.parse(message.body);
                this.onCallSignal(signal);
            }));
        }

        if (this.onTyping) {
            this.subscriptions.push(this.client.subscribe(`/user/queue/typing`, (message) => {
                const typing = JSON.parse(message.body);
                this.onTyping(typing);
            }));
        }

        if (this.onConversationUpdate) {
            this.subscriptions.push(this.client.subscribe(`/user/queue/conversations`, (message) => {
                const conversation = JSON.parse(message.body);
                this.onConversationUpdate(conversation);
            }));
        }
    }

    sendTyping(recipientId, senderId, isTyping) {
        if (this.client && this.connected) {
            this.client.publish({
                destination: '/app/typing',
                body: JSON.stringify({ recipientId, senderId, isTyping })
            });
        }
    }

    disconnect() {
        if (this.client) {
            this.cleanupSubscriptions();
            this.client.deactivate();
            this.connected = false;
        }
    }
}

export default new ChatService();

