import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
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
    themeOverride?: ThemeConfig;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
                                                                initialMode = 'dark',
                                                                children,
                                                                themeOverride
                                                            }) => {
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    console.log('initialMode:', initialMode)
    console.log('mode:', mode)

    const toggleTheme = useCallback(() => {
        setMode(current => current === 'light' ? 'dark' : 'light');
    }, []);

    let theme = useMemo(() => themes[mode], [mode]);
    if (themeOverride) theme = themeOverride;

    useEffect(() => {
        const root = document.documentElement;
        const colors = theme.colors;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        mode,
        toggleTheme,
        setThemeMode: setMode
    }), [theme, mode, toggleTheme]);

    console.log('value:', value)

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