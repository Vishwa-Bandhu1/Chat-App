import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatService from '../services/ChatService';
import { AuthContext } from '../navigation/AppNavigator';
import { launchImageLibrary } from 'react-native-image-picker';

const GroupChatScreen = ({ route, navigation }) => {
    const { groupId, name } = route.params || { groupId: '', name: 'Group Chat' };
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const flatListRef = useRef(null);
    const currentUserId = user?.id || user?.userId;

    useEffect(() => {
        if (!groupId) {
            setLoading(false);
            return;
        }

        const fetchGroupHistory = async () => {
            try {
                const response = await ChatService.fetchGroupMessages(groupId, user.accessToken);
                setMessages(response || []);
            } catch (error) {
                console.error('Error fetching group messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupHistory();

        ChatService.connect((msg) => {
            if (msg.groupId === groupId) {
                setMessages(prev => [...prev, msg]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        }, user.username);

        return () => { };
    }, [groupId]);

    const sendMessage = (content, type = 'TEXT') => {
        if (!content.trim() && type === 'TEXT') return;

        const chatMessage = {
            senderId: currentUserId,
            groupId: groupId,
            content: content,
            type: type,
            status: 'DELIVERED',
            timestamp: new Date().toISOString()
        };

        const tempId = Date.now().toString();
        setMessages(prev => [...prev, { ...chatMessage, id: tempId }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        if (type === 'TEXT') setInputText('');

        try {
            ChatService.sendMessage(chatMessage);
        } catch (error) {
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const handleImagePick = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
        if (result.didCancel) return;
        if (result.errorMessage) { Alert.alert('Error', result.errorMessage); return; }

        const asset = result.assets[0];
        setUploading(true);
        try {
            const fileUrl = await ChatService.uploadImage(asset.uri, user.accessToken);
            sendMessage(fileUrl, 'IMAGE');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === currentUserId;
        return (
            <View style={[styles.bubble, isMe ? styles.me : styles.them]}>
                {!isMe && <Text style={styles.senderName}>{item.senderName || 'Member'}</Text>}
                {item.type === 'IMAGE' ? (
                    <Image source={{ uri: item.content }} style={{ width: 200, height: 200, borderRadius: 10 }} resizeMode="cover" />
                ) : (
                    <Text style={[styles.msgText, isMe ? styles.meText : styles.themText]}>{item.content}</Text>
                )}
                <Text style={[styles.timeText, isMe ? styles.meTime : styles.themTime]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{name}</Text>
                    {uploading && <Text style={styles.typingIndicator}>Uploading image...</Text>}
                </View>
                <Icon name="people" size={24} color="#007AFF" />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id || Math.random().toString()}
                    contentContainerStyle={styles.list}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton} onPress={handleImagePick} disabled={uploading}>
                    {uploading ? <ActivityIndicator size="small" color="#007AFF" /> : <Icon name="image" size={24} color="#007AFF" />}
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => sendMessage(inputText)} style={styles.sendButton} disabled={!inputText.trim()}>
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
    list: { padding: 15, paddingBottom: 20 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10 },
    me: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
    them: { alignSelf: 'flex-start', backgroundColor: '#fff' },
    senderName: { fontSize: 11, color: '#007AFF', fontWeight: '600', marginBottom: 3 },
    msgText: { fontSize: 16 },
    meText: { color: '#fff' },
    themText: { color: '#333' },
    timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
    meTime: { color: 'rgba(255,255,255,0.7)' },
    themTime: { color: '#999' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    attachButton: { padding: 10 },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 10, color: '#000' },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default GroupChatScreen;
