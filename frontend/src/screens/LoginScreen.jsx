import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import AuthService from '../services/AuthService';

import { AuthContext } from '../navigation/AppNavigator';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = React.useContext(AuthContext);

    const onLoginPressed = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await AuthService.login(username, password);
            console.log('Login success FULL RESPONSE:', JSON.stringify(response, null, 2));
            // TODO: Store token securely
            signIn(response);
        } catch (error) {
            console.error('Login failed:', error);
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const onForgotPassword = () => {
        console.warn('Forgot Password');
    };

    const onSignupPress = () => {
        navigation.navigate('Signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Login</Text>

                <CustomInput
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    iconName="person-outline"
                />

                <CustomInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    iconName="lock-closed-outline"
                />

                <CustomButton
                    title="Login"
                    onPress={onLoginPressed}
                    isLoading={loading}
                />

                <CustomButton
                    title="Forgot Password?"
                    onPress={onForgotPassword}
                    type="SECONDARY"
                />

                <CustomButton
                    title="Don't have an account? Sign Up"
                    onPress={onSignupPress}
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

export default LoginScreen;
