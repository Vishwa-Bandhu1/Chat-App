
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../services/AuthService';

const PhoneNumberScreen = ({ navigation }) => {
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number.');
            return;
        }

        const fullPhoneNumber = countryCode + phoneNumber;
        setLoading(true);

        try {
            // Firebase Phone Auth
            const confirmation = await AuthService.signInWithPhoneNumber(fullPhoneNumber);
            setLoading(false);
            // Pass the confirmation object to OTP screen
            navigation.navigate('OTP', { phoneNumber: fullPhoneNumber, confirmation });
        } catch (error) {
            console.error("PhoneNumberScreen Error:", error);
            setLoading(false);
            Alert.alert('Error', error.message || 'Failed to send OTP.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Enter your phone number</Text>
                    <Text style={styles.subtitle}>
                        WhatsApp will need to verify your account.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <View style={styles.countryCodeContainer}>
                            <TextInput
                                style={styles.countryCode}
                                value={countryCode}
                                onChangeText={setCountryCode}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            autoFocus
                        />
                    </View>
                    <Text style={styles.carrierText}>Carrier charges may apply</Text>
                </View>

                <View style={styles.footer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#00A884" />
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleNext}
                        >
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
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
        paddingHorizontal: 20,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#00A884',
        paddingBottom: 5,
        width: '80%',
    },
    countryCodeContainer: {
        width: 60,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
        marginRight: 10,
        justifyContent: 'center',
    },
    countryCode: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: '#333',
        padding: 0, // Reset default padding
    },
    carrierText: {
        marginTop: 20,
        color: '#666',
        fontSize: 12,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00A884',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default PhoneNumberScreen;
