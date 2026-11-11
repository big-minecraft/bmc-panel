import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, Key, User, Lock, Globe, KeyRound, AlertTriangle } from 'lucide-react';

interface CredentialsDisplayProps {
    credentials: {
        host: string;
        port: number;
        username: string;
        password?: string;
        passwordAuth: boolean;
        authorizedKeyCount: number;
    };
    defaultExpanded?: boolean;
}

const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({ credentials, defaultExpanded = false }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = async (value: string, field: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const CredentialRow = ({ icon: Icon, label, value, field }: any) => (
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                <code className="text-sm text-gray-900 font-mono truncate">{value}</code>
            </div>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => copyToClipboard(value, field)}
                className="ml-2 p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title={`Copy ${label}`}
            >
                {copiedField === field ? (
                    <Check className="w-4 h-4 text-green-600" />
                ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                )}
            </motion.button>
        </div>
    );

    const { password, passwordAuth, authorizedKeyCount } = credentials;
    const hasKeys = authorizedKeyCount > 0;
    const unreachable = !passwordAuth && !hasKeys;

    const keyLine = hasKeys
        ? `${authorizedKeyCount} registered SSH key${authorizedKeyCount > 1 ? 's' : ''} ${authorizedKeyCount > 1 ? 'were' : 'was'} installed when this session started.`
        : 'No SSH keys were installed when this session started.';

    return (
        <div className="pt-4 mb-5">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors mb-2"
            >
                <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>SFTP Credentials</span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 overflow-hidden"
                    >
                        <CredentialRow
                            icon={Globe}
                            label="Host"
                            value={credentials.host}
                            field="host"
                        />
                        <CredentialRow
                            icon={Key}
                            label="Port"
                            value={credentials.port.toString()}
                            field="port"
                        />
                        <CredentialRow
                            icon={User}
                            label="Username"
                            value={credentials.username}
                            field="username"
                        />
                        {passwordAuth && password && (
                            <CredentialRow
                                icon={Lock}
                                label="Password"
                                value={password}
                                field="password"
                            />
                        )}

                        <div className="flex items-start gap-2 py-2 px-3 bg-gray-50 rounded-lg">
                            <KeyRound className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <span className="text-xs text-gray-500">SSH keys</span>
                                <p className="text-sm text-gray-900">{keyLine}</p>
                            </div>
                        </div>

                        {unreachable ? (
                            <div className="mt-3 p-2 bg-amber-50 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">
                                    Password authentication is disabled and this session started before any SSH keys
                                    were registered. Add a key on your{' '}
                                    <Link to="/profile" className="underline font-medium">profile</Link>, then end this
                                    session and start a new one.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-700">
                                    {passwordAuth
                                        ? 'Use these credentials to connect to your deployment files via SFTP client.'
                                        : 'This instance accepts SSH keys only. Connect with the private key matching one of the registered keys.'}
                                    {!hasKeys && passwordAuth && (
                                        <>
                                            {' '}Add a key on your{' '}
                                            <Link to="/profile" className="underline font-medium">profile</Link> to
                                            connect without a password next time.
                                        </>
                                    )}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CredentialsDisplay;
