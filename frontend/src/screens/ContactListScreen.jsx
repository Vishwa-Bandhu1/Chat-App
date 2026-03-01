import React, { useEffect, useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, PermissionsAndroid, Platform, TextInput, ActivityIndicator, Alert, Linking, Share } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import UserService from '../services/UserService';
import { AuthContext } from '../navigation/AppNavigator';

const ContactListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [allContacts, setAllContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                    {
                        title: 'Contacts Permission',
                        message: 'This app needs access to your contacts to see who is using the app.',
                        buttonPositive: 'OK',
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('Permission Denied', 'Cannot access contacts.');
                    setLoading(false);
                    return;
                }
            }

            const deviceContacts = await Contacts.getAll();

            // Extract and clean phone numbers
            const uniquePhoneNumbers = new Set();
            const contactMap = new Map(); // Keep track of numbers -> device contact info

            deviceContacts.forEach(contact => {
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    contact.phoneNumbers.forEach(phone => {
                        // Clean number: keep only digits and leading +
                        let cleanNum = phone.number.replace(/[^\d+]/g, '');
                        // Optional: assume local country code if missing
                        if (cleanNum) {
                            uniquePhoneNumbers.add(cleanNum);
                            if (!contactMap.has(cleanNum)) {
                                contactMap.set(cleanNum, {
                                    displayName: contact.displayName || contact.givenName + ' ' + (contact.familyName || ''),
                                    phone: cleanNum,
                                    hasThumbnail: contact.hasThumbnail,
                                    thumbnailPath: contact.thumbnailPath
                                });
                            }
                        }
                    });
                }
            });

            const phoneList = Array.from(uniquePhoneNumbers);

            // Sync with backend
            let registeredUsers = [];
            if (phoneList.length > 0) {
                registeredUsers = await UserService.syncContacts(phoneList, user.accessToken);
            }

            // Merge data
            const registeredPhones = new Set(registeredUsers.map(u => u.phoneNumber));

            const finalContacts = [];

            // Add registered users first
            registeredUsers.forEach(rUser => {
                finalContacts.push({
                    id: rUser.id,
                    isRegistered: true,
                    fullName: rUser.fullName || rUser.username,
                    username: rUser.username,
                    phoneNumber: rUser.phoneNumber,
                    avatar: rUser.avatar
                });
            });

            // Add unregistered ones
            contactMap.forEach((contactInfo, phone) => {
                if (!registeredPhones.has(phone)) {
                    finalContacts.push({
                        id: `unreg_${phone}`,
                        isRegistered: false,
                        fullName: contactInfo.displayName,
                        phoneNumber: phone
                    });
                }
            });

            // Sort: Registered first, then alphabetical
            finalContacts.sort((a, b) => {
                if (a.isRegistered && !b.isRegistered) return -1;
                if (!a.isRegistered && b.isRegistered) return 1;
                return (a.fullName || '').localeCompare(b.fullName || '');
            });

            setAllContacts(finalContacts);

        } catch (error) {
            console.error("Error loading contacts:", error);
            Alert.alert("Error", "Failed to load contacts.");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (phoneNumber) => {
        try {
            await Share.share({
                message: `Hey! I'm using this awesome Chat App. Download it here: [Placeholder Link]`,
            });
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    const filteredContacts = useMemo(() => {
        if (!searchQuery) return allContacts;
        return allContacts.filter(c =>
            (c.fullName && c.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.username && c.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.phoneNumber && c.phoneNumber.includes(searchQuery))
        );
    }, [allContacts, searchQuery]);


    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.avatar}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>
                        {(item.fullName || item.phoneNumber || '?').charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.fullName || item.phoneNumber}</Text>
                {item.isRegistered ? (
                    <Text style={styles.status}>@{item.username}</Text>
                ) : (
                    <Text style={styles.statusText}>{item.phoneNumber}</Text>
                )}
            </View>

            {item.isRegistered ? (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Chat', {
                        name: item.fullName || item.username,
                        recipientId: item.id,
                        avatar: item.avatar
                    })}
                >
                    <Icon name="chatbubble-ellipses" size={20} color="#fff" />
                    <Text style={styles.actionText}> Chat</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.actionButton, styles.inviteButton]}
                    onPress={() => handleInvite(item.phoneNumber)}
                >
                    <Icon name="share-outline" size={20} color="#007AFF" />
                    <Text style={styles.inviteText}> Invite</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" />
                <TextInput
                    style={styles.input}
                    placeholder="Search Contacts"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredContacts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No contacts found.</Text>
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
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 15, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 44, height: 44, borderRadius: 22 },
    avatarText: { fontSize: 18, color: '#555', fontWeight: 'bold' },
    info: { flex: 1, justifyContent: 'center' },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    status: { color: '#666', marginTop: 2, fontSize: 13 },
    statusText: { color: '#999', marginTop: 2, fontSize: 13 },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    inviteButton: { backgroundColor: '#E5F1FF', borderWidth: 1, borderColor: '#007AFF' },
    inviteText: { color: '#007AFF', fontWeight: 'bold', fontSize: 13 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
    emptyText: { color: 'gray', fontSize: 16 }
});

export default ContactListScreen;
