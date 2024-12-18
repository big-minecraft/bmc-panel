import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useCard } from './hooks/useCard';
import {CardBody, CardFooter, CardHeader} from "./CardParts";

const Card = forwardRef(({
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
        isHovered,
        canCollapse,
        toggleCollapse,
        handleMouseEnter,
        handleMouseLeave
    } = useCard({
        collapsible,
        defaultCollapsed,
        onCollapse,
        onExpand,
        loading
    });

    const Container = motion.div;
    const containerProps = {
        ref,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick,
        className: `
      bg-white rounded-xl overflow-hidden
      ${bordered ? 'border border-gray-100' : ''}
      ${hoverable ? 'hover:shadow-lg transition-shadow duration-200' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `,
        ...props
    };

    if (loading) {
        return (
            <Container {...containerProps}>
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            </Container>
        );
    }

    return (
        <Container {...containerProps}>
            {header && (
                <div
                    className={`px-6 py-4 border-b border-gray-100 
            ${canCollapse ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={canCollapse ? toggleCollapse : undefined}
                >
                    <div className="flex items-center justify-between">
                        {typeof header === 'string' ? (
                            <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
                        ) : (
                            header
                        )}
                        {canCollapse && (
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
        </Container>
    );
});

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;