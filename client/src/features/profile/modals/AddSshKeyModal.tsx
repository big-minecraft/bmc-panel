import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {KeyRound, Loader2, X} from 'lucide-react';

interface AddSshKeyModalProps {
    show: boolean;
    onClose: () => void;
    onAdd: (name: string, publicKey: string) => Promise<void>;
}

export const AddSshKeyModal: React.FC<AddSshKeyModalProps> = ({show, onClose, onAdd}) => {
    const [name, setName] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            setName('');
            setPublicKey('');
            setError(null);
            setSaving(false);
        }
    }, [show]);

    if (!show) return null;

    const handleAdd = async () => {
        if (!publicKey.trim() || saving) return;

        setSaving(true);
        setError(null);

        try {
            await onAdd(name.trim(), publicKey.trim());
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add SSH key');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.95, opacity: 0}}
                            className="relative transform overflow-hidden rounded-xl bg-white shadow-xl transition-all sm:w-full sm:max-w-lg"
                        >
                            <div className="bg-white p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <KeyRound className="w-5 h-5 text-blue-500"/>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Add SSH Key</h3>
                                    </div>
                                    <motion.button
                                        whileHover={{scale: 1.1}}
                                        whileTap={{scale: 0.9}}
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <X className="w-5 h-5"/>
                                    </motion.button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Work laptop"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Optional. Defaults to the comment on the key.
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Public key
                                        </label>
                                        <textarea
                                            rows={5}
                                            spellCheck={false}
                                            className={`w-full px-3 py-2 border rounded-lg text-xs font-mono resize-y focus:ring-2 focus:border-transparent ${
                                                error
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-200 focus:ring-blue-500'
                                            }`}
                                            placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... you@example.com"
                                            value={publicKey}
                                            onChange={(e) => {
                                                setPublicKey(e.target.value);
                                                setError(null);
                                            }}
                                        />
                                        {error && <p className="text-sm text-red-600">{error}</p>}
                                        <p className="text-xs text-gray-500">
                                            Paste the contents of your public key file, usually
                                            {' '}<code className="font-mono">~/.ssh/id_ed25519.pub</code>. Never paste a
                                            private key.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <motion.button
                                        whileHover={{scale: 1.02}}
                                        whileTap={{scale: 0.98}}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{scale: 1.02}}
                                        whileTap={{scale: 0.98}}
                                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg ${
                                            !publicKey.trim() || saving
                                                ? 'bg-blue-300 cursor-not-allowed'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                        onClick={handleAdd}
                                        disabled={!publicKey.trim() || saving}
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
                                        Add Key
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
