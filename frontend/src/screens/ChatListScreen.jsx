import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

const dummyChats = [];

const ChatListScreen = ({ navigation }) => {
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Chat', { name: item.name })}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.message}>{item.message}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={dummyChats}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    item: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#ccc' },
    info: { flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    message: { color: '#666', marginTop: 2 },
    time: { color: '#999', fontSize: 12 }
});

export default ChatListScreen;
