import React from 'react';
import { motion } from 'framer-motion';
import { ModalBackdropProps } from './types';

const ModalBackdrop = React.forwardRef<HTMLDivElement, ModalBackdropProps>(({
                                                                                children,
                                                                                onClick,
                                                                                ...props
                                                                            }, ref) => {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            {...props}
        >
            <div
                className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
                onClick={onClick}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                {children}
            </div>
        </motion.div>
    );
});

ModalBackdrop.displayName = 'ModalBackdrop';

export default ModalBackdrop;