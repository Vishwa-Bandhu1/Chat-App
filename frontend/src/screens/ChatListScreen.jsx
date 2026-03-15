import React, { useState, useContext, useCallback } from 'react';
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
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../navigation/AppNavigator';
import ChatService from '../services/ChatService';
import axios from 'axios';

const API_URL = 'http://192.168.1.5:8080';

const ChatListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [convData, groupData] = await Promise.all([
                ChatService.fetchConversations(user.id, user.accessToken).catch(() => []),
                axios.get(`${API_URL}/api/groups/user/${user.id}`, {
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
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [user])
    );

    const handleDeleteConversation = (item) => {
        Alert.alert(
            'Delete Chat',
            `Delete conversation with ${item.fullName || item.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/conversations/${user.id}/${item.userId}`, {
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

    const renderChatCircle = (item) => {
        if (item.avatar) {
            return <Image source={{ uri: item.avatar }} style={styles.avatar} />;
        }
        return (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Icon name={item._type === 'group' ? "people" : "person"} size={26} color="#8E8E93" />
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const isGroup = item._type === 'group';
        const displayName = isGroup ? item.name : (item.fullName || item.username);
        const lastMsg = item.lastMessage || (isGroup ? `${item.memberIds?.length || 0} members` : 'No messages yet');
        
        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => {
                    if (isGroup) {
                        navigation.navigate('GroupChat', { groupId: item.id, name: item.name });
                    } else {
                        navigation.navigate('Chat', {
                            name: displayName,
                            recipientId: item.userId,
                            avatar: item.avatar
                        });
                    }
                }}
                onLongPress={() => isGroup ? null : handleDeleteConversation(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarWrapper}>
                    {renderChatCircle(item)}
                    {item.online && <View style={styles.onlineBadge} />}
                </View>
                
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeaderRow}>
                        <Text style={styles.chatName} numberOfLines={1}>{displayName}</Text>
                        {item.timestamp && (
                            <Text style={styles.chatTime}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        )}
                    </View>
                    <View style={styles.chatFooterRow}>
                        <Text style={styles.lastMessage} numberOfLines={1}>{lastMsg}</Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const allItems = [
        ...groups.map(g => ({ ...g, _type: 'group' })),
        ...chats.map(c => ({ ...c, _type: 'chat' }))
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0E21" />
            
            {/* Instagram Style Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('UserSearch')}
                    >
                        <Icon name="search-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="ellipsis-vertical" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && allItems.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : (
                <FlatList
                    data={allItems}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item.userId || Math.random()).toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="chatbubble-ellipses-outline" size={64} color="#1C1F3A" style={{marginBottom: 16}} />
                            <Text style={styles.emptyText}>Your inbox is empty</Text>
                            <TouchableOpacity 
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('UserSearch')}
                            >
                                <Text style={styles.emptyButtonText}>Start a Conversation</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateGroup')}
                activeOpacity={0.8}
            >
                <Icon name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E21',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#0A0E21',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 20,
        padding: 4,
    },
    listContent: {
        paddingBottom: 100,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 1.5,
        borderColor: '#1C1F3A',
    },
    placeholderAvatar: {
        backgroundColor: '#1C1F3A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#0A0E21',
    },
    chatInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 8,
    },
    chatTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    chatFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#8E8E93',
        flex: 1,
        marginRight: 8,
    },
    unreadBadge: {
        backgroundColor: '#6C63FF',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    emptyButton: {
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.3)',
    },
    emptyButtonText: {
        color: '#6C63FF',
        fontWeight: '700',
        fontSize: 15,
    }
});

export default ChatListScreen;
