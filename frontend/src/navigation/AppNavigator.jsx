
import React, { useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import PhoneNumberScreen from '../screens/PhoneNumberScreen';
import OTPScreen from '../screens/OTPScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ContactListScreen from '../screens/ContactListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import CallScreen from '../screens/CallScreen';
import ChatService from '../services/ChatService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

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

export const AuthContext = React.createContext();

export default function AppNavigator() {
    const [user, setUser] = React.useState(null);
    const callHandledRef = useRef(false);

    const authContext = React.useMemo(() => ({
        signIn: (userData) => {
            setUser(userData);
        },
        signOut: () => {
            setUser(null);
        },
        user,
    }), [user]);

    // Set up global STOMP call signal listener when user authenticates
    useEffect(() => {
        if (!user) return;

        const userId = user.id || user.userId;

        // Connect STOMP with call signal handler
        const handleCallSignal = (signal) => {
            if (signal.type === 'OFFER' && !callHandledRef.current) {
                callHandledRef.current = true;
                const callerName = signal.senderName || signal.senderId || 'Someone';
                const isVideo = signal.isVideo || false;

                Alert.alert(
                    isVideo ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
                    `${callerName} is calling you`,
                    [
                        {
                            text: 'Decline',
                            style: 'destructive',
                            onPress: () => {
                                callHandledRef.current = false;
                                // Send hangup back
                                if (ChatService.client && ChatService.connected) {
                                    ChatService.client.publish({
                                        destination: '/app/call',
                                        body: JSON.stringify({
                                            type: 'HANGUP',
                                            senderId: userId,
                                            recipientId: signal.senderId,
                                        }),
                                    });
                                }
                            },
                        },
                        {
                            text: 'Accept',
                            onPress: () => {
                                callHandledRef.current = false;
                                if (navigationRef.isReady()) {
                                    navigationRef.navigate('Call', {
                                        recipientId: signal.senderId,
                                        recipientName: callerName,
                                        isVideo,
                                        isIncoming: true,
                                        channelName: signal.channelName,
                                    });
                                }
                            },
                        },
                    ],
                    { cancelable: false }
                );
            }
        };

        // The connect method won't create a duplicate if already connected
        ChatService.connect(
            () => { }, // Messages handled by individual screens
            userId,
            handleCallSignal
        );

    }, [user]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer ref={navigationRef}>
                {isAuthenticated ? (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
                        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                        <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    </Stack.Navigator>
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
                        <Stack.Screen name="OTP" component={OTPScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
        </AuthContext.Provider>
    );
}
