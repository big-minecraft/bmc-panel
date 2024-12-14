import React, { useState, useEffect } from 'react';
import axiosInstance from "../../../utils/auth";
import UsersList from './UsersList';
import DeleteUserModal from './DeleteUserModal';
import LoadingSpinner, {ErrorAlert} from '../../common/LoadingSpinner';
import ResetPasswordModal from "./ResetPasswrodModal";

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load users');
            console.error('error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAdmin = async (userId, currentStatus) => {
        try {
            await axiosInstance.patch(`/api/users/${userId}/admin`, {
                is_admin: !currentStatus
            });
            await fetchUsers();
        } catch (err) {
            console.error('error toggling admin status:', err);
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorAlert message={error} />;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6 mb-0">Users</h1>
            </div>

            <UsersList
                users={users}
                onToggleAdmin={handleToggleAdmin}
                onResetPassword={(user) => {
                    setSelectedUser(user);
                    setShowResetPasswordModal(true);
                }}
                onDeleteUser={(user) => {
                    setSelectedUser(user);
                    setShowDeleteModal(true);
                }}
            />

            {showResetPasswordModal && (
                <ResetPasswordModal
                    user={selectedUser}
                    onClose={() => {
                        setShowResetPasswordModal(false);
                        setSelectedUser(null);
                    }}
                    onReset={async (password) => {
                        try {
                            await axiosInstance.patch(`/api/users/${selectedUser.id}/password`, { password });
                            setShowResetPasswordModal(false);
                            setSelectedUser(null);
                        } catch (err) {
                            console.error('error resetting password:', err);
                        }
                    }}
                />
            )}

            {showDeleteModal && (
                <DeleteUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedUser(null);
                    }}
                    onDelete={async () => {
                        try {
                            await axiosInstance.delete(`/api/users/${selectedUser.id}`);
                            setShowDeleteModal(false);
                            setSelectedUser(null);
                            await fetchUsers();
                        } catch (err) {
                            console.error('error deleting user:', err);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default UsersTab;