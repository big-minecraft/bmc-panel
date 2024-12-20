import React from 'react';
import { motion } from 'framer-motion';
import { getStatusBadge } from './utils';
import { Trash2, Copy, Check } from 'lucide-react';

const InviteCodeCard = ({ invite, onRevokeClick }) => {
    const status = getStatusBadge(invite);
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(invite.code);
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
                            <div className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                                {invite.code}
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
                        <div className="space-y-1">
                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                {invite.message}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>Created {new Date(invite.created_at).toLocaleString()}</span>
                                {invite.used_by && (
                                    <span>• Used by {invite.used_by}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-[120px] justify-end">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRevokeClick(invite.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={16} />
                        </motion.button>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default InviteCodeCard;