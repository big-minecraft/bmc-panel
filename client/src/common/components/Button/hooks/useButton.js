import { useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';

export const useButton = ({
                              disabled = false,
                              loading = false,
                              fullWidth = false,
                              variant = 'primary',
                              size = 'md'
                          }) => {
    const theme = useTheme();

    const getVariantClasses = useCallback(() => {
        const variants = {
            primary: `bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`,
            secondary: `bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400`,
            outline: `border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500`,
            ghost: `text-gray-600 hover:bg-gray-100 focus:ring-gray-400`,
            danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
        };
        return variants[variant];
    }, [variant]);

    const getSizeClasses = useCallback(() => {
        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };
        return sizes[size];
    }, [size]);

    const getBaseClasses = useCallback(() => {
        return `
            inline-flex items-center justify-center
            font-medium rounded-lg
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