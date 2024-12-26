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
    const {theme} = useTheme();
    const colors = theme.colors;

    const getVariantClasses = useCallback((): string => {
        const variants: ButtonVariantClasses = {
            primary: `bg-[var(--negative-accent-bg)] text-[var(--negative-accent-text)] hover:bg-[var(--negative-accent-bg-hover)] focus:ring-[var(--undetermined)]`,
            secondary: 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400',
            outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
            ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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