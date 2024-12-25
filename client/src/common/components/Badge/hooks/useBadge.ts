import {useCallback} from 'react';
import {BadgeVariantStyles, BadgeSizeStyles, UseBadgeProps} from '../types';
import {useTheme} from '../../../context/theme/ThemeContext';

export const useBadge = ({
    variant = 'default',
    size = 'md'
}: UseBadgeProps) => {
    const {theme} = useTheme();

    const getVariantClasses = useCallback((): string => {
        const variants: BadgeVariantStyles = {
            default: 'bg-gray-100 text-gray-800',
            primary: 'bg-indigo-100 text-indigo-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            danger: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800'
        };
        return variants[variant];
    }, [variant]);

    const getDotClasses = useCallback((): string => {
        const dotVariants: BadgeVariantStyles = {
            default: 'bg-gray-500',
            primary: 'bg-indigo-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            danger: 'bg-red-500',
            info: 'bg-blue-500'
        };
        return dotVariants[variant];
    }, [variant]);

    const getSizeClasses = useCallback((): string => {
        const sizes: BadgeSizeStyles = {
            sm: 'text-xs px-2 py-0.5',
            md: 'text-sm px-2.5 py-0.5',
            lg: 'text-base px-3 py-1',
        };
        return sizes[size];
    }, [size]);

    const getBaseClasses = useCallback((): string => {
        return `
            inline-flex items-center justify-center
            font-medium rounded-full
            whitespace-nowrap
            ${getVariantClasses()}
            ${getSizeClasses()}
        `;
    }, [getVariantClasses, getSizeClasses]);

    return {
        baseClasses: getBaseClasses(),
        dotClasses: getDotClasses(),
    };
};