import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import InviteCodesTab from '../components/inviteCodesTab';
import UsersTab from '../components/usersTab';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="container py-4">
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'invites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invites')}
                    >
                        Invite Codes
                    </button>
                </li>
            </ul>

            {activeTab === 'users' ? <UsersTab /> : <InviteCodesTab />}
        </div>
    );
};

export default AdminPage;