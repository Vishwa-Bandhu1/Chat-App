import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatService from '../services/ChatService';

// Dummy user for now - will be replaced by actual logged in user
const CURRENT_USER = 'testuser';

const ChatScreen = ({ route }) => {
    const { name } = route.params || { name: 'Chat' };
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Connect to WebSocket on mount
        ChatService.connect((msg) => {
            console.log('Received message:', msg);
            setMessages(prev => [...prev, msg]);
        }, CURRENT_USER);

        return () => {
            ChatService.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const chatMessage = {
            senderId: CURRENT_USER,
            recipientId: name, // Assuming 'name' is the recipient ID for now
            content: inputText,
            status: 'DELIVERED', // Optimistic update
            timestamp: new Date().toISOString()
        };

        // Optimistic UI update
        setMessages(prev => [...prev, { ...chatMessage, id: Date.now().toString(), sender: 'me' }]);

        ChatService.sendMessage(chatMessage);
        setInputText('');
    };

    const renderItem = ({ item }) => (
        <View style={[styles.bubble, item.senderId === CURRENT_USER || item.sender === 'me' ? styles.me : styles.them]}>
            <Text style={[styles.msgText, item.senderId === CURRENT_USER || item.sender === 'me' ? styles.meText : styles.themText]}>{item.content || item.text}</Text>
            <Text style={[styles.timeText, item.senderId === CURRENT_USER || item.sender === 'me' ? styles.meTime : styles.themTime]}>
                {new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { /* back */ }}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{name}</Text>
                    {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}
                </View>
                <TouchableOpacity>
                    <Icon name="videocam-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>
            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id || Math.random().toString()}
                contentContainerStyle={styles.list}
            />
            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton}>
                    <Icon name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 },
    headerInfo: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    typingIndicator: { fontSize: 12, color: '#007AFF', fontStyle: 'italic' },
    list: { padding: 15 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10 },
    me: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
    them: { alignSelf: 'flex-start', backgroundColor: '#fff' },
    msgText: { fontSize: 16 },
    meText: { color: '#fff' },
    themText: { color: '#333' },
    timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
    meTime: { color: 'rgba(255,255,255,0.7)' },
    themTime: { color: '#999' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    attachButton: { padding: 10 },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 10, color: '#000' },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }
});

export default ChatScreen;
