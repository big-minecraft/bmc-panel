import {useCallback} from 'react';
import {UseButtonProps, ButtonVariantClasses, ButtonSizeClasses} from '../types';
import {useTheme} from '../../../context/theme/ThemeContext';

export const useButton = ({
    disabled = false,
    loading = false,
    fullWidth = false,
    variant = 'primary',
    size = 'md'
}: UseButtonProps) => {
    const getVariantClasses = useCallback((): string => {
        const variants: ButtonVariantClasses = {
            primary: `
            bg-negative-accent-bg
            text-negative-accent-text
            hover:bg-negative-accent-bg-hover
            focus:ring-accent-bg
            dark:bg-negative-accent-bg-dark
            dark:text-negative-accent-text-dark
            dark:hover:bg-negative-accent-bg-hover-dark
        `,
            secondary: `
            bg-background-offset
            text-primary-second
            hover:bg-background-offset-dark
            focus:ring-primary-third
            dark:bg-background-offset-dark
            dark:text-primary-second-dark
            dark:hover:bg-background-dark
        `,
            outline: `
            border-2
            border-accent-text
            text-accent-text
            hover:bg-accent-bg
            focus:ring-accent-text
            dark:border-accent-text-dark
            dark:text-accent-text-dark
            dark:hover:bg-accent-bg-dark
        `,
            ghost: `
            text-primary-second
            hover:bg-background-offset
            focus:ring-primary-third
            dark:text-primary-second-dark
            dark:hover:bg-background-offset-dark
        `,
            danger: `
            bg-danger-bg
            text-danger-text
            hover:bg-danger-bg-hover
            focus:ring-danger-text
            dark:bg-danger-bg-dark
            dark:text-danger-text-dark
            dark:hover:bg-danger-bg-hover-dark
        `
        };
        return variants[variant];
    }, [variant]);

    const getSizeClasses = useCallback((): string => {
        const sizes: ButtonSizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };
        return sizes[size];
    }, [size]);

    const getBaseClasses = useCallback((): string => {
        return `
            inline-flex items-center justify-center
            font-medium rounded-md
            focus:outline-none focus:ring-2 focus:ring-offset-2
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${fullWidth ? 'w-full' : ''}
            ${getVariantClasses()}
            ${getSizeClasses()}
        `;
    }, [fullWidth, getVariantClasses, getSizeClasses]);

    return {
        disabled: disabled || loading,
        baseClasses: getBaseClasses(),
        isLoading: loading,
    };
};