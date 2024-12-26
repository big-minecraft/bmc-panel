import React from 'react';
import {motion} from 'framer-motion';
import {CardGroupProps} from './types';

const CardGroup = React.forwardRef<HTMLDivElement, CardGroupProps>(({
    children,
    className = '',
    gap = 4,
    cols = {
        default: 1,
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4
    },
    equalHeight = true,
    ...props
}, ref) => {
    const gapSizes = {
        0: 'gap-0',
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        8: 'gap-8',
    };

    const getGridCols = () => {
        const breakpoints = {
            default: `grid-cols-${cols.default}`,
            sm: cols.sm ? `sm:grid-cols-${cols.sm}` : '',
            md: cols.md ? `md:grid-cols-${cols.md}` : '',
            lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
            xl: cols.xl ? `xl:grid-cols-${cols.xl}` : '',
        };

        return Object.values(breakpoints).filter(Boolean).join(' ');
    };

    return (
        <motion.div
            ref={ref}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            transition={{duration: 0.3}}
            className={`
        grid ${getGridCols()} ${gapSizes[gap]}
        ${equalHeight ? 'grid-flow-row-dense' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
});

CardGroup.displayName = 'CardGroup';

export default CardGroup;