import { Client } from '@stomp/stompjs';
import 'fast-text-encoding';

const SOCKET_URL = 'ws://10.0.2.2:8080/ws';

class ChatService {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    connect(onMessageReceived, username) {
        this.client = new Client({
            brokerURL: SOCKET_URL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.connected = true;
                console.log('Connected to STOMP');

                // Subscribe to user-specific queue
                this.client.subscribe(`/user/${username}/queue/messages`, (message) => {
                    const msg = JSON.parse(message.body);
                    onMessageReceived(msg);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            forceBinaryWSFrames: true,
            appendMissingNULLonIncoming: true,
        });

        this.client.activate();
    }

    sendMessage(chatMessage) {
        if (this.client && this.connected) {
            this.client.publish({
                destination: '/app/chat',
                body: JSON.stringify(chatMessage),
            });
        } else {
            console.error('STOMP client is not connected.');
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
