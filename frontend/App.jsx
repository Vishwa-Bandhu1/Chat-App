import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

import { ThemeProvider } from './src/context/ThemeContext';
import GlobalUIOverlay from './src/components/GlobalUIOverlay';

function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AppNavigator />
                <GlobalUIOverlay />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default App;