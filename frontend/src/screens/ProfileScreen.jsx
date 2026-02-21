import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import CustomButton from '../components/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import UserService from '../services/UserService';
import { AuthContext } from '../navigation/AppNavigator';

const ProfileScreen = () => {
    const { user, signIn, signOut } = React.useContext(AuthContext); // signIn used to update user context
    const [uploading, setUploading] = useState(false);

    const onLogout = () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Logout', onPress: signOut }
        ]);
    };

    const handleAvatarUpload = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.5,
        });

        if (result.didCancel) return;
        if (result.errorMessage) {
            Alert.alert('Error', result.errorMessage);
            return;
        }

        const asset = result.assets[0];
        setUploading(true);

        try {
            const updatedUser = await UserService.uploadAvatar(user.id, asset.uri, user.accessToken);
            // Update local user context with new avatar
            signIn({ ...user, avatar: updatedUser.avatar });
            Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleAvatarUpload} disabled={uploading}>
                    {uploading ? (
                        <View style={[styles.avatar, styles.centered]}>
                            <ActivityIndicator color="#007AFF" />
                        </View>
                    ) : (
                        <Image
                            source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
                            style={styles.avatar}
                        />
                    )}
                    <View style={styles.editIcon}>
                        <Icon name="camera" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.name}>{user?.fullName || 'User'}</Text>
                <Text style={styles.status}>@{user?.username}</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.option} onPress={handleAvatarUpload}>
                    <Icon name="person-outline" size={24} color="#333" />
                    <Text style={styles.optionText}>Change Profile Picture</Text>
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
    editIcon: { position: 'absolute', right: 0, bottom: 15, backgroundColor: '#007AFF', padding: 8, borderRadius: 20 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    status: { fontSize: 16, color: '#666' },
    section: { backgroundColor: '#fff', paddingVertical: 10 },
    option: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    optionText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
    logoutContainer: { padding: 20, marginTop: 'auto' }
});

export default ProfileScreen;
