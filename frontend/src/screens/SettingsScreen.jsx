import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { AuthContext } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/CustomButton';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
    const { signOut } = React.useContext(AuthContext);
    const { theme, toggleTheme, isDark } = useTheme();
    const { colors } = theme;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        title: { fontSize: 24, fontWeight: 'bold', margin: 20, color: colors.text },
        option: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
        },
        optionText: { fontSize: 16, color: colors.text },
        logoutContainer: { marginTop: 50, padding: 20 }
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.option}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="moon-outline" size={24} color={colors.text} style={{ marginRight: 10 }} />
                    <Text style={styles.optionText}>Dark Mode</Text>
                </View>
                <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={isDark ? "#fff" : "#f4f3f4"}
                />
            </View>

            <View style={styles.logoutContainer}>
                <CustomButton title="Logout" onPress={signOut} type="SECONDARY" />
            </View>
        </View>
    );
};

export default SettingsScreen;
