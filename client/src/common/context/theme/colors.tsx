import {ThemeConfig, ThemeColors} from './types';

// export const lightThemeColors: ThemeColors = {
//     primary: baseColors.indigo[600],
//     primaryHover: baseColors.indigo[700],
//     primaryLight: baseColors.indigo[50],
//     secondary: baseColors.gray[500],
//     secondaryHover: baseColors.gray[600],
//     secondaryLight: baseColors.gray[50],
//     background: baseColors.white,
//     backgroundOffset: baseColors.gray[50],
//     text: baseColors.gray[900],
//     textSecondary: baseColors.gray[500],
//     textDisabled: baseColors.gray[300],
//     border: baseColors.gray[200],
//     borderHover: baseColors.gray[300],
//     success: baseColors.success.DEFAULT,
//     warning: baseColors.warning.DEFAULT,
//     error: baseColors.error.DEFAULT,
//     info: baseColors.info.DEFAULT,
// };

// export const darkThemeColors: ThemeColors = {
//     primary: '#ff0000',
//     primaryHover: baseColors.indigo[300],
//     primaryLight: baseColors.indigo[900],
//     secondary: baseColors.gray[400],
//     secondaryHover: baseColors.gray[300],
//     secondaryLight: baseColors.gray[800],
//     background: baseColors.gray[900],
//     backgroundOffset: baseColors.gray[800],
//     text: baseColors.gray[100],
//     textSecondary: baseColors.gray[400],
//     textDisabled: baseColors.gray[600],
//     border: baseColors.gray[700],
//     borderHover: baseColors.gray[600],
//     success: baseColors.success.light,
//     warning: baseColors.warning.light,
//     error: baseColors.error.light,
//     info: baseColors.info.light,
// };

export const lightThemeColors: ThemeColors = {
    primary: {
        first: 'var(--primary-first)',
        second: 'var(--primary-second)',
        third: 'var(--primary-third)'
    },
    accent: {
        text: 'var(--accent-text)',
        textHover: 'var(--accent-text-hover)',
        background: 'var(--accent-bg)',
        backgroundHover: 'var(--accent-bg-hover)',
    },
    negativeAccent: {
        text: 'var(--negative-accent-text)',
        textHover: 'var(--negative-accent-text-hover)',
        background: 'var(--negative-accent-bg)',
        backgroundHover: 'var(--negative-accent-bg-hover)',
    },
    background: 'var(--background)',
    backgroundOffset: 'var(--background-offset)',
    undetermined: 'var(--undetermined)',
    success: {
        text: 'var(--success-text)',
        textHover: 'var(--success-text-hover)',
        background: 'var(--success-bg)',
        backgroundHover: 'var(--success-bg-hover)',
    },
    warning: {
        text: 'var(--warning-text)',
        textHover: 'var(--warning-text-hover)',
        background: 'var(--warning-bg)',
        backgroundHover: 'var(--warning-bg-hover)',
    },
    danger: {
        text: 'var(--danger-text)',
        textHover: 'var(--danger-text-hover)',
        background: 'var(--danger-bg)',
        backgroundHover: 'var(--danger-bg-hover)',
    },
    info: {
        text: 'var(--info-text)',
        textHover: 'var(--info-text-hover)',
        background: 'var(--info-bg)',
        backgroundHover: 'var(--info-bg-hover)',
    }
};

export const darkThemeColors = lightThemeColors;

const baseThemeConfig: Omit<ThemeConfig, 'colors'> = {
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

export const themes: Record<'light' | 'dark', ThemeConfig> = {
    light: {
        ...baseThemeConfig,
        colors: lightThemeColors,
    },
    dark: {
        ...baseThemeConfig,
        colors: darkThemeColors,
    }
};