import React, {createContext, useContext, useMemo, useState, useCallback, useEffect} from 'react';
import {ThemeColors, ThemeConfig, ThemeMode} from './types';
import {themes} from './colors';

type ThemeContextType = {
    colors: ThemeColors;
    theme: Omit<ThemeConfig,'color'>;
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

    const toggleTheme = useCallback(() => {
        setMode(current => current === 'light' ? 'dark' : 'light');
    }, []);

    let theme = useMemo(() => themes[mode], [mode]);
    if (themeOverride) theme = themeOverride;

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(mode);
    }, [mode]);

    const value = useMemo(() => ({
        colors: theme.colors,
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