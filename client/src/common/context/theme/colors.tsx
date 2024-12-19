import { BaseColors, ThemeConfig, ThemeColors } from './types';

export const baseColors: BaseColors = {
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
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
    white: '#ffffff',
    black: '#000000',
    success: {
        light: '#ecfdf5',
        DEFAULT: '#059669',
        dark: '#065f46',
    },
    warning: {
        light: '#fffbeb',
        DEFAULT: '#d97706',
        dark: '#92400e',
    },
    error: {
        light: '#fef2f2',
        DEFAULT: '#dc2626',
        dark: '#991b1b',
    },
    info: {
        light: '#eff6ff',
        DEFAULT: '#2563eb',
        dark: '#1e40af',
    }
};

export const lightThemeColors: ThemeColors = {
    primary: baseColors.indigo[600],
    primaryHover: baseColors.indigo[700],
    primaryLight: baseColors.indigo[50],
    secondary: baseColors.gray[500],
    secondaryHover: baseColors.gray[600],
    secondaryLight: baseColors.gray[50],
    background: baseColors.white,
    backgroundOffset: baseColors.gray[50],
    text: baseColors.gray[900],
    textSecondary: baseColors.gray[500],
    textDisabled: baseColors.gray[300],
    border: baseColors.gray[200],
    borderHover: baseColors.gray[300],
    success: baseColors.success.DEFAULT,
    warning: baseColors.warning.DEFAULT,
    error: baseColors.error.DEFAULT,
    info: baseColors.info.DEFAULT,
};

export const darkThemeColors: ThemeColors = {
    primary: baseColors.indigo[400],
    primaryHover: baseColors.indigo[300],
    primaryLight: baseColors.indigo[900],
    secondary: baseColors.gray[400],
    secondaryHover: baseColors.gray[300],
    secondaryLight: baseColors.gray[800],
    background: baseColors.gray[900],
    backgroundOffset: baseColors.gray[800],
    text: baseColors.gray[100],
    textSecondary: baseColors.gray[400],
    textDisabled: baseColors.gray[600],
    border: baseColors.gray[700],
    borderHover: baseColors.gray[600],
    success: baseColors.success.light,
    warning: baseColors.warning.light,
    error: baseColors.error.light,
    info: baseColors.info.light,
};

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