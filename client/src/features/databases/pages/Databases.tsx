import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, Loader2 } from 'lucide-react';
import { DatabasesProvider, useDatabases } from '../context/DatabasesContext';
import { useNotifications } from '../hooks/useNotifications';
import { useDatabaseName } from '../hooks/useDatabaseName';
import { DatabaseCard } from '../components/DatabaseCard';
import { Notifications } from '../components/Notifications';
import { CreateDatabaseModal } from '../modals/CreateDatabaseModal';
import { DeleteDatabaseModal } from '../modals/DeleteDatabaseModal';
import { ResetPasswordModal } from '../modals/ResetPasswordModal';

const EmptyState = ({ onCreateClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-12"
    >
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
                <Database className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No databases yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
                Get started by creating your first database. You can manage multiple databases and their credentials from here.
            </p>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={onCreateClick}
            >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create Database</span>
            </motion.button>
        </div>
    </motion.div>
);

const DatabasesContent: React.FC = () => {
    const {
        databases,
        isLoading,
        error,
        fetchDatabases,
        createDatabase,
        deleteDatabase,
        resetPassword
    } = useDatabases()

    const { notifications, addNotification, removeNotification } = useNotifications()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const { name: newDatabaseName, setName: setNewDatabaseName, validation: nameValidation } = useDatabaseName('')
    const [databaseToDelete, setDatabaseToDelete] = useState<string | null>(null)
    const [databaseToReset, setDatabaseToReset] = useState<string | null>(null)
    const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    const handleCreate = async () => {
        if (!nameValidation.isValid || !newDatabaseName.trim()) {
            addNotification('Invalid database name', 'danger')
            return;
        }

        try {
            const response = await createDatabase(newDatabaseName);
            setShowCreateModal(false);
            setNewDatabaseName('');
            addNotification(`successfully created database ${newDatabaseName}`, 'success');
            setShowCredentials(prev => ({ ...prev, [response.name]: true }));
        } catch (err) {
            addNotification(`failed to create database ${newDatabaseName}`, 'danger');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteDatabase(databaseToDelete);
            addNotification(`successfully deleted database ${databaseToDelete}`, 'success');
        } catch (err) {
            addNotification(`failed to delete database ${databaseToDelete}`, 'danger');
        } finally {
            setDatabaseToDelete(null);
        }
    };

    const handleResetPassword = async () => {
        try {
            await resetPassword(databaseToReset);
            addNotification(`successfully reset password for ${databaseToReset}`, 'success');
            setShowCredentials(prev => ({ ...prev, [databaseToReset]: true }));
        } catch (err) {
            addNotification(`failed to reset password for ${databaseToReset}`, 'danger');
        } finally {
            setDatabaseToReset(null);
        }
    };

    const toggleCredentials = (databaseName) => {
        setShowCredentials(prev => ({ ...prev, [databaseName]: !prev[databaseName] }));
    };

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-blue-500"
                >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-medium">Loading databases...</span>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-[50vh] flex items-center justify-center px-4"
            >
                <div className="max-w-md w-full bg-red-50 text-red-800 px-6 py-4 rounded-lg border border-red-200">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Notifications
                notifications={notifications}
                onDismiss={removeNotification}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Databases</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your database instances and credentials</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create Database</span>
                    </motion.button>
                </div>

                <motion.div layout className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {databases.map(database => (
                            <DatabaseCard
                                key={database.name}
                                database={database}
                                showCredentials={showCredentials[database.name]}
                                onShowCredentials={toggleCredentials}
                                onDelete={setDatabaseToDelete}
                                onReset={setDatabaseToReset}
                            />
                        ))}
                        {databases.length === 0 && (
                            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <CreateDatabaseModal
                show={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setNewDatabaseName('');
                }}
                databaseName={newDatabaseName}
                onDatabaseNameChange={setNewDatabaseName}
                onCreate={handleCreate}
                validation={nameValidation}
            />

            <DeleteDatabaseModal
                databaseName={databaseToDelete}
                onClose={() => setDatabaseToDelete(null)}
                onConfirm={handleDelete}
            />

            <ResetPasswordModal
                databaseName={databaseToReset}
                onClose={() => setDatabaseToReset(null)}
                onConfirm={handleResetPassword}
            />
        </div>
    );
};

const Databases = () => (
    <DatabasesProvider>
        <DatabasesContent />
    </DatabasesProvider>
);

export default Databases;