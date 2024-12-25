import React from 'react';
import {motion} from 'framer-motion';
import {Loader2} from 'lucide-react';
import type {LoadingSpinnerProps, SpinnerSizeClasses} from './types';

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(({
    size = 'md',
    text = 'Loading',
    className = '',
    ...props
}, ref) => {
    const sizes: SpinnerSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const containerClassName = `flex flex-col items-center justify-center min-h-[200px] ${className}`;

    return (
        <motion.div
            ref={ref}
            className={containerClassName}
            {...props}
        >
            <motion.div
                initial={{opacity: 0, scale: 0.8}}
                animate={{opacity: 1, scale: 1}}
                transition={{duration: 0.2}}
                className="flex flex-col items-center"
            >
                <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin`}/>
                {text && (
                    <motion.p
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.1}}
                        className="mt-4 text-sm text-gray-500 font-medium"
                    >
                        {text}
                    </motion.p>
                )}
            </motion.div>
        </motion.div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;