import React, {useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingBar = ({ isLoading = false, progress = null, height = 2 }) => {
    const [visible, setVisible] = useState(true);
    const useIndeterminate = progress === null;

    useEffect(() => {
        if (progress === 100 && visible) {
            const completeTimer = setTimeout(() => {
                setVisible(false);
            }, 200);

            const resetTimer = setTimeout(() => {
                setVisible(true);
            }, 1000);

            return () => {
                clearTimeout(completeTimer);
                clearTimeout(resetTimer);
            };
        }
    }, [progress, visible]);

    return (
        <div className="w-full sticky top-16 z-40" style={{ height: `${height}px` }}>
            <AnimatePresence>
                {isLoading && visible && useIndeterminate && (
                    <motion.div
                        className="h-full bg-indigo-600 w-full absolute left-0 top-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 1.0, 0.4] }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: {
                                repeat: Infinity,
                                duration: 1.0,
                                ease: "easeInOut",
                                times: [0, 0.2, 1]
                            },
                            exit: { duration: 0.3 }
                        }}
                    />
                )}

                {isLoading && visible && !useIndeterminate && (
                    <motion.div
                        className="h-full bg-indigo-600 absolute left-0 top-0"
                        style={{ width: `${progress}%` }}
                        initial={{ width: '0%', opacity: 0 }}
                        animate={{ width: `${progress}%`, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            width: { ease: "easeInOut" },
                            opacity: { duration: 0.5 }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoadingBar;