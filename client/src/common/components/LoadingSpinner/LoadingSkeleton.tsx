import React from 'react';
import {motion} from 'framer-motion';
import type {LoadingSkeletonProps} from './types';

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(({
    rows = 3,
    avatar = true,
    className = '',
    ...props
}, ref) => (
    <motion.div
        ref={ref}
        className={`space-y-4 ${className}`}
        {...props}
    >
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <div className="flex items-center space-x-3">
                    {avatar && (
                        <motion.div
                            className="h-10 w-10 rounded-full bg-gray-200"
                            animate={{opacity: [0.5, 1, 0.5]}}
                            transition={{duration: 1.5, repeat: Infinity}}
                        />
                    )}
                    <div className="space-y-2 flex-1">
                        <motion.div
                            className="h-4 w-1/4 bg-gray-200 rounded"
                            animate={{opacity: [0.5, 1, 0.5]}}
                            transition={{duration: 1.5, repeat: Infinity}}
                        />
                        <motion.div
                            className="h-3 w-1/3 bg-gray-200 rounded"
                            animate={{opacity: [0.5, 1, 0.5]}}
                            transition={{duration: 1.5, repeat: Infinity}}
                        />
                    </div>
                </div>
            </div>
        ))}
    </motion.div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;