import React from 'react';
import {motion} from 'framer-motion';
import {BadgeProps, BadgeVariantStyles, BadgeSizeStyles} from './types';
import {useTheme} from '../../context/theme/ThemeContext';

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    const theme = useTheme();

    const variants: BadgeVariantStyles = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-indigo-100 text-indigo-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
    };

    const dotVariants: BadgeVariantStyles = {
        default: 'bg-gray-500',
        primary: 'bg-indigo-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
    };

    const sizes: BadgeSizeStyles = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
    };

    return (
        <motion.span
            ref={ref}
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.9}}
            transition={{duration: 0.2}}
            className={`
                inline-flex items-center justify-center
                font-medium rounded-full
                whitespace-nowrap
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotVariants[variant]}`}/>
            )}
            {Icon && <Icon className="w-3.5 h-3.5 mr-1"/>}
            {children}
        </motion.span>
    );
});

Badge.displayName = 'Badge';

export default Badge;