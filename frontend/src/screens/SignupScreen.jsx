import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AuthService from '../services/AuthService';

const SignupScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onRegisterPressed = async () => {
        if (!fullName || !username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await AuthService.signup({ fullName, username, email, password });
            Alert.alert('Success', 'Account created successfully', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            console.error('Signup failed:', error);
            let errorMessage = 'Something went wrong';
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error && typeof error === 'object') {
                errorMessage = JSON.stringify(error);
            }
            Alert.alert('Signup Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onLoginPress = () => {
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>

                <CustomInput
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    iconName="person-outline"
                />
                <CustomInput
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    iconName="person-outline"
                />
                <CustomInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    iconName="mail-outline"
                />
                <CustomInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    iconName="lock-closed-outline"
                />

                <CustomButton
                    title="Register"
                    onPress={onRegisterPressed}
                    isLoading={loading}
                />

                <CustomButton
                    title="Have an account? Login"
                    onPress={onLoginPress}
                    type="SECONDARY"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' }
});

export default SignupScreen;
