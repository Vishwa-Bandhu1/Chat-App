import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
    Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../navigation/AppNavigator';
import UserService from '../services/UserService';
import axios from 'axios';

const API_URL = 'http://192.168.1.5:8080/api/groups';

const CreateGroupScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [groupName, setGroupName] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const results = await UserService.searchUsers('', user.id, user.accessToken);
            setUsers(results);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const createGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }
        if (selectedUsers.length < 1) {
            Alert.alert('Error', 'Please select at least one member.');
            return;
        }

        setCreating(true);
        try {
            const memberIds = [...selectedUsers, user.id];
            await axios.post(API_URL + '/create', {
                name: groupName,
                ownerId: user.id,
                memberIds: memberIds,
            }, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });

            Alert.alert('Success', `Group "${groupName}" created!`);
            navigation.goBack();
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group.');
        } finally {
            setCreating(false);
        }
    };

    const renderUser = ({ item }) => {
        const isSelected = selectedUsers.includes(item.id);
        return (
            <TouchableOpacity 
                style={[styles.userItem, isSelected && styles.selectedItem]} 
                onPress={() => toggleUser(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.avatarText}>
                                {(item.fullName || item.username)?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.fullName || item.username}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                </View>
                <Icon
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                    color={isSelected ? "#6C63FF" : "#2A2D4A"}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Group</Text>
                <TouchableOpacity onPress={createGroup} disabled={creating} style={styles.createBtn}>
                    {creating ? (
                        <ActivityIndicator size="small" color="#6C63FF" />
                    ) : (
                        <Text style={[styles.createBtnText, (!groupName.trim() || selectedUsers.length === 0) && styles.disabledText]}>
                            Create
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
                <View style={styles.groupIconContainer}>
                    <Icon name="people" size={32} color="#6C63FF" />
                </View>
                <TextInput
                    style={styles.input}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter group name..."
                    placeholderTextColor="#5A5A6E"
                />
            </View>

            <View style={styles.memberHeader}>
                <Text style={styles.sectionTitle}>Add Members</Text>
                {selectedUsers.length > 0 && (
                    <Text style={styles.selectedCount}>
                        {selectedUsers.length} selected
                    </Text>
                )}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>No users found to add.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0E21' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1F3A'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    createBtn: { paddingHorizontal: 4 },
    createBtnText: { fontSize: 17, fontWeight: '700', color: '#6C63FF' },
    disabledText: { color: '#2A2D4A' },
    inputSection: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20, 
        backgroundColor: '#0A0E21',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1F3A'
    },
    groupIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1C1F3A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    input: { flex: 1, fontSize: 18, color: '#FFFFFF', fontWeight: '500' },
    memberHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#5A5A6E', textTransform: 'uppercase', letterSpacing: 1 },
    selectedCount: { fontSize: 13, fontWeight: '700', color: '#6C63FF' },
    listContent: { paddingBottom: 40 },
    userItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 12,
    },
    selectedItem: { backgroundColor: 'rgba(108, 99, 255, 0.05)' },
    avatarContainer: { marginRight: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    placeholderAvatar: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#1C1F3A', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    username: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
    emptyText: { color: '#8E8E93', fontSize: 16, marginTop: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default CreateGroupScreen;
