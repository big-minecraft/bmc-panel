import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Check } from 'lucide-react';

interface K8sTokenCardProps {
    tokenValue: string;
    onDelete: () => void;
}

const K8sTokenCard: React.FC<K8sTokenCardProps> = ({ tokenValue, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(tokenValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group bg-white rounded-lg border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow transition-all"
        >
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded border border-gray-100 max-w-xl truncate">
                                {tokenValue}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopy}
                                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </motion.button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onDelete}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default K8sTokenCard;