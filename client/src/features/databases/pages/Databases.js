import React, { useState, useEffect } from 'react';
import { DatabasesProvider, useDatabases } from '../context/DatabasesContext';
import { useNotifications } from '../hooks/useNotifications';
import { DatabaseCard } from '../components/DatabaseCard';
import { Notifications } from '../components/Notifications';
import {CreateDatabaseModal} from "../modals/CreateDatabaseModal";
import {DeleteDatabaseModal} from "../modals/DeleteDatabaseModal";
import {ResetPasswordModal} from "../modals/ResetPasswordModal";

const DatabasesContent = () => {
    const { databases, isLoading, error, fetchDatabases, createDatabase, deleteDatabase, resetPassword } = useDatabases();
    const { notifications, addNotification, removeNotification } = useNotifications();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDatabaseName, setNewDatabaseName] = useState('');
    const [databaseToDelete, setDatabaseToDelete] = useState(null);
    const [databaseToReset, setDatabaseToReset] = useState(null);
    const [showCredentials, setShowCredentials] = useState({});

    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    const handleCreate = async () => {
        if (!newDatabaseName.trim()) return;

        try {
            const response = await createDatabase(newDatabaseName);
            setShowCreateModal(false);
            setNewDatabaseName('');
            addNotification(`Successfully created database ${newDatabaseName}`, 'success');
            setShowCredentials(prev => ({
                ...prev,
                [response.name]: true
            }));
        } catch (err) {
            console.error('error creating database:', err);
            addNotification(`Failed to create database ${newDatabaseName}`, 'danger');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteDatabase(databaseToDelete);
            addNotification(`Successfully deleted database ${databaseToDelete}`, 'success');
        } catch (err) {
            console.error('error deleting database:', err);
            addNotification(`Failed to delete database ${databaseToDelete}`, 'danger');
        } finally {
            setDatabaseToDelete(null);
        }
    };

    const handleResetPassword = async () => {
        try {
            await resetPassword(databaseToReset);
            addNotification(`Successfully reset password for ${databaseToReset}`, 'success');
            setShowCredentials(prev => ({
                ...prev,
                [databaseToReset]: true
            }));
        } catch (err) {
            console.error('error resetting password:', err);
            addNotification(`Failed to reset password for ${databaseToReset}`, 'danger');
        } finally {
            setDatabaseToReset(null);
        }
    };

    const toggleCredentialsVisibility = (databaseName) => {
        setShowCredentials(prev => ({
            ...prev,
            [databaseName]: !prev[databaseName]
        }));
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <Notifications
                notifications={notifications}
                onDismiss={removeNotification}
            />

            <div className="d-flex justify-content-end mb-4">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Database
                </button>
            </div>

            <div className="row g-4">
                {databases.length === 0 ? (
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <h5 className="card-title text-muted">No Databases Found</h5>
                            </div>
                        </div>
                    </div>
                ) : (
                    databases.map((database) => (
                        <div key={database.name} className="col-12">
                            <DatabaseCard
                                database={database}
                                showCredentials={showCredentials[database.name]}
                                onShowCredentials={toggleCredentialsVisibility}
                                onDelete={setDatabaseToDelete}
                                onReset={setDatabaseToReset}
                            />
                        </div>
                    ))
                )}
            </div>

            <CreateDatabaseModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                databaseName={newDatabaseName}
                onDatabaseNameChange={setNewDatabaseName}
                onCreate={handleCreate}
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

const Databases = () => {
    return (
        <DatabasesProvider>
            <DatabasesContent />
        </DatabasesProvider>
    );
};

export default Databases;