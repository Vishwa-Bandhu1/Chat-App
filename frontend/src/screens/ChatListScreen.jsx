import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../navigation/AppNavigator';
import ChatService from '../services/ChatService';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8080';

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
            `Delete conversation with ${item.fullName || item.username}? All messages will be removed.`,
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

    const handleDeleteGroup = (item) => {
        Alert.alert(
            'Delete Group',
            `Delete group "${item.name}"? All messages will be removed.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/api/groups/${item.id}`, {
                                headers: { Authorization: `Bearer ${user.accessToken}` }
                            });
                            setGroups(prev => prev.filter(g => g.id !== item.id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete group');
                        }
                    }
                }
            ]
        );
    };

    const renderConversation = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chat', {
                name: item.fullName || item.username,
                recipientId: item.userId,
                avatar: item.avatar
            })}
            onLongPress={() => handleDeleteConversation(item)}
        >
            {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Icon name="person" size={30} color="#fff" />
                </View>
            )}
            <View style={styles.info}>
                <Text style={styles.name}>{item.fullName || item.username}</Text>
                <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.timestamp && (
                <Text style={styles.time}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            )}
        </TouchableOpacity>
    );

    const renderGroup = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('GroupChat', {
                groupId: item.id,
                name: item.name
            })}
            onLongPress={() => handleDeleteGroup(item)}
        >
            <View style={[styles.avatar, styles.groupAvatar]}>
                <Icon name="people" size={28} color="#fff" />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.message} numberOfLines={1}>
                    {item.lastMessage || `${item.memberIds?.length || 0} members`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const allItems = [
        ...groups.map(g => ({ ...g, _type: 'group' })),
        ...chats.map(c => ({ ...c, _type: 'chat' }))
    ];

    const renderItem = ({ item }) => {
        if (item._type === 'group') return renderGroup({ item });
        return renderConversation({ item });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={allItems}
                renderItem={renderItem}
                keyExtractor={item => item.id || item.userId || Math.random().toString()}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No conversations yet. Start a chat from Contacts!</Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateGroup')}
            >
                <Icon name="people-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    item: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
    placeholderAvatar: { backgroundColor: '#ccc' },
    groupAvatar: { backgroundColor: '#007AFF' },
    info: { flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    message: { color: '#666', marginTop: 2 },
    time: { color: '#999', fontSize: 12 },
    emptyText: { color: '#999', fontSize: 16 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 }
});

export default ChatListScreen;
