import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';

const Modal = ({title, children, footer, onClose}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
                <motion.div
                    initial={{scale: 0.95, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    exit={{scale: 0.95, opacity: 0}}
                    className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <h5 className="text-xl font-semibold">{title}</h5>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div className="p-4">{children}</div>
                    {footer && (
                        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Modal;