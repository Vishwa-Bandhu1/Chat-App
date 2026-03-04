import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../navigation/AppNavigator';
import AuthService from '../services/AuthService';

const OTPScreen = ({ route, navigation }) => {
    // confirmation object passed from PhoneNumberScreen
    const [confirmation, setConfirmation] = useState(route.params.confirmation);
    const { phoneNumber } = route.params;

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [resendLoading, setResendLoading] = useState(false);

    const { signIn } = useContext(AuthContext);

    // Timer for resend button
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert('Invalid OTP', 'Please enter the fully 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify OTP with Firebase
            const result = await confirmation.confirm(otp);
            const idToken = await result.user.getIdToken();

            // 2. Verify ID Token with our Spring Boot Backend
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

            let errorMessage = 'Invalid OTP or Verification Failed.';
            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'The verification code you entered is incorrect.';
            } else if (error.code === 'auth/code-expired') {
                errorMessage = 'The SMS code has expired. Please request a new one.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Alert.alert('Error', errorMessage);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return; // Prevent spamming

        setResendLoading(true);
        setOtp('');
        try {
            // Re-trigger the SMS request
            const newConfirmation = await AuthService.signInWithPhoneNumber(phoneNumber);
            setConfirmation(newConfirmation);
            setResendTimer(60); // Reset timer
            Alert.alert('Success', 'A new verification code has been sent.');
        } catch (error) {
            console.error('Error resending OTP:', error);
            let errorMessage = 'Failed to resend OTP.';
            if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setResendLoading(false);
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

                {resendLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 30 }} />
                ) : (
                    <TouchableOpacity
                        onPress={handleResend}
                        disabled={resendTimer > 0}
                    >
                        <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                            Didn't receive code? {resendTimer > 0 ? `Wait ${resendTimer}s` : 'Resend Code'}
                        </Text>
                    </TouchableOpacity>
                )}

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
        lineHeight: 20,
    },
    inputContainer: {
        borderBottomWidth: 2,
        borderBottomColor: '#00A884',
        marginBottom: 30,
        width: 150,
        alignItems: 'center',
    },
    input: {
        fontSize: 24,
        letterSpacing: 8,
        textAlign: 'center',
        color: '#333',
        width: '100%',
        padding: 5,
    },
    resendText: {
        color: '#007AFF',
        marginBottom: 30,
        fontSize: 14,
        fontWeight: '500',
    },
    resendTextDisabled: {
        color: '#999',
    },
    button: {
        backgroundColor: '#00A884',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default OTPScreen;
