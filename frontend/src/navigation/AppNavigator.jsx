
import React, { useRef, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// TEMPORARILY DISABLED — OTP Auth Screens
// import PhoneNumberScreen from '../screens/PhoneNumberScreen';
// import OTPScreen from '../screens/OTPScreen';
// import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ChatListScreen from '../screens/ChatListScreen';
// import ContactListScreen from '../screens/ContactListScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
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
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6C63FF',
                tabBarInactiveTintColor: '#5A5A6E',
                tabBarStyle: {
                    backgroundColor: '#0A0E21',
                    borderTopColor: '#1C1F3A',
                    height: 60,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: '#0A0E21',
                    borderBottomColor: '#1C1F3A',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTitleStyle: {
                    color: '#FFFFFF',
                    fontWeight: '800',
                },
                headerShown: false, // Screens handle their own headers for better design
            })}
        >
            <Tab.Screen name="Chats" component={ChatListScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export const AuthContext = React.createContext();

export default function AppNavigator() {
    const [user, setUser] = useState(null);
    const callHandledRef = useRef(false);
    const appState = useRef(AppState.currentState);

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

        // Listen for AppState changes to emit Online/Offline presence
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                ChatService.client?.activate();
                fetch(`http://192.168.1.5:8080/api/users/${userId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ online: true, status: 'ONLINE' })
                }).catch(e => console.log('Error setting online status', e));
            } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                ChatService.client?.deactivate();
                fetch(`http://192.168.1.5:8080/api/users/${userId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ online: false, status: 'OFFLINE' })
                }).catch(e => console.log('Error setting offline status', e));
            }
            appState.current = nextAppState;
        });

        // Initialize connection
        fetch(`http://192.168.1.5:8080/api/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ online: true, status: 'ONLINE' })
        }).catch(e => console.log('Error init online status', e));

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

        return () => {
            subscription.remove();
        };
    }, [user]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer ref={navigationRef}>
                {isAuthenticated ? (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen name="UserSearch" component={UserSearchScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
                        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                        <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    </Stack.Navigator>
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
        </AuthContext.Provider>
    );
}
