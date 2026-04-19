import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Platform } from 'react-native';
import { GlobalUI } from '../utils/GlobalUI';
import Icon from 'react-native-vector-icons/Ionicons';

const GlobalUIOverlay = () => {
    const [loaderState, setLoaderState] = useState({ visible: false, text: '' });
    const [toastState, setToastState] = useState({ visible: false, message: '', type: 'error' });
    const toastOpacity = useRef(new Animated.Value(0)).current;
    const toastTranslateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        const removeLoader = GlobalUI.on('loader', (data) => {
            setLoaderState(data);
        });

        let timeoutId;
        const removeToast = GlobalUI.on('toast', (data) => {
            if (data.visible) {
                setToastState(data);
                
                // Animate in
                Animated.parallel([
                    Animated.timing(toastOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(toastTranslateY, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                ]).start();

                // Auto-hide after 4 seconds
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    hideToast();
                }, 4000);
            } else {
                hideToast();
            }
        });

        const hideToast = () => {
            Animated.parallel([
                Animated.timing(toastOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(toastTranslateY, {
                    toValue: 50,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setToastState(prev => ({ ...prev, visible: false }));
            });
        };

        return () => {
            removeLoader();
            removeToast();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [toastOpacity, toastTranslateY]);

    return (
        <>
            {/* Full-screen Loader Overlay */}
            {loaderState.visible && (
                <View style={styles.loaderContainer}>
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color="#6C63FF" />
                        {!!loaderState.text && (
                            <Text style={styles.loaderText}>{loaderState.text}</Text>
                        )}
                    </View>
                </View>
            )}

            {/* Toast Snackbar */}
            {toastState.visible && (
                <Animated.View 
                    style={[
                        styles.toastContainer, 
                        { 
                            opacity: toastOpacity,
                            transform: [{ translateY: toastTranslateY }]
                        }
                    ]}
                    pointerEvents="none"
                >
                    <View style={[styles.toastBox, toastState.type === 'error' ? styles.toastError : styles.toastSuccess]}>
                        <Icon 
                            name={toastState.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                            size={24} 
                            color="#FFF" 
                        />
                        <Text style={styles.toastText}>{toastState.message}</Text>
                    </View>
                </Animated.View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999, // Ensure it sits on top of everything
        elevation: 9999,
    },
    loaderBox: {
        backgroundColor: '#1C1F3A',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 200,
        borderWidth: 1,
        borderColor: '#2A2D4A',
    },
    loaderText: {
        color: '#FFF',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    toastContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        right: 20,
        zIndex: 10000,
        elevation: 10000,
        alignItems: 'center',
    },
    toastBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        maxWidth: 400,
        width: '100%',
    },
    toastError: {
        backgroundColor: '#FF4B4B',
    },
    toastSuccess: {
        backgroundColor: '#38CB89',
    },
    toastText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
});

export default GlobalUIOverlay;
