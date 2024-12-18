import React from 'react';
import { motion } from 'framer-motion';

const ModalBackdrop = ({ children, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
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
};

export default ModalBackdrop;