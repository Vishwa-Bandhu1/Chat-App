import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import UserService from '../services/UserService';
import { AuthContext } from '../navigation/AppNavigator';

const ProfileScreen = () => {
    const { user, signIn, signOut } = React.useContext(AuthContext);
    const [uploading, setUploading] = useState(false);

    const onLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', onPress: signOut, style: 'destructive' }
        ]);
    };

    const handleAvatarUpload = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.5,
        });

        if (result.didCancel || !result.assets) return;

        const asset = result.assets[0];
        setUploading(true);

        try {
            const updatedUser = await UserService.uploadAvatar(user.id, asset.uri, user.accessToken);
            signIn({ ...user, avatar: updatedUser.avatar });
            Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const OptionItem = ({ icon, label, onPress, color = '#FFFFFF' }) => (
        <TouchableOpacity style={styles.option} onPress={onPress}>
            <View style={styles.optionIconContainer}>
                <Icon name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.optionLabel, { color }]}>{label}</Text>
            <Icon name="chevron-forward" size={18} color="#2A2D4A" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleAvatarUpload} disabled={uploading} style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            {uploading ? (
                                <View style={[styles.avatar, styles.centered]}>
                                    <ActivityIndicator size="large" color="#6C63FF" />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
                                    style={styles.avatar}
                                />
                            )}
                        </View>
                        <View style={styles.cameraIconContainer}>
                            <Icon name="camera" size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.fullName}>{user?.fullName || 'User'}</Text>
                    <Text style={styles.username}>@{user?.username}</Text>
                    
                    <TouchableOpacity style={styles.editProfileBtn}>
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.optionsCard}>
                        <OptionItem icon="person-circle-outline" label="Account Details" />
                        <OptionItem icon="notifications-outline" label="Notifications" />
                        <OptionItem icon="shield-checkmark-outline" label="Privacy & Security" />
                        <OptionItem icon="color-palette-outline" label="Appearance" />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.optionsCard}>
                        <OptionItem icon="help-circle-outline" label="Help Center" />
                        <OptionItem icon="information-circle-outline" label="About ChatApp" />
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                        <Icon name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E21',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1F3A',
    },
    avatarContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    avatarBorder: {
        padding: 4,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#1C1F3A',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#6C63FF',
        padding: 8,
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#0A0E21',
    },
    fullName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 20,
    },
    editProfileBtn: {
        backgroundColor: '#1C1F3A',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2D4A',
    },
    editProfileText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5A5A6E',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    optionsCard: {
        backgroundColor: '#1C1F3A',
        borderRadius: 16,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    optionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    logoutContainer: {
        padding: 20,
        marginTop: 20,
        marginBottom: 40,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    logoutText: {
        color: '#FF6B6B',
        fontSize: 17,
        fontWeight: '700',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProfileScreen;
