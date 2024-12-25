import { useCallback } from 'react';
import { UseButtonProps, ButtonVariantClasses, ButtonSizeClasses } from '../types';
import { useTheme } from '../../../context/theme/ThemeContext';

export const useButton = ({
                              disabled = false,
                              loading = false,
                              fullWidth = false,
                              variant = 'primary',
                              size = 'md'
                          }: UseButtonProps) => {
    const getVariantClasses = useCallback((): string => {
        const variants: ButtonVariantClasses = {
            primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
            secondary: 'bg-background-offset text-secondary hover:bg-secondary-hover focus:ring-secondary',
            outline: 'border-2 border-primary text-primary hover:bg-primary-light focus:ring-primary',
            ghost: 'text-secondary hover:bg-background-offset focus:ring-secondary',
            danger: 'bg-error text-white hover:bg-error-dark focus:ring-error',
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