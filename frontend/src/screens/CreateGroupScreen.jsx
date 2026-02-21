import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../navigation/AppNavigator';
import UserService from '../services/UserService';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8080/api/groups';

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
            const memberIds = [...selectedUsers, user.id]; // Include self
            const response = await axios.post(API_URL + '/create', {
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
            <TouchableOpacity style={[styles.userItem, isSelected && styles.selectedItem]} onPress={() => toggleUser(item.id)}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.fullName || item.username)?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.fullName || item.username}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                </View>
                <Icon
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? "#007AFF" : "#ccc"}
                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Group</Text>
                <TouchableOpacity onPress={createGroup} disabled={creating}>
                    {creating ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <Text style={styles.createButton}>Create</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Icon name="people" size={24} color="#007AFF" />
                <TextInput
                    style={styles.input}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group Name"
                    placeholderTextColor="#999"
                />
            </View>

            {selectedUsers.length > 0 && (
                <Text style={styles.selectedCount}>
                    {selectedUsers.length} member(s) selected
                </Text>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users available.</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    createButton: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    selectedCount: { padding: 10, paddingLeft: 15, color: '#007AFF', fontWeight: '600', fontSize: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    selectedItem: { backgroundColor: '#e8f4ff' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    info: { flex: 1, marginLeft: 12 },
    name: { fontSize: 16, fontWeight: '500', color: '#333' },
    username: { fontSize: 13, color: '#999' },
    emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#999' }
});

export default CreateGroupScreen;
