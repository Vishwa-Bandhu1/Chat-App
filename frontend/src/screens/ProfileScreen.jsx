import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthContext } from '../navigation/AppNavigator';

const ProfileScreen = () => {
    const { user, signOut } = React.useContext(AuthContext);

    const onLogout = () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Logout', onPress: signOut }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
                <Text style={styles.name}>{user?.fullName || 'User'}</Text>
                <Text style={styles.status}>@{user?.username}</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.option}>
                    <Icon name="person-outline" size={24} color="#333" />
                    <Text style={styles.optionText}>Edit Profile</Text>
                    <Icon name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.option}>
                    <Icon name="notifications-outline" size={24} color="#333" />
                    <Text style={styles.optionText}>Notifications</Text>
                    <Icon name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.logoutContainer}>
                <CustomButton title="Logout" onPress={onLogout} type="SECONDARY" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, backgroundColor: '#ddd' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    status: { fontSize: 16, color: '#666' },
    section: { backgroundColor: '#fff', paddingVertical: 10 },
    option: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    optionText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
    logoutContainer: { padding: 20, marginTop: 'auto' }
});

export default ProfileScreen;
