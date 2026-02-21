
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, PermissionsAndroid, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RtcSurfaceView, VideoViewSetupMode } from 'react-native-agora';
import AgoraService from '../services/AgoraService';
import ChatService from '../services/ChatService';
import { AuthContext } from '../navigation/AppNavigator';

const CallScreen = ({ route, navigation }) => {
    const { recipientId, recipientName, isVideo, isIncoming, channelName: incomingChannelName } = route.params;
    const { user } = useContext(AuthContext);
    const currentUserId = user?.id || user?.userId;

    const [remoteUid, setRemoteUid] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(!isVideo);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [callStatus, setCallStatus] = useState(isIncoming ? 'Incoming call...' : 'Calling...');
    const [callDuration, setCallDuration] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [localUid, setLocalUid] = useState(0); // 0 means local user for Agora

    const timerRef = useRef(null);
    const callSubscriptionRef = useRef(null);

    // Dynamic channel name generation based on sorted user IDs
    const getChannelName = () => {
        if (incomingChannelName) return incomingChannelName;
        // Ensure consistent channel name by sorting IDs
        const ids = [currentUserId, recipientId].sort();
        return `call_${ids[0]}_${ids[1]}`;
    };

    const channelNameRef = useRef(getChannelName());

    useEffect(() => {
        startCall();
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (isConnected) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isConnected]);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            const perms = [
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ];
            if (Platform.Version >= 31) {
                perms.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
            }

            try {
                const grants = await PermissionsAndroid.requestMultiple(perms);
                const allGranted = Object.values(grants).every(
                    v => v === PermissionsAndroid.RESULTS.GRANTED
                );
                if (!allGranted) {
                    Alert.alert('Permissions Required', 'Camera and microphone permissions are needed for calls.');
                    navigation.goBack();
                    return false;
                }
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const subscribeToCallSignals = () => {
        if (ChatService.client && ChatService.connected) {
            callSubscriptionRef.current = ChatService.client.subscribe(
                `/user/${currentUserId}/queue/calls`,
                (message) => {
                    const data = JSON.parse(message.body);
                    handleSignalingMessage(data);
                }
            );
        }
    };

    const handleSignalingMessage = async (data) => {
        try {
            switch (data.type) {
                case 'HANGUP':
                    setCallStatus('Call ended');
                    setTimeout(() => navigation.goBack(), 500);
                    break;
                // Add other signals if needed
            }
        } catch (error) {
            console.warn('Signaling error:', error);
        }
    };

    const sendSignal = (type, payload) => {
        if (ChatService.client && ChatService.connected) {
            ChatService.client.publish({
                destination: '/app/call',
                body: JSON.stringify({
                    type,
                    senderId: currentUserId,
                    recipientId,
                    channelName: channelNameRef.current,
                    ...payload,
                }),
            });
        }
    };

    const startCall = async () => {
        const hasPerms = await requestPermissions();
        if (!hasPerms) return;

        try {
            // Initialize Agora
            await AgoraService.init();

            // Set up Agora event listeners
            AgoraService.setCallbacks({
                onJoinChannelSuccess: (connection) => {
                    console.log('Joined channel successfully');
                    setLocalUid(connection.localUid);
                    if (isIncoming) {
                        setCallStatus('Connected');
                        setIsConnected(true);
                    }
                },
                onUserJoined: (uid) => {
                    console.log('Remote user joined:', uid);
                    setRemoteUid(uid);
                    setCallStatus('Connected');
                    setIsConnected(true);
                },
                onUserOffline: (uid) => {
                    console.log('Remote user offline:', uid);
                    setRemoteUid(0);
                    setCallStatus('User offline');
                    Alert.alert('Call Ended', 'The other user left the call.');
                    navigation.goBack();
                },
                onLeaveChannel: () => {
                    console.log('Left channel');
                }
            });

            // Fetch Token from Backend
            // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
            const API_URL = 'http://10.0.2.2:8080/api/agora';
            console.log('Fetching token for channel:', channelNameRef.current);

            const response = await axios.get(`${API_URL}/token`, {
                params: {
                    channelName: channelNameRef.current,
                    uid: 0 // Let Agora assign UID or use 0
                }
            });

            const token = response.data.token;
            console.log('Token fetched successfully');

            // Set up event listeners (implicit in init, but added robust handling)

            // Subscribe to STOMP signals (for Hangup)
            subscribeToCallSignals();

            // Join the channel with the fetched token
            await AgoraService.joinChannel(channelNameRef.current, token, 0);

            // Send signal to other user
            if (!isIncoming) {
                sendSignal('OFFER', {
                    isVideo,
                    senderName: user?.fullName || user?.username || 'Unknown',
                    channelName: channelNameRef.current
                });
                setCallStatus('Ringing...');
            }

            // Mute video initially if voice call
            if (!isVideo) {
                AgoraService.toggleVideo(true);
            }

        } catch (error) {
            console.error('Call initialization error:', error);
            if (error.response) {
                console.error('Server Error Data:', error.response.data);
                console.error('Server Error Status:', error.response.status);
            }
            Alert.alert('Call Failed', 'Could not initialize the call.');
            navigation.goBack();
        }
    };

    const hangup = () => {
        sendSignal('HANGUP', {});
        cleanup();
        navigation.goBack();
    };

    const cleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (callSubscriptionRef.current) {
            callSubscriptionRef.current.unsubscribe();
        }
        AgoraService.leaveChannel();
        // Don't destroy engine here as it is a singleton, or maybe destroy on app exit? 
        // For now keep it alive or add destroy method if needed.
        // AgoraService.destroy(); 
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        AgoraService.toggleAudio(newMuted);
        setIsMuted(newMuted);
    };

    const toggleCamera = () => {
        const newCameraOff = !isCameraOff;
        AgoraService.toggleVideo(newCameraOff);
        setIsCameraOff(newCameraOff);
    };

    const switchCamera = () => {
        AgoraService.switchCamera();
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

            {/* Remote Video (Full Screen) */}
            {remoteUid !== 0 ? (
                <RtcSurfaceView
                    canvas={{ uid: remoteUid }}
                    style={styles.remoteVideo}
                />
            ) : (
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Icon name="person" size={80} color="#fff" />
                    </View>
                    <Text style={styles.callerName}>{recipientName}</Text>
                    <Text style={styles.callStatusText}>
                        {isConnected ? formatDuration(callDuration) : callStatus}
                    </Text>
                </View>
            )}

            {/* Local video preview (Small) */}
            {!isCameraOff && (
                <View style={styles.localVideoContainer}>
                    <RtcSurfaceView
                        canvas={{ uid: 0 }}
                        style={styles.localVideo}
                        zOrderMediaOverlay={true}
                    />
                </View>
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                        onPress={toggleMute}
                    >
                        <Icon name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
                        <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
                        onPress={toggleCamera}
                    >
                        <Icon name={isCameraOff ? 'videocam-off' : 'videocam'} size={28} color="#fff" />
                        <Text style={styles.controlLabel}>{isCameraOff ? 'Camera On' : 'Camera Off'}</Text>
                    </TouchableOpacity>

                    {/* Switch Camera only if camera is on */}
                    {!isCameraOff && (
                        <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
                            <Icon name="camera-reverse" size={28} color="#fff" />
                            <Text style={styles.controlLabel}>Flip</Text>
                        </TouchableOpacity>
                    )}

                    {/* Speaker toggle - Note: Agora handles audio routing automatically typically, but we can add logic later */}
                    {/* <TouchableOpacity
                        style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
                        onPress={() => setIsSpeaker(!isSpeaker)}
                    >
                        <Icon name={isSpeaker ? 'volume-high' : 'volume-medium'} size={28} color="#fff" />
                        <Text style={styles.controlLabel}>Speaker</Text>
                    </TouchableOpacity> */}
                </View>

                <TouchableOpacity style={styles.hangupBtn} onPress={hangup}>
                    <Icon name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    remoteVideo: {
        flex: 1,
        backgroundColor: '#000',
    },
    avatarContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    callerName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    callStatusText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 120,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        zIndex: 10,
    },
    localVideo: {
        flex: 1,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 20,
    },
    controlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 65,
        height: 65,
        borderRadius: 33,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    controlBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    controlLabel: {
        color: '#fff',
        fontSize: 10,
        marginTop: 4,
    },
    hangupBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default CallScreen;
