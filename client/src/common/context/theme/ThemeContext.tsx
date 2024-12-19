import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Theme } from './types';
import { baseColors } from './colors';

const defaultTheme: Theme = {
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

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
    theme?: Partial<Theme>;
    children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
                                                                theme = defaultTheme,
                                                                children
                                                            }) => {
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

export const useTheme = (): Theme => {
    const context = useContext(ThemeContext);
    if (context === null) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};