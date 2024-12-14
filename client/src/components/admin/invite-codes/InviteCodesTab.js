import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from "../../../utils/auth";
import InviteCodeList from './InviteCodeList';
import CreateInviteModal from './CreateInviteModal';
import RevokeInviteModal from './RevokeInviteModal';
import LoadingSpinner from '../../common/LoadingSpinner';

const InviteCodesTab = () => {
    const [inviteCodes, setInviteCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [codeToRevoke, setCodeToRevoke] = useState(null);

    useEffect(() => {
        fetchInviteCodes();
    }, []);

    const fetchInviteCodes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/invite-codes');
            console.log('fetched invite codes:', response.data);
            setInviteCodes(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load invite codes');
            console.error('error fetching invite codes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (message) => {
        try {
            await axiosInstance.post('/api/invite-codes', { message });
            setShowCreateModal(false);
            await fetchInviteCodes();
        } catch (err) {
            console.error('error creating invite code:', err);
        }
    };

    const handleRevoke = async (code) => {
        try {
            await axiosInstance.delete(`/api/invite-codes/${code}`);
            setCodeToRevoke(null);
            await fetchInviteCodes();
        } catch (err) {
            console.error('error revoking invite code:', err);
        }
    };

    if (isLoading) return <LoadingSpinner />;

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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6 mb-0">Invite Codes</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Invite Code
                </button>
            </div>

            <InviteCodeList
                inviteCodes={inviteCodes}
                onRevokeClick={setCodeToRevoke}
            />

            <CreateInviteModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreate}
            />

            <RevokeInviteModal
                code={codeToRevoke}
                onClose={() => setCodeToRevoke(null)}
                onRevoke={handleRevoke}
            />
        </div>
    );
};

export default InviteCodesTab;