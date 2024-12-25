import React from 'react';
import {motion} from 'framer-motion';
import {BadgeProps} from './types';
import {useBadge} from './hooks/useBadge';
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
    const {theme} = useTheme();
    const {baseClasses, dotClasses} = useBadge({variant, size});

    return (
        <motion.span
            ref={ref}
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.9}}
            transition={theme.animation.smooth}
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses}`}/>
            )}
            {Icon && <Icon className="w-3.5 h-3.5 mr-1"/>}
            {children}
        </motion.span>
    );
});

Badge.displayName = 'Badge';

export default Badge;