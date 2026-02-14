import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const GroupChatScreen = ({ route }) => {
    const { name } = route.params || { name: 'Group Chat' };
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hello everyone!', sender: 'Alice' },
        { id: '2', text: 'Hi Alice!', sender: 'Bob' },
    ]);
    const [inputText, setInputText] = useState('');

    const sendMessage = () => {
        if (!inputText.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, sender: 'You' }]);
        setInputText('');
    };

    const renderItem = ({ item }) => (
        <View style={[styles.bubble, item.sender === 'You' ? styles.me : styles.them]}>
            <Text style={styles.senderName}>{item.sender}</Text>
            <Text style={[styles.msgText, item.sender === 'You' ? styles.meText : styles.themText]}>{item.text}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{name}</Text>
            </View>
            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />
            <View style={styles.inputContainer}>
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
    header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    list: { padding: 15 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10 },
    me: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
    them: { alignSelf: 'flex-start', backgroundColor: '#fff' },
    senderName: { fontSize: 10, color: '#999', marginBottom: 2 },
    msgText: { fontSize: 16 },
    meText: { color: '#fff' },
    themText: { color: '#333' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, color: '#000' },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }
});

export default GroupChatScreen;
