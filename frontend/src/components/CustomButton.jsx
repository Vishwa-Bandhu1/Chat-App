import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function CustomButton({ title, onPress, isLoading, type = 'PRIMARY' }) {
    return (
        <TouchableOpacity
            style={[styles.container, type === 'SECONDARY' ? styles.secondary : styles.primary]}
            onPress={onPress}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={[styles.text, type === 'SECONDARY' ? styles.textSecondary : styles.textPrimary]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    primary: {
        backgroundColor: '#007AFF',
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    textPrimary: {
        color: '#fff',
    },
    textSecondary: {
        color: '#007AFF',
    },
});
