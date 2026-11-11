import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertTriangle, KeyRound, Loader2, Lock, Plus, ShieldCheck, User} from 'lucide-react';
import {useProfile} from '../hooks/useSshKeys';
import {useNotifications} from '../hooks/useNotifications';
import {Notifications} from '../components/Notifications';
import {SshKeyCard} from '../components/SshKeyCard';
import {AddSshKeyModal} from '../modals/AddSshKeyModal';
import {DeleteSshKeyModal} from '../modals/DeleteSshKeyModal';
import type {SshKey} from '../types/types';

const EmptyKeys: React.FC<{onAddClick: () => void}> = ({onAddClick}) => (
    <div className="flex flex-col items-center text-center py-10">
        <div className="p-3 bg-blue-50 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-blue-500"/>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No SSH keys yet</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
            Add a public key to connect to file edit sessions over SFTP without a password.
        </p>
        <motion.button
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
            <Plus className="w-4 h-4"/>
            <span className="font-medium">Add SSH Key</span>
        </motion.button>
    </div>
);

const Profile: React.FC = () => {
    const {profile, keys, isLoading, error, fetchProfile, addKey, removeKey} = useProfile();
    const {notifications, addNotification, removeNotification} = useNotifications();
    const [showAddModal, setShowAddModal] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<SshKey | null>(null);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleAdd = async (name: string, publicKey: string) => {
        const key = await addKey(name, publicKey);
        addNotification(`Added SSH key "${key.name}"`, 'success');
    };

    const handleDelete = async () => {
        if (!keyToDelete) return;

        try {
            await removeKey(keyToDelete.id);
            addNotification(`Removed SSH key "${keyToDelete.name}"`, 'success');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to remove SSH key', 'danger');
        } finally {
            setKeyToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="flex items-center gap-3 text-blue-500"
                >
                    <Loader2 className="w-6 h-6 animate-spin"/>
                    <span className="text-sm font-medium">Loading your profile...</span>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="min-h-[50vh] flex items-center justify-center px-4"
            >
                <div className="max-w-md w-full bg-red-50 text-red-800 px-6 py-4 rounded-lg border border-red-200">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </motion.div>
        );
    }

    const passwordAuth = profile?.sftp.passwordAuth !== false;
    const keyRequired = !passwordAuth;

    return (
        <div className="min-h-screen bg-gray-50">
            <Notifications notifications={notifications} onDismiss={removeNotification}/>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Your account and the SSH keys you use to reach file sessions
                    </p>
                </div>

                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <User className="w-6 h-6 text-gray-500"/>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-gray-900">{profile?.username}</h2>
                                {profile?.isAdmin && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                        <ShieldCheck className="w-3 h-3"/>
                                        Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Signed in with {profile?.authProvider === 'local' ? 'a panel password' : profile?.authProvider}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">SSH Keys</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Your keys, installed on every file session on this instance
                            </p>
                        </div>
                        {keys.length > 0 && (
                            <motion.button
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"
                            >
                                <Plus className="w-4 h-4"/>
                                <span className="font-medium text-sm">Add Key</span>
                            </motion.button>
                        )}
                    </div>

                    <div className="p-6">
                        <div
                            className={`mb-6 flex items-start gap-3 p-3 rounded-lg ${
                                keyRequired ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'
                            }`}
                        >
                            {keyRequired ? (
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0"/>
                            ) : (
                                <Lock className="w-4 h-4 mt-0.5 shrink-0"/>
                            )}
                            <p className="text-xs">
                                {keyRequired ? (
                                    <>
                                        This instance has SFTP password authentication turned off, so a file session is
                                        only reachable with a registered key. File sessions are shared: they accept
                                        every panel user's keys, and adding one here lets you into the sessions of
                                        every deployment.
                                    </>
                                ) : (
                                    <>
                                        This instance also accepts the shared SFTP password. File sessions are shared:
                                        they accept every panel user's keys, and adding one here lets you into the
                                        sessions of every deployment.
                                    </>
                                )}
                            </p>
                        </div>

                        {keys.length === 0 ? (
                            <EmptyKeys onAddClick={() => setShowAddModal(true)}/>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence initial={false}>
                                    {keys.map(key => (
                                        <SshKeyCard key={key.id} sshKey={key} onDelete={setKeyToDelete}/>
                                    ))}
                                </AnimatePresence>
                                <p className="text-xs text-gray-400 pt-2">
                                    A session takes a copy of the registered keys when it starts. Changes here apply to
                                    the next session anyone opens, not to sessions already running.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <AddSshKeyModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAdd}
            />

            <DeleteSshKeyModal
                sshKey={keyToDelete}
                onClose={() => setKeyToDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default Profile;
