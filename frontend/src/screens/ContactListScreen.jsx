import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, PermissionsAndroid, Platform, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import UserService from '../services/UserService';
import { AuthContext } from '../navigation/AppNavigator';

const ContactListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async (query = '') => {
        setLoading(true);
        try {
            const results = await UserService.searchUsers(query, user.id, user.accessToken);
            setUsers(results);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (text) => {
        setSearchQuery(text);
        fetchUsers(text);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chat', {
                name: item.fullName || item.username,
                recipientId: item.id,
                avatar: item.avatar
            })}
        >
            <View style={styles.avatar}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>
                        {(item.fullName || item.username)?.charAt(0).toUpperCase() || '?'}
                    </Text>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.fullName || item.username}</Text>
                <Text style={styles.status}>@{item.username}</Text>
            </View>
            <Icon name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" />
                <TextInput
                    style={styles.input}
                    placeholder="Search Users"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Icon name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', margin: 10, paddingHorizontal: 15, borderRadius: 10, height: 40 },
    input: { flex: 1, marginLeft: 10, color: '#333' },
    item: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, color: '#555', fontWeight: 'bold' },
    info: { flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    status: { color: '#666', marginTop: 2 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
    emptyText: { color: 'gray', fontSize: 16 }
});

export default ContactListScreen;
