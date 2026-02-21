
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: 'https://img.freepik.com/free-vector/chat-app-logo-design-template_23-2150030560.jpg' }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>Welcome to Chat App</Text>

                <View style={styles.policyContainer}>
                    <Text style={styles.policyText}>
                        Read our <Text style={styles.link}>Privacy Policy</Text>. Tap "Agree and continue" to accept the <Text style={styles.link}>Terms of Service</Text>.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('PhoneNumber')}
                >
                    <Text style={styles.buttonText}>AGREE AND CONTINUE</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>from</Text>
                <Text style={styles.brandText}>Vishwa Bandhu</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center', // Center vertically approx
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        width: 250,
        height: 250,
        borderRadius: 125,
        marginBottom: 40,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    policyContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    policyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    link: {
        color: '#007AFF',
    },
    button: {
        backgroundColor: '#00A884', // WhatsApp Green
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#888',
    },
    brandText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00A884',
        letterSpacing: 1,
        marginTop: 2,
    }
});

export default WelcomeScreen;
