import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { ThemeColors, ThemeConfig, ThemeMode } from './types';
import { themes } from './colors';

type ThemeContextType = {
    colors: ThemeColors;
    theme: Omit<ThemeConfig, 'color'>;
    mode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProviderProps = {
    initialMode?: ThemeMode;
    children: React.ReactNode;
    modeOverride?: ThemeMode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    initialMode = 'dark',
    children,
    modeOverride
}) => {
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    useEffect(() => {
        if (modeOverride) setMode(modeOverride);
    }, [modeOverride]);

    const toggleTheme = useCallback(() => {
        setMode(current => current === 'light' ? 'dark' : 'light');
    }, []);

    const theme = useMemo(() => themes[mode], [mode]);

    useEffect(() => {
        const root = document.documentElement;
        requestAnimationFrame(() => {
            root.classList.remove('light', 'dark');
            root.classList.add(modeOverride);
        });
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