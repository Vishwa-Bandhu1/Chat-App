import { Client } from '@stomp/stompjs';
import axios from 'axios';
import 'fast-text-encoding';

// The /websocket suffix is required when the Spring Boot endpoint uses .withSockJS()
// Replace with your local machine's IP address if running on emulator/device
const SOCKET_URL = 'ws://192.168.1.7:8080/ws/websocket';

// For Android Emulator, use 192.168.1.7. For physical device, use your PC's IP.
const API_URL = 'http://192.168.1.7:8080';

class ChatService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.pendingMessages = [];
    }

    async fetchConversations(userId, token) {
        try {
            const response = await axios.get(`${API_URL}/conversations/${userId}`, {
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
            const response = await axios.get(`${API_URL}/messages/${senderId}/${recipientId}`, {
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
            const response = await axios.post(`${API_URL}/api/chat/upload`, formData, {
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
            const response = await axios.get(`${API_URL}/messages/group/${groupId}`, {
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

    connect(onMessageReceived, username, onCallSignal) {
        // Don't create a new client if already connected
        if (this.client && this.connected) {
            console.log('STOMP already connected, reusing existing connection');
            return;
        }

        // Deactivate any existing disconnected client
        if (this.client) {
            try { this.client.deactivate(); } catch (e) { }
        }

        this.client = new Client({
            brokerURL: SOCKET_URL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.connected = true;
                console.log('Connected to STOMP');

                // Subscribe to user-specific message topic
                this.client.subscribe(`/topic/messages/${username}`, (message) => {
                    const msg = JSON.parse(message.body);
                    onMessageReceived(msg);
                });

                // Subscribe to call signaling queue
                this.client.subscribe(`/user/${username}/queue/calls`, (message) => {
                    const signal = JSON.parse(message.body);
                    if (onCallSignal) {
                        onCallSignal(signal);
                    }
                });

                // Flush any pending messages via REST
                while (this.pendingMessages.length > 0) {
                    const msg = this.pendingMessages.shift();
                    this.sendMessage(msg);
                    console.log('Sent queued message');
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
            forceBinaryWSFrames: true,
            appendMissingNULLonIncoming: true,
        });

        this.client.activate();
    }

    async sendMessage(chatMessage) {
        try {
            await axios.post(`${API_URL}/api/messages`, chatMessage);
            return true;
        } catch (error) {
            console.error('REST Message Send Error:', error);
            if (!this.connected) {
                console.warn('Network offline, queuing message...');
                this.pendingMessages.push(chatMessage);
            }
            throw error;
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.connected = false;
        }
    }
}

export default new ChatService();

