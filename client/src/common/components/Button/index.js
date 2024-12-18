import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useButton } from './hooks/useButton';

const Button = ({
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
                }) => {
    const { disabled: isDisabled, baseClasses, isLoading } = useButton({
        disabled,
        loading,
        fullWidth,
        variant,
        size
    });

    return (
        <motion.button
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && (
                        <Icon className="w-4 h-4 mr-2" />
                    )}
                    {children}
                    {Icon && iconPosition === 'right' && (
                        <Icon className="w-4 h-4 ml-2" />
                    )}
                </>
            )}
        </motion.button>
    );
};

export default Button;