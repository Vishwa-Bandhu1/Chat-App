import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatService from '../services/ChatService';
import { AuthContext } from '../navigation/AppNavigator';
import { launchImageLibrary } from 'react-native-image-picker';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import axios from 'axios';

import { API_URLS } from '../config/apiConfig';

const BASE_URL = API_URLS.CHATS.replace('/api/chat', '');

const ChatScreen = ({ route, navigation }) => {
    const { name, recipientId, avatar } = route.params || { name: 'Chat', recipientId: '', avatar: null };
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [recipientStatus, setRecipientStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerType, setDrawerType] = useState('emoji');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    const currentUserId = user?.id || user?.userId;

    const stickers = [
        'https://cdn-icons-png.flaticon.com/512/4603/4603957.png',
        'https://cdn-icons-png.flaticon.com/512/8207/8207758.png',
        'https://cdn-icons-png.flaticon.com/512/5766/5766436.png',
        'https://cdn-icons-png.flaticon.com/512/5766/5766467.png',
        'https://cdn-icons-png.flaticon.com/512/5766/5766324.png',
        'https://cdn-icons-png.flaticon.com/512/5766/5766336.png',
    ];

    const markMessagesAsSeen = useCallback(async (msgs) => {
        const unseenMsgs = msgs.filter(m => m.senderId === recipientId && m.status !== 'SEEN');
        for (const msg of unseenMsgs) {
            try {
                await axios.patch(`${BASE_URL}/api/messages/${msg.id || msg.messageId}/status`, { status: 'SEEN' }, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
            } catch (e) {
                console.error('Error marking message as seen:', e);
            }
        }

        try {
            const userId = user?.id || user?.userId;
            if (userId && recipientId) {
                await axios.patch(`${BASE_URL}/api/conversations/${userId}/${recipientId}/read`, {}, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
            }
        } catch (e) {
            console.error('Error resetting conversation unread count:', e);
        }
    }, [user, recipientId]);

    const handleInputChange = (text) => {
        setInputText(text);
        if (text.trim()) {
            ChatService.sendTyping(recipientId, currentUserId, true);
            // Stop typing after 2 seconds of no input
            setTimeout(() => {
                ChatService.sendTyping(recipientId, currentUserId, false);
            }, 2000);
        } else {
            ChatService.sendTyping(recipientId, currentUserId, false);
        }
    };

    useEffect(() => {
        if (!currentUserId || !recipientId) {
            setLoading(false);
            return;
        }

        const fetchRecipientStatus = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/users/search?query=${name}&currentUserId=${currentUserId}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
                if (res.data && res.data.length > 0) {
                    const foundUser = res.data.find(u => u.id === recipientId);
                    if (foundUser) setRecipientStatus(foundUser);
                }
            } catch (e) { /* silent fail for status */ }
        };

        const fetchHistory = async () => {
            try {
                const data = await ChatService.fetchMessages(currentUserId, recipientId, user.accessToken);
                setMessages(data || []);
                setLoading(false);
                // Mark messages as seen
                markMessagesAsSeen(data || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setLoading(false);
            }
        };

        fetchHistory();
        fetchRecipientStatus();
        const statusInterval = setInterval(fetchRecipientStatus, 15000);

        const userId = user?.id || user?.userId;
        ChatService.connect((msg) => {
            if (msg.senderId === recipientId || msg.receiverId === recipientId) {
                setMessages(prev => {
                    const existingIndex = prev.findIndex(m => (m.messageId || m.id) === (msg.messageId || msg.id));
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = msg;
                        return updated;
                    }
                    return [...prev, msg];
                });
            }
        }, userId, null, (typing) => {
            if (typing.senderId === recipientId) {
                setIsTyping(typing.isTyping);
            }
        });

        return () => clearInterval(statusInterval);
    }, [currentUserId, recipientId, markMessagesAsSeen, name, user.accessToken, user?.id, user?.userId]);

    const sendMessage = async (content, type = 'TEXT') => {
        if (!content.trim() && type === 'TEXT') return;
        if (!recipientId) {
            Alert.alert("Error", "No recipient selected");
            return;
        }
        if (!currentUserId) {
            Alert.alert("Error", "User not authenticated");
            return;
        }

        const chatMessage = {
            senderId: currentUserId,
            receiverId: recipientId,
            message: content,
            type: type,
        };

        const tempId = Date.now().toString();
        const tempMsg = { ...chatMessage, messageId: tempId, id: tempId, status: 'SENT' };
        setMessages(prev => [...prev, tempMsg]);

        if (type === 'TEXT') setInputText('');

        try {
            await ChatService.sendMessage(chatMessage, user.accessToken);
        } catch (error) {
            Alert.alert("Error", "Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleImagePick = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
        if (result.didCancel || !result.assets) return;

        setUploading(true);
        try {
            const fileUrl = await ChatService.uploadImage(result.assets[0].uri, user.accessToken);
            sendMessage(fileUrl, 'IMAGE');
        } catch (error) {
            Alert.alert('Error', 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const isMe = item.senderId === currentUserId;
        const msgContent = item.message || item.content;
        
        // Logic for "consecutive messages" grouping feel
        const nextMsg = messages[index + 1];
        const prevMsg = messages[index - 1];
        const isLastInGroup = !nextMsg || nextMsg.senderId !== item.senderId;
        const isFirstInGroup = !prevMsg || prevMsg.senderId !== item.senderId;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.myRow : styles.theirRow,
                isLastInGroup && { marginBottom: 12 }
            ]}>
                <View style={[
                    styles.bubble,
                    isMe ? styles.myBubble : styles.theirBubble,
                    isMe 
                        ? (isFirstInGroup ? styles.myTop : (isLastInGroup ? styles.myBottom : styles.myMiddle))
                        : (isFirstInGroup ? styles.theirTop : (isLastInGroup ? styles.theirBottom : styles.theirMiddle))
                ]}>
                    {item.type === 'IMAGE' ? (
                        <Image source={{ uri: msgContent }} style={styles.imageMsg} resizeMode="cover" />
                    ) : item.type === 'STICKER' ? (
                        <Image source={{ uri: msgContent }} style={styles.stickerMsg} resizeMode="contain" />
                    ) : (
                        <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>{msgContent}</Text>
                    )}
                    
                    {isLastInGroup && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isMe && (
                                <Text style={[styles.timeText, styles.myTime]}>
                                    {item.status === 'SENT' ? ' ✓' : item.status === 'DELIVERED' ? ' ✓✓' : item.status === 'SEEN' ? ' 👁' : ''}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.userInfo} activeOpacity={0.8}>
                    <View style={styles.headerAvatarContainer}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerPlaceholder}>
                                <Icon name="person" size={20} color="#8E8E93" />
                            </View>
                        )}
                        {recipientStatus?.online && <View style={styles.headerOnlineBadge} />}
                    </View>
                    <View>
                        <Text style={styles.userName}>{name}</Text>
                        <Text style={styles.statusText}>
                            {recipientStatus?.online ? 'Active now' : 'Offline'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.hIcon} onPress={() => navigation.navigate('Call', { recipientId, recipientName: name, isVideo: false })}>
                        <Icon name="call-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hIcon} onPress={() => navigation.navigate('Call', { recipientId, recipientName: name, isVideo: true })}>
                        <Icon name="videocam-outline" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => (item.messageId || item.id || Date.now() + Math.random()).toString()}
                    contentContainerStyle={styles.listPadding}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>{name} is typing...</Text>
                </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} keyboardVerticalOffset={0}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.inputAction} onPress={() => setShowDrawer(!showDrawer)}>
                        <Icon name={showDrawer ? "keypad" : "happy-outline"} size={26} color="#6C63FF" />
                    </TouchableOpacity>
                    
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={handleInputChange}
                            placeholder="Message..."
                            placeholderTextColor="#5A5A6E"
                            multiline
                            onFocus={() => setShowDrawer(false)}
                        />
                        <TouchableOpacity style={styles.imageAction} onPress={handleImagePick}>
                            <Icon name="image-outline" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {inputText.trim().length > 0 ? (
                        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText)}>
                            <Text style={styles.sendBtnText}>Send</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.micAction}>
                            <Icon name="mic-outline" size={26} color="#FFFFFF" />
                        </View>
                    )}
                </View>

                {showDrawer && (
                    <View style={styles.drawer}>
                        <View style={styles.drawerHeader}>
                            <TouchableOpacity onPress={() => setDrawerType('emoji')} style={[styles.dTab, drawerType === 'emoji' && styles.dActive]}>
                                <Text style={[styles.dText, drawerType === 'emoji' && styles.dActiveText]}>Emojis</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDrawerType('sticker')} style={[styles.dTab, drawerType === 'sticker' && styles.dActive]}>
                                <Text style={[styles.dText, drawerType === 'sticker' && styles.dActiveText]}>Stickers</Text>
                            </TouchableOpacity>
                        </View>
                        {drawerType === 'emoji' ? (
                            <View style={{ height: 250 }}>
                                <EmojiKeyboard onEmojiSelected={e => setInputText(p => p + e.emoji)} theme={{ backdrop: '#00000000' }} />
                            </View>
                        ) : (
                            <View style={styles.stickerGrid}>
                                {stickers.map((s, i) => (
                                    <TouchableOpacity key={i} onPress={() => { sendMessage(s, 'STICKER'); setShowDrawer(false); }}>
                                        <Image source={{ uri: s }} style={styles.stIcon} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0E21' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C1F3A' },
    backBtn: { marginRight: 8, padding: 4 },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerAvatarContainer: { position: 'relative', marginRight: 12 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20 },
    headerPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1F3A', justifyContent: 'center', alignItems: 'center' },
    headerOnlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#0A0E21' },
    userName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    statusText: { color: '#8E8E93', fontSize: 12 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    hIcon: { marginLeft: 18, padding: 4 },
    listPadding: { paddingHorizontal: 16, paddingVertical: 20 },
    messageRow: { flexDirection: 'row', width: '100%', marginBottom: 2 },
    myRow: { justifyContent: 'flex-end' },
    theirRow: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '75%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
    myBubble: { backgroundColor: '#6C63FF' },
    theirBubble: { backgroundColor: '#1C1F3A' },
    myTop: { borderTopRightRadius: 4 },
    myMiddle: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
    myBottom: { borderBottomRightRadius: 4 },
    theirTop: { borderTopLeftRadius: 4 },
    theirMiddle: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
    theirBottom: { borderBottomLeftRadius: 4 },
    msgText: { fontSize: 15, lineHeight: 21 },
    myText: { color: '#FFFFFF' },
    theirText: { color: '#FFFFFF' },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.6 },
    myTime: { color: '#FFFFFF' },
    theirTime: { color: '#8E8E93' },
    imageMsg: { width: 220, height: 220, borderRadius: 14 },
    stickerMsg: { width: 100, height: 100 },
    inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1C1F3A' },
    inputAction: { padding: 10 },
    textInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1F3A', borderRadius: 24, paddingHorizontal: 14, minHeight: 44, maxHeight: 120 },
    textInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 8, marginRight: 8 },
    imageAction: { padding: 4 },
    sendBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    sendBtnText: { color: '#6C63FF', fontSize: 16, fontWeight: '700' },
    micAction: { padding: 10 },
    drawer: { backgroundColor: '#1C1F3A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
    drawerHeader: { flexDirection: 'row', marginBottom: 10 },
    dTab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    dActive: { borderBottomColor: '#6C63FF' },
    dText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
    dActiveText: { color: '#FFFFFF' },
    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', padding: 20 },
    stIcon: { width: 60, height: 60, margin: 10 },
    typingIndicator: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1C1F3A', marginHorizontal: 16, marginBottom: 10, borderRadius: 16 },
    typingText: { color: '#8E8E93', fontSize: 14, fontStyle: 'italic' },
    centered: { justifyContent: 'center', alignItems: 'center' }
});

export default ChatScreen;
