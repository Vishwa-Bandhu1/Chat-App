import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountryPicker from 'react-native-country-picker-modal';
import parsePhoneNumberFromString from 'libphonenumber-js';
import AuthService from '../services/AuthService';

const PhoneNumberScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState(null); // 'US', 'IN', etc.
    const [callingCode, setCallingCode] = useState(null); // '1', '91', etc.
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (!countryCode || !callingCode) {
            Alert.alert('Selection Required', 'Please select a country code first.');
            return;
        }

        if (!phoneNumber) {
            Alert.alert('Invalid Number', 'Please enter your phone number.');
            return;
        }

        // Construct formatting based on country selected to validate intrinsically
        const fullNumber = `+${callingCode}${phoneNumber}`;
        const parsedNumber = parsePhoneNumberFromString(fullNumber, countryCode);

        if (!parsedNumber || !parsedNumber.isValid()) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number for the selected country.');
            return;
        }

        setLoading(true);

        try {
            // Firebase Phone Auth requires the E.164 formatted number returned by libphonenumber-js
            const formattedValue = parsedNumber.number; // e.g., +919033107654

            const confirmation = await AuthService.signInWithPhoneNumber(formattedValue);
            setLoading(false);

            // Pass the confirmation object and the formatted phone number to OTP screen
            navigation.navigate('OTP', { phoneNumber: formattedValue, confirmation });
        } catch (error) {
            console.error("PhoneNumberScreen Error:", error);
            setLoading(false);

            // Handle specific Firebase errors
            let errorMessage = 'Failed to send OTP. Please try again.';
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'The phone number entered is invalid.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'We have blocked all requests from this device due to unusual activity. Try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/billing-not' || (error.message && error.message.includes('BILLING_NOT_ENABLED'))) {
                errorMessage = 'Firebase requires the Blaze (pay-as-you-go) billing plan to send real SMS messages. Please upgrade your project in the Firebase Console.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Authentication Error', errorMessage);
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
                        WhatsApp will need to verify your account to securely log you in.
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Hidden Country Picker Component managed by state */}
                    <CountryPicker
                        withFilter
                        withFlag
                        withCallingCode
                        withAlphaFilter
                        visible={countryPickerVisible}
                        onSelect={(country) => {
                            setCountryCode(country.cca2);
                            setCallingCode(country.callingCode[0]);
                        }}
                        onClose={() => setCountryPickerVisible(false)}
                        countryCode={countryCode || 'IN'} // Default initial modal scroll position
                        containerButtonStyle={{ display: 'none' }} // Hide default trigger
                    />

                    {!countryCode ? (
                        // 1. Forced Explicit Country Selection State 
                        <TouchableOpacity
                            style={styles.selectCountryButton}
                            onPress={() => setCountryPickerVisible(true)}
                        >
                            <Text style={styles.selectCountryText}>Tap to Select Country First</Text>
                        </TouchableOpacity>
                    ) : (
                        // 2. Phone Input State (only shown AFTER a country is selected)
                        <View style={styles.phoneContainer}>
                            <TouchableOpacity
                                style={styles.countryPickerTrigger}
                                onPress={() => setCountryPickerVisible(true)}
                            >
                                <CountryPicker
                                    countryCode={countryCode}
                                    withFlag
                                    withFilter={false}
                                    withCallingCode={false}
                                    onSelect={() => { }} // Managed by main picker above
                                    containerButtonStyle={{ paddingRight: 5 }}
                                />
                                <Text style={styles.callingCodeText}>+{callingCode}</Text>
                            </TouchableOpacity>

                            <TextInput
                                style={styles.textInput}
                                placeholder="Phone number"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                autoFocus
                            />
                        </View>
                    )}

                    <Text style={styles.carrierText}>Carrier SMS charges may apply</Text>
                </View>

                <View style={styles.footer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#00A884" />
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, (!countryCode || !phoneNumber) && styles.buttonDisabled]}
                            onPress={handleNext}
                            disabled={!countryCode || !phoneNumber}
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
        lineHeight: 20,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectCountryButton: {
        width: '100%',
        backgroundColor: '#f0f0f0',
        padding: 18,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectCountryText: {
        fontSize: 16,
        color: '#00A884',
        fontWeight: 'bold',
    },
    phoneContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 60,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    countryPickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: '#ddd',
        backgroundColor: '#f9f9f9',
    },
    callingCodeText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        color: '#333',
        paddingHorizontal: 15,
        height: '100%',
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
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PhoneNumberScreen;
