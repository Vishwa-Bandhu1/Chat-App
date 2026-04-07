import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    StatusBar,
    SafeAreaView,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../navigation/AppNavigator';
import ChatService from '../services/ChatService';
import { API_URLS } from '../config/apiConfig';
import axios from 'axios';

const API_URL = API_URLS.CHATS.replace('/api/chat', '');

const COLORS = {
    bg: '#000000',
    surface: '#111111',
    card: '#1A1A1A',
    border: '#1F1F1F',
    accent: '#A78BFA',
    accentDark: '#7C3AED',
    white: '#FFFFFF',
    textPrimary: '#F5F5F5',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    online: '#34D399',
    danger: '#EF4444',
};

// ─── Reusable Avatar Component ───────────────────────────────────────────
const AVATAR_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'
];

const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

const Avatar = ({ uri, name, size = 56, online, style }) => {
    const [isLoading, setIsLoading] = useState(!!uri);
    const [hasError, setHasError] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const initials = (name || '?').charAt(0).toUpperCase();
    const bgColor = getAvatarColor(name);

    const handleLoad = () => {
        setIsLoading(false);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const showInitials = !uri || hasError || uri.trim() === '';

    return (
        <View style={[{ width: size, height: size, position: 'relative' }, style]}>
            <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor: showInitials ? bgColor : COLORS.card }]}>
                {showInitials ? (
                    <Text style={[styles.avatarInitial, { fontSize: size * 0.45 }]}>
                        {initials}
                    </Text>
                ) : (
                    <>
                        {isLoading && (
                            <View style={[StyleSheet.absoluteFill, styles.avatarLoading]}>
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            </View>
                        )}
                        <Animated.Image 
                            source={{ uri, cache: 'force-cache' }} 
                            style={[
                                styles.avatarImage, 
                                { width: size, height: size, borderRadius: size / 2, opacity: fadeAnim }
                            ]} 
                            onLoad={handleLoad}
                            onError={handleError}
                        />
                    </>
                )}
            </View>
            {online && <View style={[styles.onlineDot, { width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, bottom: size * 0.02, right: size * 0.02 }]} />}
        </View>
    );
};

// ─── Relative Timestamp Formatter ────────────────────────────────────────
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Animated Chat Item ──────────────────────────────────────────────────
const ChatItem = ({ item, onPress, onLongPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isGroup = item._type === 'group';
    const displayName = isGroup ? item.name : (item.fullName || item.username);
    const lastMsg = item.lastMessage || (isGroup ? `${item.memberIds?.length || 0} members` : 'Tap to start chatting');
    const hasUnread = item.unreadCount > 0;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={styles.chatItem}
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                delayLongPress={400}
            >
                {/* Avatar */}
                <Avatar 
                    uri={item.avatar} 
                    name={displayName} 
                    online={item.online} 
                    size={56} 
                    style={styles.avatarWrapper} 
                />

                {/* Chat Info */}
                <View style={styles.chatContent}>
                    <View style={styles.topRow}>
                        <Text
                            style={[styles.displayName, hasUnread && styles.displayNameUnread]}
                            numberOfLines={1}
                        >
                            {displayName}
                        </Text>
                        <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
                            {formatRelativeTime(item.timestamp)}
                        </Text>
                    </View>
                    <View style={styles.bottomRow}>
                        <Text
                            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {lastMsg}
                        </Text>
                        {hasUnread && (
                            <View style={styles.unreadPill}>
                                <Text style={styles.unreadText}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────
const ChatListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const userId = user?.id || user?.userId;
        if (!userId) return;
        setLoading(true);
        try {
            const [convData, groupData] = await Promise.all([
                ChatService.fetchConversations(userId, user.accessToken).catch(() => []),
                axios.get(`${API_URL}/api/groups/user/${userId}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                }).then(res => res.data).catch(() => [])
            ]);
            setChats(convData || []);
            setGroups(groupData || []);
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const userId = user?.id || user?.userId;
        if (!userId) return;

        const updateConversation = (conversation) => {
            setChats(prev => {
                const existingIndex = prev.findIndex(c => c.id === conversation.id || c.userId === conversation.userId);
                const next = [...prev];
                if (existingIndex >= 0) {
                    next[existingIndex] = { ...next[existingIndex], ...conversation };
                } else {
                    next.push(conversation);
                }
                return next.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            });
        };

        ChatService.connect(() => {}, userId, null, null, updateConversation);
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleDeleteConversation = (item) => {
        const userId = user?.id || user?.userId;
        Alert.alert(
            'Delete Conversation',
            `Remove chat with ${item.fullName || item.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/conversations/${userId}/${item.userId}`, {
                                headers: { Authorization: `Bearer ${user.accessToken}` }
                            });
                            setChats(prev => prev.filter(c => c.userId !== item.userId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete conversation');
                        }
                    }
                }
            ]
        );
    };

    const handleChatPress = (item) => {
        const isGroup = item._type === 'group';
        if (isGroup) {
            navigation.navigate('GroupChat', { groupId: item.id, name: item.name });
        } else {
            navigation.navigate('Chat', {
                name: item.fullName || item.username,
                recipientId: item.userId,
                avatar: item.avatar
            });
        }
    };

    const allItems = [
        ...groups.map(g => ({ ...g, _type: 'group' })),
        ...chats.map(c => ({ ...c, _type: 'chat' }))
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => navigation.navigate('UserSearch')}
                        activeOpacity={0.6}
                    >
                        <Icon name="search-outline" size={23} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Content ── */}
            {loading && allItems.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            ) : (
                <FlatList
                    data={allItems}
                    renderItem={({ item }) => (
                        <ChatItem
                            item={item}
                            onPress={() => handleChatPress(item)}
                            onLongPress={() => item._type !== 'group' && handleDeleteConversation(item)}
                        />
                    )}
                    keyExtractor={item => (item.id || item.userId || Math.random()).toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        allItems.length === 0 && { flex: 1 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrapper}>
                                <Icon name="chatbubbles-outline" size={48} color="#A78BFA" />
                            </View>
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Search for people to start a conversation
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => navigation.navigate('UserSearch')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.emptyBtnText}>Find People</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* ── FAB ── */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateGroup')}
                activeOpacity={0.85}
            >
                <View style={styles.fabInner}>
                    <Icon name="create-outline" size={24} color="#FFFFFF" />
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────
// COLORS object moved to top of file

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // ── Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: COLORS.bg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── List
    listContent: {
        paddingTop: 4,
        paddingBottom: 100,
    },
    separator: {
        height: 0.5,
        backgroundColor: COLORS.border,
        marginLeft: 84,
        marginRight: 20,
    },

    // ── Chat Item
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    avatarWrapper: {
        marginRight: 14,
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        resizeMode: 'cover',
    },
    avatarLoading: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.card,
    },
    avatarInitial: {
        fontWeight: '600',
        color: COLORS.white,
    },
    onlineDot: {
        position: 'absolute',
        backgroundColor: COLORS.online,
        borderWidth: 2.5,
        borderColor: COLORS.bg,
    },

    // ── Chat Content
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    displayName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    displayNameUnread: {
        fontWeight: '700',
        color: COLORS.white,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '400',
    },
    timestampUnread: {
        color: COLORS.accent,
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
        marginRight: 12,
    },
    lastMessageUnread: {
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    unreadPill: {
        backgroundColor: COLORS.accent,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '700',
    },

    // ── FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    fabInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accentDark,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Loader
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 48,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    emptyBtn: {
        backgroundColor: COLORS.accentDark,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
    },
    emptyBtnText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ChatListScreen;
