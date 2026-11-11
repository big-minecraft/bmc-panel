import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Check, Copy, KeyRound, Trash2} from 'lucide-react';
import type {SshKey} from '../types/types';

interface SshKeyCardProps {
    sshKey: SshKey;
    onDelete: (key: SshKey) => void;
}

const formatAdded = (timestamp: number): string =>
    new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

export const SshKeyCard: React.FC<SshKeyCardProps> = ({sshKey, onDelete}) => {
    const [copied, setCopied] = useState(false);

    const copyFingerprint = async () => {
        try {
            await navigator.clipboard.writeText(sshKey.fingerprint);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <motion.div
            layout
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            className="flex items-start justify-between gap-4 p-4 bg-white border border-gray-100 rounded-xl"
        >
            <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    <KeyRound className="w-4 h-4 text-blue-500"/>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{sshKey.name}</h3>
                        <span
                            className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium shrink-0">
                            {sshKey.keyType}
                        </span>
                    </div>
                    <button
                        onClick={copyFingerprint}
                        title="Copy fingerprint"
                        className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors max-w-full"
                    >
                        <code className="font-mono truncate">{sshKey.fingerprint}</code>
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-green-600 shrink-0"/>
                        ) : (
                            <Copy className="w-3.5 h-3.5 shrink-0"/>
                        )}
                    </button>
                    <p className="mt-1 text-xs text-gray-400">Added {formatAdded(sshKey.createdAt)}</p>
                </div>
            </div>

            <motion.button
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={() => onDelete(sshKey)}
                title={`Remove ${sshKey.name}`}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
                <Trash2 className="w-4 h-4"/>
            </motion.button>
        </motion.div>
    );
};
