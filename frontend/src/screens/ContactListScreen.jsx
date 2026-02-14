import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, PermissionsAndroid, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';

const ContactListScreen = ({ navigation }) => {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                {
                    title: 'Contacts',
                    message: 'This app would like to view your contacts.',
                    buttonPositive: 'Please accept bare mortal',
                }
            ).then(
                PermissionsAndroid.RESULTS.GRANTED,
                () => {
                    Contacts.getAll()
                        .then((contacts) => {
                            // Sort by display name
                            const sortedContacts = contacts.sort((a, b) =>
                                (a.displayName || '').localeCompare(b.displayName || '')
                            );
                            setContacts(sortedContacts);
                        })
                        .catch((e) => {
                            console.log(e);
                        });
                }
            );
        } else {
            Contacts.getAll()
                .then((contacts) => {
                    setContacts(contacts);
                })
                .catch((e) => {
                    console.log(e);
                });
        }
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Chat', { name: item.displayName })}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.displayName?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.status}>
                    {item.phoneNumbers && item.phoneNumbers.length > 0
                        ? item.phoneNumbers[0].number
                        : 'No number'}
                </Text>
            </View>
            <Icon name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={contacts}
                renderItem={renderItem}
                keyExtractor={item => item.recordID}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No contacts found or permission denied.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
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
