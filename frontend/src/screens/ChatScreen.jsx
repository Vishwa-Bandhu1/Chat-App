import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatService from '../services/ChatService';
import { AuthContext } from '../navigation/AppNavigator';
import { launchImageLibrary } from 'react-native-image-picker';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8080';

const ChatScreen = ({ route, navigation }) => {
    const { name, recipientId } = route.params || { name: 'Chat', recipientId: '' };
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerType, setDrawerType] = useState('emoji'); // 'emoji' or 'sticker'
    const flatListRef = useRef(null);

    const currentUserId = user?.id || user?.userId;

    const stickers = [
        'https://cdn-icons-png.flaticon.com/512/4603/4603957.png', // Happy dog
        'https://cdn-icons-png.flaticon.com/512/8207/8207758.png', // Heart
        'https://cdn-icons-png.flaticon.com/512/5766/5766436.png', // Laughing
        'https://cdn-icons-png.flaticon.com/512/5766/5766467.png', // Cool
        'https://cdn-icons-png.flaticon.com/512/5766/5766324.png', // Surprised
        'https://cdn-icons-png.flaticon.com/512/5766/5766336.png', // Crying
    ];

    useEffect(() => {
        if (!currentUserId || !recipientId) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await ChatService.fetchMessages(currentUserId, recipientId, user.accessToken);
                setMessages(data || []);
                setLoading(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setLoading(false);
            }
        };

        fetchHistory();

        ChatService.connect((msg) => {
            console.log('Received message:', msg);
            if (msg.senderId === recipientId || msg.recipientId === recipientId) {
                setMessages(prev => [...prev, msg]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        }, user.username); // Use username for subscription

        return () => {
            // ChatService.disconnect(); 
        };
    }, [currentUserId, recipientId]);

    const sendMessage = async (content, type = 'TEXT') => {
        if (!content.trim() && type === 'TEXT') return;
        if (!recipientId) return;

        const chatMessage = {
            senderId: currentUserId,
            recipientId: recipientId,
            content: content,
            type: type,
            status: 'DELIVERED',
            timestamp: new Date().toISOString()
        };

        // Optimistic UI update
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, { ...chatMessage, id: tempId }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        if (type === 'TEXT') setInputText('');

        try {
            ChatService.sendMessage(chatMessage);
        } catch (error) {
            console.error("Failed to send message", error);
            Alert.alert("Error", "Failed to send message");
            // Optionally remove message from UI on failure
        }
    };

    const handleImagePick = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.5,
        });

        if (result.didCancel) return;
        if (result.errorMessage) {
            Alert.alert('Error', result.errorMessage);
            return;
        }

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

    const handleDeleteMessage = (item) => {
        Alert.alert(
            'Delete Message',
            'Delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            if (item.id && !item.id.startsWith('temp_')) {
                                await axios.delete(`${API_URL}/messages/${item.id}`, {
                                    headers: { Authorization: `Bearer ${user.accessToken}` }
                                });
                            }
                            setMessages(prev => prev.filter(m => m.id !== item.id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === currentUserId;
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onLongPress={() => handleDeleteMessage(item)}
                style={[styles.bubble, isMe ? styles.me : styles.them]}
            >
                {item.type === 'IMAGE' ? (
                    <Image
                        source={{ uri: item.content }}
                        style={{ width: 200, height: 200, borderRadius: 10 }}
                        resizeMode="cover"
                    />
                ) : item.type === 'STICKER' ? (
                    <Image
                        source={{ uri: item.content }}
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                    />
                ) : (
                    <Text style={[styles.msgText, isMe ? styles.meText : styles.themText]}>{item.content}</Text>
                )}
                <Text style={[styles.timeText, isMe ? styles.meTime : styles.themTime]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>
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
                <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={() => navigation.navigate('Call', {
                        recipientId,
                        recipientName: name,
                        isVideo: false,
                        isIncoming: false,
                    })}
                >
                    <Icon name="call-outline" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Call', {
                        recipientId,
                        recipientName: name,
                        isVideo: true,
                        isIncoming: false,
                    })}
                >
                    <Icon name="videocam-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
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
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={() => {
                        setShowDrawer(!showDrawer);
                        // Optional: dismiss keyboard if opening drawer
                    }}
                >
                    <Icon name={showDrawer ? "keyboard-outline" : "happy-outline"} size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachButton} onPress={handleImagePick} disabled={uploading}>
                    {uploading ? <ActivityIndicator size="small" color="#007AFF" /> : <Icon name="image" size={24} color="#007AFF" />}
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    onFocus={() => setShowDrawer(false)}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => sendMessage(inputText)} style={styles.sendButton} disabled={!inputText.trim()}>
                    <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {showDrawer && (
                <View style={styles.drawerContainer}>
                    <View style={styles.drawerTabs}>
                        <TouchableOpacity style={[styles.tab, drawerType === 'emoji' && styles.activeTab]} onPress={() => setDrawerType('emoji')}>
                            <Text style={styles.tabText}>Emojis</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, drawerType === 'sticker' && styles.activeTab]} onPress={() => setDrawerType('sticker')}>
                            <Text style={styles.tabText}>Stickers</Text>
                        </TouchableOpacity>
                    </View>
                    {drawerType === 'emoji' ? (
                        <View style={{ height: 260 }}>
                            <EmojiKeyboard
                                onEmojiSelected={emojiObject => setInputText(prev => prev + emojiObject.emoji)}
                                theme={{
                                    backdrop: '#00000000',
                                }}
                            />
                        </View>
                    ) : (
                        <View style={styles.stickerGrid}>
                            {stickers.map((stickerUrl, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        sendMessage(stickerUrl, 'STICKER');
                                        setShowDrawer(false);
                                    }}
                                    style={styles.stickerItem}
                                >
                                    <Image source={{ uri: stickerUrl }} style={styles.stickerImage} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}
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
    msgText: { fontSize: 16 },
    meText: { color: '#fff' },
    themText: { color: '#333' },
    timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
    meTime: { color: 'rgba(255,255,255,0.7)' },
    themTime: { color: '#999' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    attachButton: { padding: 10 },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, color: '#000' },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    drawerContainer: { height: 300, backgroundColor: '#f5f5f5', borderTopWidth: 1, borderTopColor: '#ddd' },
    drawerTabs: { flexDirection: 'row', backgroundColor: '#eaeaea' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#007AFF' },
    tabText: { fontWeight: 'bold', color: '#555' },
    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-around' },
    stickerItem: { margin: 10 },
    stickerImage: { width: 70, height: 70 }
});

export default ChatScreen;
