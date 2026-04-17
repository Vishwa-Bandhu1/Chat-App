import { Platform, Vibration } from 'react-native';

export const triggerLongPressHaptic = (duration = 40) => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
        return false;
    }

    try {
        Vibration.vibrate(duration);
        return true;
    } catch (error) {
        console.log('Haptic feedback unavailable:', error?.message || error);
        return false;
    }
};
