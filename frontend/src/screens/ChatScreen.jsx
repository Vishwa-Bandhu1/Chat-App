
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
    Modal,
    TouchableWithoutFeedback,
    LayoutAnimation,
    UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import ChatService from '../services/ChatService';
import { AuthContext } from '../navigation/AppNavigator';
import { launchImageLibrary } from 'react-native-image-picker';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import axios from '../services/apiClient';
import { GlobalUI } from '../utils/GlobalUI';

import { API_URLS } from '../config/apiConfig';
import { triggerLongPressHaptic } from '../utils/haptics';

const BASE_URL = API_URLS.CHATS.replace('/api/chat', '');

const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};

const formatMessageTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

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
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const flatListRef = useRef(null);
    const isNearBottom = useRef(true);

    const currentUserId = user?.id || user?.userId;

    const handleLongPress = (item) => {
        if (item.senderId === currentUserId) {
            triggerLongPressHaptic(40);
            setSelectedMessage(item);
            setActionModalVisible(true);
        }
    };

    const confirmDelete = async () => {
        if (!selectedMessage) return;
        const msgId = selectedMessage.id || selectedMessage.messageId;
        
        setActionModalVisible(false);
        
        // Premium LayoutAnimation for smooth collapse and fade out
        LayoutAnimation.configureNext({
            duration: 350,
            update: { type: LayoutAnimation.Types.easeInEaseOut },
            delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
        });
        
        setMessages(prev => prev.filter(m => (m.id || m.messageId) !== msgId));

        try {
            await axios.delete(`${BASE_URL}/api/messages/${msgId}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setSelectedMessage(null);
        } catch (error) {
            GlobalUI.showToast("Failed to fully delete on server.", 'error');
        }
    };

    const handleScroll = (event) => {
        const y = event.nativeEvent.contentOffset.y;
        isNearBottom.current = y < 100;
    };

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
                // Sort by date descending (newest first) to support the inverted FlatList natively
                const sortedData = (data || []).sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
                setMessages(sortedData);
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
                    // Insert at beginning for inverted list
                    return [msg, ...prev];
                });
                
                if (isNearBottom.current) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    }, 100);
                }
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
            GlobalUI.showToast("No recipient selected", 'error');
            return;
        }
        if (!currentUserId) {
            GlobalUI.showToast("User not authenticated", 'error');
            return;
        }

        const chatMessage = {
            senderId: currentUserId,
            receiverId: recipientId,
            message: content,
            type: type,
        };

        const tempId = Date.now().toString();
        const tempMsg = { 
            ...chatMessage, 
            messageId: tempId, 
            id: tempId, 
            status: 'SENT',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        // Insert at beginning for inverted list
        setMessages(prev => [tempMsg, ...prev]);

        if (type === 'TEXT') setInputText('');
        
        // Always scroll to bottom when user sends a message
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);

        try {
            await ChatService.sendMessage(chatMessage, user.accessToken);
        } catch (error) {
            GlobalUI.showToast("Failed to send message", 'error');
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
            GlobalUI.showToast('Upload failed.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const isMe = item.senderId === currentUserId;
        const msgContent = item.message || item.content;
        
        const msgDate = new Date(item.createdAt || item.timestamp || Date.now());
        
        // Because data is inverted, index 0 is newest.
        // The message visually "below" is newer (index - 1)
        // The message visually "above" is older (index + 1)
        const olderMsg = messages[index + 1];
        const newerMsg = messages[index - 1];

        const olderMsgDate = olderMsg ? new Date(olderMsg.createdAt || olderMsg.timestamp || Date.now()) : null;
        const newerMsgDate = newerMsg ? new Date(newerMsg.createdAt || newerMsg.timestamp || Date.now()) : null;
        
        // Date separator should appear immediately BEFORE the chronologically first message of a day
        const showDateSeparator = !olderMsgDate || olderMsgDate.toDateString() !== msgDate.toDateString();

        // Grouping: first message of a consecutive chunk (chronologically => visually TOP)
        const isFirstInGroup = !olderMsg || olderMsg.senderId !== item.senderId || showDateSeparator;

        // Grouping: last message of a contiguous chunk (chronologically => visually BOTTOM)
        const isLastInGroup = !newerMsg || newerMsg.senderId !== item.senderId || (newerMsgDate && newerMsgDate.toDateString() !== msgDate.toDateString());

        const renderTicks = () => {
             if (!isMe) return null;
             if (item.status === 'SENT') return <Icon name="checkmark-outline" size={14} color="#A0A0B0" style={styles.tickIcon} />;
             if (item.status === 'DELIVERED') return <Icon name="checkmark-done-outline" size={14} color="#A0A0B0" style={styles.tickIcon} />;
             if (item.status === 'SEEN') return <Icon name="checkmark-done-outline" size={14} color="#34B7F1" style={styles.tickIcon} />;
             return <Icon name="time-outline" size={12} color="#A0A0B0" style={styles.tickIcon} />; 
        };

        return (
            <View style={{ width: '100%' }}>
                {showDateSeparator && (
                    <View style={styles.dateSeparatorContainer}>
                        <Text style={styles.dateSeparatorText}>{formatDateSeparator(msgDate)}</Text>
                    </View>
                )}
                
                <View style={[
                    styles.messageRow,
                    isMe ? styles.myRow : styles.theirRow,
                    isFirstInGroup && !showDateSeparator && { marginTop: 12 },
                    { marginBottom: 2 }
                ]}>
                    <TouchableOpacity 
                        activeOpacity={0.85}
                        onLongPress={() => handleLongPress(item)}
                        delayLongPress={200}
                        style={[
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
                        
                        <View style={styles.timeContainer}>
                            <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                                {formatMessageTime(msgDate)}
                            </Text>
                            {renderTicks()}
                        </View>
                    </TouchableOpacity>
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
                    inverted
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => (item.messageId || item.id || Date.now() + Math.random()).toString()}
                    contentContainerStyle={styles.listPadding}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
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

            {/* Premium Action Menu Modal */}
            <Modal
                visible={actionModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActionModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.actionMenu}>
                                <TouchableOpacity style={styles.actionItem} onPress={confirmDelete}>
                                    <Icon name="trash-outline" size={22} color="#FF3B30" />
                                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete Message</Text>
                                </TouchableOpacity>
                                
                                <View style={styles.actionDivider} />
                                
                                <TouchableOpacity style={styles.actionItem} onPress={() => setActionModalVisible(false)}>
                                    <Icon name="close-outline" size={22} color="#FFFFFF" />
                                    <Text style={styles.actionText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    bubble: { maxWidth: '75%', minWidth: 85, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18 },
    myBubble: { backgroundColor: '#6C63FF' },
    theirBubble: { backgroundColor: '#1C1F3A' },
    myTop: { borderTopRightRadius: 6 },
    myMiddle: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    myBottom: { borderBottomRightRadius: 6 },
    theirTop: { borderTopLeftRadius: 6 },
    theirMiddle: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
    theirBottom: { borderBottomLeftRadius: 6 },
    msgText: { fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
    myText: { color: '#FFFFFF' },
    theirText: { color: '#EAEAEA' },
    
    timeContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2, marginLeft: 16 },
    timeText: { fontSize: 11, opacity: 0.7 },
    myTimeText: { color: '#E0E0FF' },
    theirTimeText: { color: '#A0A0B0' },
    tickIcon: { marginLeft: 4, marginTop: 1 },
    
    dateSeparatorContainer: {
        alignSelf: 'center',
        backgroundColor: '#1E2240',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    dateSeparatorText: {
        color: '#A0A0B0',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
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
    centered: { justifyContent: 'center', alignItems: 'center' },
    
    // Action Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    actionMenu: { width: 260, backgroundColor: '#1C1F3A', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    actionDivider: { height: 1, backgroundColor: '#2A2E4B' },
    actionText: { fontSize: 16, fontWeight: '600', marginLeft: 14, color: '#FFFFFF' }
});

export default ChatScreen;
