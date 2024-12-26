import React from 'react';
import {motion} from 'framer-motion';
import {CardHeaderProps, CardBodyProps, CardFooterProps} from './types';

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({
    children,
    className = '',
    actions,
    divider = true,
    ...props
}, ref) => (
    <motion.div
        ref={ref}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className={`
      px-6 py-4
      ${divider ? 'border-b border-gray-100' : ''}
      ${className}
    `}
        {...props}
    >
        <div className="flex items-center justify-between">
            {typeof children === 'string' ? (
                <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
            ) : (
                children
            )}
            {actions && (
                <div className="flex items-center space-x-2">
                    {actions}
                </div>
            )}
        </div>
    </motion.div>
));

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(({
    children,
    className = '',
    padding = true,
    ...props
}, ref) => (
    <motion.div
        ref={ref}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className={`
      ${padding ? 'p-6' : ''}
      ${className}
    `}
        {...props}
    >
        {children}
    </motion.div>
));

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({
    children,
    className = '',
    divider = true,
    align = 'right',
    ...props
}, ref) => (
    <motion.div
        ref={ref}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className={`
      px-6 py-4
      ${divider ? 'border-t border-gray-100 bg-gray-50' : ''}
      ${className}
    `}
        {...props}
    >
        <div
            className={`flex ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} gap-2`}>
            {children}
        </div>
    </motion.div>
));

CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';