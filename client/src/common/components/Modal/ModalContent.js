import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ModalContent = forwardRef(({
                                     title,
                                     children,
                                     footer,
                                     onClose,
                                     showClose,
                                     size = 'md',
                                     className = '',
                                     isTopModal
                                 }, ref) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4'
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0.1
            }}
            className={`
        relative w-full ${sizes[size]}
        bg-white shadow-xl rounded-xl
        ${className}
      `}
            style={{ zIndex: isTopModal ? 51 : 50 }}
        >
            {(title || showClose) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                    )}
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            )}

            <div className="p-6">
                {children}
            </div>

            {footer && (
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    {footer}
                </div>
            )}
        </motion.div>
    );
});

export default ModalContent;