import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const OTPScreen = ({ navigation }) => {
    const [code, setCode] = useState('');

    const onVerifyPressed = () => {
        if (!code) {
            Alert.alert('Error', 'Please enter code');
            return;
        }
        // Simulate verification
        Alert.alert('Success', 'Account verified!', [
            { text: 'OK', onPress: () => console.log('Verified') }
        ]);
        // In real app, we would switch auth state here.
    };

    const onResendPressed = () => {
        Alert.alert("Info", "Code resent");
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Verification</Text>
                <Text style={styles.subtitle}>Enter the code sent to your email</Text>

                <CustomInput
                    placeholder="Enter Code"
                    value={code}
                    onChangeText={setCode}
                    iconName="key-outline"
                    keyboardType="number-pad"
                />

                <CustomButton title="Verify" onPress={onVerifyPressed} />

                <CustomButton
                    title="Resend Code"
                    onPress={onResendPressed}
                    type="SECONDARY"
                />

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
});

export default OTPScreen;
