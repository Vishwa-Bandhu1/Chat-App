
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPScreen from '../screens/OTPScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ContactListScreen from '../screens/ContactListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Chats') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'Contacts') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Chats" component={ChatListScreen} />
            <Tab.Screen name="Contacts" component={ContactListScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

function MessagesStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    )
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
        </Stack.Navigator>
    );
}

export const AuthContext = React.createContext();

export default function AppNavigator() {
    const [user, setUser] = React.useState(null);

    const authContext = React.useMemo(() => ({
        signIn: (userData) => {
            setUser(userData);
        },
        signOut: () => {
            setUser(null);
        },
        user,
    }), [user]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer>
                {isAuthenticated ? (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
                    </Stack.Navigator>
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="OTP" component={OTPScreen} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
        </AuthContext.Provider>
    );
}
