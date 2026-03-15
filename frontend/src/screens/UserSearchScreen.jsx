import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../navigation/AppNavigator';
import UserService from '../services/UserService';
import { debounce } from 'lodash';

const UserSearchScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounced search to avoid excessive API calls
    const debouncedSearch = useCallback(
        debounce(async (searchValue) => {
            if (!searchValue.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const users = await UserService.searchUsers(
                    searchValue.trim(),
                    user.id,
                    user.accessToken
                );
                setResults(users || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [user]
    );

    useEffect(() => {
        debouncedSearch(query);
        // Cancel the debounce on unmount
        return () => debouncedSearch.cancel();
    }, [query, debouncedSearch]);

    const handleUserSelect = (selectedUser) => {
        navigation.navigate('Chat', {
            name: selectedUser.fullName || selectedUser.username,
            recipientId: selectedUser.id,
            avatar: selectedUser.avatar
        });
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleUserSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.placeholderAvatar}>
                        <Icon name="person" size={24} color="#8E8E93" />
                    </View>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.fullName}>{item.fullName || item.username}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#2A2D4A" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.searchBarContainer}>
                    <Icon name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#5A5A6E"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Icon name="close-circle" size={18} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        query.trim() ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No users found matching "{query}"</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="search" size={64} color="#1C1F3A" style={styles.emptyIcon} />
                                <Text style={styles.emptyText}>Find your friends to start chatting</Text>
                            </View>
                        )
                    }
                />
            )}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1F3A',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    searchBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1F3A',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        height: '100%',
    },
    listContent: {
        paddingVertical: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: '#1C1F3A',
    },
    placeholderAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#1C1F3A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    fullName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    username: {
        fontSize: 14,
        color: '#8E8E93',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default UserSearchScreen;
