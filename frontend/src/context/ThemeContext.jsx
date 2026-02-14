import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
    dark: false,
    colors: {
        background: '#ffffff',
        text: '#000000',
        primary: '#007AFF',
        secondary: '#f5f5f5',
        border: '#eeeeee',
        card: '#ffffff',
        textSecondary: '#666666',
    },
};

export const darkTheme = {
    dark: true,
    colors: {
        background: '#121212',
        text: '#ffffff',
        primary: '#0A84FF',
        secondary: '#1E1E1E',
        border: '#333333',
        card: '#1E1E1E',
        textSecondary: '#aaaaaa',
    },
};

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    const theme = isDark ? darkTheme : lightTheme;

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
