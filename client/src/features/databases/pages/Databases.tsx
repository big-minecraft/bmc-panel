import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Plus, Database as DatabaseIcon, Loader2} from 'lucide-react';
import {DatabasesProvider, useDatabases} from '../context/DatabasesContext';
import {useNotifications} from '../hooks/useNotifications';
import {useDatabaseName} from '../hooks/useDatabaseName';
import {DatabaseCard} from '../components/DatabaseCard';
import {Notifications} from '../components/Notifications';
import {CreateDatabaseModal} from '../modals/CreateDatabaseModal';
import {DeleteDatabaseModal} from '../modals/DeleteDatabaseModal';
import {ResetPasswordModal} from '../modals/ResetPasswordModal';
import {DatabaseSection} from "../components/DatabaseSection";

interface EmptyStateProps {
    type: 'sql' | 'mongo';
    onCreateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({type, onCreateClick}) => (
    <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-12"
    >
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
                <DatabaseIcon className="w-8 h-8 text-blue-500"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No {type.toUpperCase()} databases yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
                Get started by creating your first {type.toUpperCase()} database. You can manage multiple databases and
                their credentials from here.
            </p>
            <motion.button
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.98}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={onCreateClick}
            >
                <Plus className="w-4 h-4"/>
                <span className="font-medium">Create {type.toUpperCase()} Database</span>
            </motion.button>
        </div>
    </motion.div>
);

const DatabasesContent: React.FC = () => {
    const {
        sqlDatabases,
        mongoDatabases,
        isLoading,
        error,
        fetchDatabases,
        createDatabase,
        deleteDatabase,
        resetPassword
    } = useDatabases();

    const {notifications, addNotification, removeNotification} = useNotifications();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDatabaseType, setSelectedDatabaseType] = useState<'sql' | 'mongo'>('sql');
    const {name: newDatabaseName, setName: setNewDatabaseName, validation: nameValidation} = useDatabaseName('');
    const [databaseToDelete, setDatabaseToDelete] = useState<{ name: string; type: 'sql' | 'mongo' } | null>(null);
    const [databaseToReset, setDatabaseToReset] = useState<{ name: string; type: 'sql' | 'mongo' } | null>(null);
    const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    const handleShowCreateModal = (type: 'sql' | 'mongo') => {
        setSelectedDatabaseType(type);
        setShowCreateModal(true);
    };

    const handleCreate = async () => {
        if (!nameValidation.isValid || !newDatabaseName.trim()) {
            addNotification('Invalid database name', 'danger');
            return;
        }

        try {
            const response = await createDatabase(newDatabaseName, selectedDatabaseType);
            setShowCreateModal(false);
            setNewDatabaseName('');
            addNotification(`Successfully created ${selectedDatabaseType.toUpperCase()} database ${newDatabaseName}`, 'success');
            setShowCredentials(prev => ({...prev, [response.name]: true}));
        } catch (err) {
            addNotification(`Failed to create ${selectedDatabaseType.toUpperCase()} database ${newDatabaseName}`, 'danger');
        }
    };

    const handleDelete = async () => {
        if (!databaseToDelete) return;

        try {
            await deleteDatabase(databaseToDelete.name, databaseToDelete.type);
            addNotification(`Successfully deleted ${databaseToDelete.type.toUpperCase()} database ${databaseToDelete.name}`, 'success');
        } catch (err) {
            addNotification(`Failed to delete ${databaseToDelete.type.toUpperCase()} database ${databaseToDelete.name}`, 'danger');
        } finally {
            setDatabaseToDelete(null);
        }
    };

    const handleResetPassword = async () => {
        if (!databaseToReset) return;

        try {
            await resetPassword(databaseToReset.name, databaseToReset.type);
            addNotification(`Successfully reset password for ${databaseToReset.type.toUpperCase()} database ${databaseToReset.name}`, 'success');
            setShowCredentials(prev => ({...prev, [databaseToReset.name]: true}));
        } catch (err) {
            addNotification(`Failed to reset password for ${databaseToReset.type.toUpperCase()} database ${databaseToReset.name}`, 'danger');
        } finally {
            setDatabaseToReset(null);
        }
    };

    const toggleCredentials = (databaseName: string) => {
        setShowCredentials(prev => ({...prev, [databaseName]: !prev[databaseName]}));
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
                    <span className="text-sm font-medium">Loading databases...</span>
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Notifications
                notifications={notifications}
                onDismiss={removeNotification}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Databases</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your database instances and credentials</p>
                </div>

                <DatabaseSection
                    title="SQL Databases"
                    type="sql"
                    databases={sqlDatabases}
                    showCredentials={showCredentials}
                    onCreateClick={handleShowCreateModal}
                    onShowCredentials={toggleCredentials}
                    onDelete={(name, type) => setDatabaseToDelete({name, type})}
                    onReset={(name, type) => setDatabaseToReset({name, type})}
                />

                <DatabaseSection
                    title="MongoDB Databases"
                    type="mongo"
                    databases={mongoDatabases}
                    showCredentials={showCredentials}
                    onCreateClick={handleShowCreateModal}
                    onShowCredentials={toggleCredentials}
                    onDelete={(name, type) => setDatabaseToDelete({name, type})}
                    onReset={(name, type) => setDatabaseToReset({name, type})}
                />
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
                databaseType={selectedDatabaseType}
            />

            <DeleteDatabaseModal
                databaseName={databaseToDelete?.name}
                databaseType={databaseToDelete?.type}
                onClose={() => setDatabaseToDelete(null)}
                onConfirm={handleDelete}
            />

            <ResetPasswordModal
                databaseName={databaseToReset?.name}
                databaseType={databaseToReset?.type}
                onClose={() => setDatabaseToReset(null)}
                onConfirm={handleResetPassword}
            />
        </div>
    );
};

const Databases: React.FC = () => (
    <DatabasesProvider>
        <DatabasesContent/>
    </DatabasesProvider>
);

export default Databases;