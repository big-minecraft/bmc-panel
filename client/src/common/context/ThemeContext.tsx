import React, { createContext, useContext, useMemo } from 'react';

const ThemeContext = createContext(null);

export const baseColors = {
    indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
    },
    // ... other colors from colors.js
};

const defaultTheme = {
    colors: baseColors,
    spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
    },
    animation: {
        bouncy: {
            type: "spring",
            stiffness: 500,
            damping: 30
        },
        smooth: {
            type: "spring",
            stiffness: 100,
            damping: 20
        }
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }
};

export const ThemeProvider = ({ theme = defaultTheme, children }) => {
    const memoizedTheme = useMemo(() => ({
        ...defaultTheme,
        ...theme,
    }), [theme]);

    return (
        <ThemeContext.Provider value={memoizedTheme}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};