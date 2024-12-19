import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useCard } from './hooks/useCard';
import { CardBody, CardFooter, CardHeader } from './CardParts';
import { CardProps, CardComponent } from './types';

const Card = React.forwardRef<HTMLDivElement, CardProps>(({
                                                              children,
                                                              className = '',
                                                              hoverable = false,
                                                              bordered = true,
                                                              collapsible = false,
                                                              defaultCollapsed = false,
                                                              onCollapse,
                                                              onExpand,
                                                              header,
                                                              footer,
                                                              loading = false,
                                                              onClick,
                                                              padding = true,
                                                              ...props
                                                          }, ref) => {
    const {
        isCollapsed,
        loading: isLoading,
        toggleCollapse
    } = useCard({
        collapsible,
        defaultCollapsed,
        onCollapse,
        onExpand,
        loading
    });

    if (isLoading) {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`
          bg-white rounded-xl overflow-hidden
          ${bordered ? 'border border-gray-100' : ''}
          ${className}
        `}
                {...props}
            >
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={hoverable ? { y: -2, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' } : undefined}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={`
        bg-white rounded-xl overflow-hidden
        ${bordered ? 'border border-gray-100' : ''}
        ${hoverable ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
            {...props}
        >
            {header && (
                <div
                    className={`px-6 py-4 border-b border-gray-100 
            ${collapsible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={collapsible ? toggleCollapse : undefined}
                >
                    <div className="flex items-center justify-between">
                        {typeof header === 'string' ? (
                            <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
                        ) : (
                            header
                        )}
                        {collapsible && (
                            <motion.div
                                animate={{ rotate: isCollapsed ? 0 : 180 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            <motion.div
                animate={{
                    height: isCollapsed ? 0 : 'auto',
                    opacity: isCollapsed ? 0 : 1
                }}
                transition={{ duration: 0.2 }}
                className={padding ? 'p-6' : ''}
            >
                {children}
            </motion.div>

            {footer && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    {footer}
                </div>
            )}
        </motion.div>
    );
}) as CardComponent;

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.displayName = 'Card';

export default Card;