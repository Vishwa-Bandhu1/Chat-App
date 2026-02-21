
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../navigation/AppNavigator';
import AuthService from '../services/AuthService';

const OTPScreen = ({ route, navigation }) => {
    const { phoneNumber, confirmation } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useContext(AuthContext);

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify OTP with Firebase
            const result = await confirmation.confirm(otp);
            const idToken = await result.user.getIdToken();

            // 2. Verify ID Token with Backend
            const data = await AuthService.verifyIdToken(phoneNumber, idToken);
            setLoading(false);

            if (data.isNewUser) {
                navigation.navigate('ProfileSetup', { user: data, token: data.accessToken });
            } else {
                signIn({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    fullName: data.fullName,
                    phoneNumber: phoneNumber,
                    id: data.id
                });
            }
        } catch (error) {
            console.error("OTPScreen Error:", error);
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP or Verification Failed.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Verifying your number</Text>
                <Text style={styles.subtitle}>
                    Waiting to automatically detect an SMS sent to {phoneNumber}.
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="- - - - - -"
                        placeholderTextColor="#ccc"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        autoFocus
                    />
                </View>

                <Text style={styles.resendText}>Didn't receive code?</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#00A884" style={{ marginTop: 20 }} />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleVerify}>
                        <Text style={styles.buttonText}>Verify</Text>
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
        alignItems: 'center',
    },
    content: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00A884',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        borderBottomWidth: 2,
        borderBottomColor: '#00A884',
        marginBottom: 30,
        width: 150,
        alignItems: 'center',
    },
    input: {
        fontSize: 30,
        letterSpacing: 8,
        textAlign: 'center',
        color: '#333',
        width: '100%',
        padding: 5,
    },
    resendText: {
        color: '#007AFF', // WhatsApp blue link color
        marginBottom: 30,
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

export default OTPScreen;
