
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from '../navigation/AppNavigator';
import UserService from '../services/UserService';

const ProfileSetupScreen = ({ route }) => {
    const { user, token } = route.params; // Partial user from OTP verification
    const [name, setName] = useState('');
    const [avatarUri, setAvatarUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signIn } = useContext(AuthContext);

    const handlePickImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', response.errorMessage);
                return;
            }
            if (response.assets && response.assets.length > 0) {
                setAvatarUri(response.assets[0].uri);
            }
        });
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }

        setLoading(true);
        try {
            // Update Name
            // We need an endpoint for updating profile. 
            // For now, let's assume we can use a service method that calls the backend.
            // If the backend doesn't have a specific "update profile" endpoint for name,
            // we might need to add one or use an existing one.
            // Let's assume UserService.updateProfile(id, name, token) exists or we create it.

            // Wait, we don't have updateProfile in UserService yet. 
            // We have uploadAvatar.

            // Let's implement updateProfile in UserService next.
            await UserService.updateProfile(user.id, name, token);

            if (avatarUri) {
                await UserService.uploadAvatar(user.id, avatarUri, token);
            }

            // Finally Sign In
            signIn({
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken: token,
                fullName: name,
                avatar: avatarUri // optimistically set
            });

        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile Info</Text>
                <Text style={styles.subtitle}>Please provide your name and an optional profile photo.</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                                style={styles.avatarIcon}
                            />
                        </View>
                    )}
                    <View style={styles.cameraIcon}>
                        <Text>📷</Text>
                    </View>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Type your name here"
                    value={name}
                    onChangeText={setName}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#00A884" style={{ marginTop: 20 }} />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00A884',
        marginBottom: 10,
    },
    subtitle: {
        color: '#666',
        textAlign: 'center',
    },
    content: {
        alignItems: 'center',
        paddingTop: 40,
    },
    avatarContainer: {
        marginBottom: 30,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarIcon: {
        width: 60,
        height: 60,
        opacity: 0.5,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#00A884',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    input: {
        borderBottomWidth: 2,
        borderBottomColor: '#00A884',
        width: '80%',
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#00A884',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ProfileSetupScreen;
