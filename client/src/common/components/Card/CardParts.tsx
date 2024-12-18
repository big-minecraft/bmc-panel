import React from 'react';
import { motion } from 'framer-motion';

export const CardHeader = ({
                               children,
                               className = '',
                               actions,
                               divider = true,
                               ...props
                           }) => (
    <div
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
    </div>
);

export const CardBody = ({
                             children,
                             className = '',
                             padding = true,
                             ...props
                         }) => (
    <div
        className={`
      ${padding ? 'p-6' : ''}
      ${className}
    `}
        {...props}
    >
        {children}
    </div>
);

export const CardFooter = ({
                               children,
                               className = '',
                               divider = true,
                               align = 'right',
                               ...props
                           }) => (
    <div
        className={`
      px-6 py-4
      ${divider ? 'border-t border-gray-100 bg-gray-50' : ''}
      ${className}
    `}
        {...props}
    >
        <div className={`flex ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} gap-2`}>
            {children}
        </div>
    </div>
);