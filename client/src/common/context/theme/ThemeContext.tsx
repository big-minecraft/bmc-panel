import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ThemeConfig, ThemeMode } from './types';
import { themes } from './colors';

type ThemeContextType = {
    theme: ThemeConfig;
    mode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProviderProps = {
    initialMode?: ThemeMode;
    children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
                                                                initialMode = 'light',
                                                                children
                                                            }) => {
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    const toggleTheme = useCallback(() => {
        setMode(current => current === 'light' ? 'dark' : 'light');
    }, []);

    const theme = useMemo(() => themes[mode], [mode]);

    const value = useMemo(() => ({
        theme,
        mode,
        toggleTheme,
        setThemeMode: setMode
    }), [theme, mode, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};