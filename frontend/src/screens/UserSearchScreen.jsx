import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
    Animated,
    Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../navigation/AppNavigator';
import UserService from '../services/UserService';
import { debounce } from 'lodash';

const COLORS = {
    bg: '#000000',
    surface: '#111111',
    card: '#1A1A1A',
    border: '#1F1F1F',
    searchBg: '#1C1C1E',
    accent: '#A78BFA',
    accentDark: '#7C3AED',
    white: '#FFFFFF',
    textPrimary: '#F5F5F5',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    online: '#34D399',
};

// ─── Animated User Item ──────────────────────────────────────────────────
const UserItem = ({ item, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

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
                style={styles.userItem}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
            >
                <View style={styles.userAvatarContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
                    ) : (
                        <View style={[styles.userAvatar, styles.placeholderAvatar]}>
                            <Text style={styles.avatarInitial}>
                                {(item.fullName || item.username || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.fullName || item.username}
                    </Text>
                    <Text style={styles.userHandle} numberOfLines={1}>
                        @{item.username}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Main Search Screen ──────────────────────────────────────────────────
const UserSearchScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const inputRef = useRef(null);
    const barWidth = useRef(new Animated.Value(0)).current;

    // Animate search bar on mount
    useEffect(() => {
        Animated.spring(barWidth, {
            toValue: 1,
            useNativeDriver: false,
            speed: 14,
            bounciness: 4,
        }).start();

        // Auto-focus on mount
        setTimeout(() => inputRef.current?.focus(), 150);
    }, [barWidth]);

    // Debounced search
    const debouncedSearch = useCallback( // eslint-disable-line react-hooks/exhaustive-deps
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
        [user, debounce]
    );

    useEffect(() => {
        debouncedSearch(query);
        return () => debouncedSearch.cancel();
    }, [query, debouncedSearch]);

    const handleUserSelect = (selectedUser) => {
        Keyboard.dismiss();
        navigation.navigate('Chat', {
            name: selectedUser.fullName || selectedUser.username,
            recipientId: selectedUser.id,
            avatar: selectedUser.avatar
        });
    };

    const handleCancel = () => {
        Keyboard.dismiss();
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {/* ── Search Header ── */}
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor={COLORS.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setQuery('')}
                            style={styles.clearBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="close-circle" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* ── Results ── */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={({ item }) => (
                        <UserItem item={item} onPress={() => handleUserSelect(item)} />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        results.length === 0 && { flex: 1 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        query.trim() ? (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrapper}>
                                    <Icon name="person-outline" size={36} color={COLORS.textMuted} />
                                </View>
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptySubtitle}>
                                    Try searching with a different name or username
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconWrapper}>
                                    <Icon name="search" size={36} color={COLORS.textMuted} />
                                </View>
                                <Text style={styles.emptyTitle}>Search for people</Text>
                                <Text style={styles.emptySubtitle}>
                                    Find friends by their name or username to start chatting
                                </Text>
                            </View>
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // ── Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.searchBg,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.white,
        height: '100%',
        letterSpacing: 0.1,
    },
    clearBtn: {
        padding: 2,
    },
    cancelBtn: {
        marginLeft: 14,
        paddingVertical: 6,
    },
    cancelText: {
        color: COLORS.accent,
        fontSize: 16,
        fontWeight: '500',
    },

    // ── List
    listContent: {
        paddingVertical: 4,
    },
    separator: {
        height: 0.5,
        backgroundColor: COLORS.border,
        marginLeft: 76,
        marginRight: 16,
    },

    // ── User Item
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    userAvatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    placeholderAvatar: {
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.accent,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.online,
        borderWidth: 2,
        borderColor: COLORS.bg,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    userHandle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    // ── States
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
    },
    emptyIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.searchBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default UserSearchScreen;
