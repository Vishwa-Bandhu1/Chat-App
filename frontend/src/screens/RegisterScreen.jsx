import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AuthService from '../services/AuthService';

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }
        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await AuthService.signup({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                password,
            });
            setLoading(false);
            Alert.alert(
                'Account Created! 🎉',
                'Your account has been registered successfully. Please sign in.',
                [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            setLoading(false);
            const message = typeof error === 'string'
                ? error
                : error?.message || 'Registration failed. Please try again.';
            Alert.alert('Registration Failed', message);
        }
    };

    const clearError = (field) => {
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0E21" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoContainer}>
                            <Icon name="person-add" size={40} color="#6C63FF" />
                        </View>
                        <Text style={styles.appName}>Create Account</Text>
                        <Text style={styles.tagline}>Join the conversation today</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                                <Icon name="person-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#5A5A6E"
                                    value={fullName}
                                    onChangeText={(t) => { setFullName(t); clearError('fullName'); }}
                                    autoCapitalize="words"
                                />
                            </View>
                            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                        </View>

                        {/* Username */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                                <Icon name="at-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor="#5A5A6E"
                                    value={username}
                                    onChangeText={(t) => { setUsername(t); clearError('username'); }}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <Icon name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#5A5A6E"
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); clearError('email'); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                <Icon name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#5A5A6E"
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); clearError('password'); }}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8E8E93" />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                                <Icon name="shield-checkmark-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#5A5A6E"
                                    value={confirmPassword}
                                    onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                                    <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8E8E93" />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footerSection}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                                <Text style={styles.footerLink}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E21',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 30,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: 'rgba(108, 99, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.25)',
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    tagline: {
        fontSize: 14,
        color: '#8E8E93',
        letterSpacing: 0.3,
    },
    formSection: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1F3A',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#2A2D4A',
        paddingHorizontal: 16,
        height: 54,
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 16,
    },
    button: {
        height: 54,
        borderRadius: 14,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footerSection: {
        alignItems: 'center',
        marginTop: 6,
    },
    footerText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    footerLink: {
        color: '#6C63FF',
        fontWeight: '700',
    },
});

export default RegisterScreen;
