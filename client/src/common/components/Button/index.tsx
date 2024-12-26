import React from 'react';
import {motion} from 'framer-motion';
import {Loader2} from 'lucide-react';
import {ButtonProps} from './types';
import {useButton} from './hooks/useButton';
import {useTheme} from '../../context/theme/ThemeContext';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    onClick,
    type = 'button',
    ...props
}, ref) => {
    const {disabled: isDisabled, baseClasses, isLoading} = useButton({
        disabled,
        loading,
        fullWidth,
        variant,
        size
    });

    const {theme} = useTheme();

    return (
        <motion.button
            ref={ref}
            whileHover={!isDisabled ? {scale: 1.02} : undefined}
            whileTap={!isDisabled ? {scale: 0.98} : undefined}
            transition={theme.animation.smooth}
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && (
                        <Icon className="w-4 h-4 mr-2"/>
                    )}
                    {children}
                    {Icon && iconPosition === 'right' && (
                        <Icon className="w-4 h-4 ml-2"/>
                    )}
                </>
            )}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;