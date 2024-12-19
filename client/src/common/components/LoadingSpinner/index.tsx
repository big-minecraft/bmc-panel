import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { LoadingSpinnerProps, LoadingSkeletonProps, ErrorAlertProps, SpinnerSizeClasses } from './types';
import { useTheme } from '../../context/theme/ThemeContext';

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(({
                                                                                  size = 'md',
                                                                                  text = 'Loading',
                                                                                  fullScreen = false,
                                                                                  className = '',
                                                                                  ...props
                                                                              }, ref) => {
    const theme = useTheme();

    const sizes: SpinnerSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const Container = fullScreen ? motion.div : motion.div;
    const containerProps = fullScreen ? {
        className: "fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    } : {
        className: `flex flex-col items-center justify-center min-h-[200px] ${className}`,
    };

    return (
        <Container ref={ref} {...containerProps} {...props}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
            >
                <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin`} />
                {text && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-sm text-gray-500 font-medium"
                    >
                        {text}
                    </motion.p>
                )}
            </motion.div>
        </Container>
    );
});

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(({
                                                                                    rows = 3,
                                                                                    avatar = true,
                                                                                    className = '',
                                                                                    ...props
                                                                                }, ref) => (
    <div ref={ref} className={`space-y-4 ${className}`} {...props}>
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <div className="flex items-center space-x-3">
                    {avatar && (
                        <motion.div
                            className="h-10 w-10 rounded-full bg-gray-200"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                    <div className="space-y-2 flex-1">
                        <motion.div
                            className="h-4 w-1/4 bg-gray-200 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="h-3 w-1/3 bg-gray-200 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
));

const ErrorAlert = React.forwardRef<HTMLDivElement, ErrorAlertProps>(({
                                                                          message,
                                                                          className = '',
                                                                          ...props
                                                                      }, ref) => (
    <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg bg-red-50 p-4 mt-4 ${className}`}
        {...props}
    >
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{message}</p>
            </div>
        </div>
    </motion.div>
));

LoadingSpinner.displayName = 'LoadingSpinner';
LoadingSkeleton.displayName = 'LoadingSkeleton';
ErrorAlert.displayName = 'ErrorAlert';

export { LoadingSpinner, LoadingSkeleton, ErrorAlert };
export default LoadingSpinner;