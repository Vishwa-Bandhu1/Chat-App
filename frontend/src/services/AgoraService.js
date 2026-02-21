
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { PermissionsAndroid, Platform } from 'react-native';

const APP_ID = '754175fae02d41a08712f0d4a0b7d042';

class AgoraService {
    constructor() {
        this.engine = null;
        this.appId = APP_ID;
        this.channelName = '';
        this.uid = 0; // 0 let Agora assign uid
        this.callbacks = {};
    }

    async init() {
        if (this.engine) return;

        try {
            this.engine = createAgoraRtcEngine();
            this.engine.initialize({ appId: this.appId });

            // Set callbacks
            this.engine.registerEventHandler({
                onJoinChannelSuccess: (connection, elapsed) => {
                    console.log('Successfully joined channel:', connection.channelId);
                    if (this.callbacks.onJoinChannelSuccess) this.callbacks.onJoinChannelSuccess(connection);
                },
                onUserJoined: (connection, remoteUid, elapsed) => {
                    console.log('Remote user joined:', remoteUid);
                    if (this.callbacks.onUserJoined) this.callbacks.onUserJoined(remoteUid);
                },
                onUserOffline: (connection, remoteUid, reason) => {
                    console.log('Remote user offline:', remoteUid);
                    if (this.callbacks.onUserOffline) this.callbacks.onUserOffline(remoteUid);
                },
                onLeaveChannel: (connection, stats) => {
                    console.log('Left channel');
                    if (this.callbacks.onLeaveChannel) this.callbacks.onLeaveChannel(stats);
                },
                onError: (err, msg) => {
                    console.error('Agora Error:', err, msg);
                }
            });

            this.engine.enableVideo();
            this.engine.startPreview(); // Optional: start preview before joining

            console.log('Agora Initialized');
        } catch (e) {
            console.error('Failed to initialize Agora:', e);
            throw e;
        }
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    async joinChannel(channelName, token = null, uid = 0) {
        if (!this.engine) await this.init();

        try {
            this.channelName = channelName;
            this.engine.joinChannel(token, channelName, uid, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: true,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
            console.log('Joining channel:', channelName);
        } catch (e) {
            console.error('Error joining channel:', e);
            throw e;
        }
    }

    leaveChannel() {
        if (this.engine) {
            this.engine.leaveChannel();
            this.callbacks = {};
        }
    }

    switchCamera() {
        if (this.engine) {
            this.engine.switchCamera();
        }
    }

    toggleAudio(muted) {
        if (this.engine) {
            this.engine.muteLocalAudioStream(muted);
        }
    }

    toggleVideo(disabled) {
        if (this.engine) {
            this.engine.muteLocalVideoStream(disabled);
        }
    }

    destroy() {
        if (this.engine) {
            this.engine.release();
            this.engine = null;
        }
    }
}

export default new AgoraService();
