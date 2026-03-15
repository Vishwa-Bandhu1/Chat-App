import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = React.useState(true);

    const SettingItem = ({ icon, label, type = 'chevron', value, onValueChange, color = '#FFFFFF' }) => (
        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Icon name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.settingLabel, { color }]}>{label}</Text>
            {type === 'chevron' && <Icon name="chevron-forward" size={18} color="#2A2D4A" />}
            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#1C1F3A', true: '#6C63FF' }}
                    thumbColor="#FFFFFF"
                />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0E21" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    <View style={styles.card}>
                        <SettingItem 
                            icon="notifications-outline" 
                            label="Notifications" 
                            type="switch" 
                            value={notificationsEnabled} 
                            onValueChange={setNotificationsEnabled}
                        />
                        <SettingItem 
                            icon="moon-outline" 
                            label="Dark Mode" 
                            type="switch" 
                            value={darkModeEnabled} 
                            onValueChange={setDarkModeEnabled}
                        />
                        <SettingItem icon="language-outline" label="Language" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Security</Text>
                    <View style={styles.card}>
                        <SettingItem icon="lock-closed-outline" label="Account Privacy" />
                        <SettingItem icon="shield-outline" label="Security" />
                        <SettingItem icon="eye-off-outline" label="Blocked Users" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.card}>
                        <SettingItem icon="star-outline" label="Rate the App" />
                        <SettingItem icon="document-text-outline" label="Terms of Service" />
                        <SettingItem icon="list-outline" label="Privacy Policy" />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>ChatApp v1.2.0</Text>
                    <Text style={styles.footerSubtext}>Made with ❤️ for meaningful connections</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E21',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#0A0E21',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1F3A',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5A5A6E',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#1C1F3A',
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#5A5A6E',
        fontWeight: '700',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#5A5A6E',
        textAlign: 'center',
    },
});

export default SettingsScreen;
