import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import UsersTab from "../components/users/UserTab";
import InviteCodesTab from '../components/inviteCodesTab'

export const ADMIN_TABS = [
    {
        id: 'users',
        label: 'Users',
        component: UsersTab
    },
    {
        id: 'invites',
        label: 'Invite Codes',
        component: InviteCodesTab
    }
]

const Admin = () => {
    const [activeTab, setActiveTab] = useState(ADMIN_TABS[0].id)
    const ActiveComponent = ADMIN_TABS.find(tab => tab.id === activeTab)?.component || ADMIN_TABS[0].component

    return (
        <div className="container py-4">
            <ul className="nav nav-tabs mb-4">
                {ADMIN_TABS.map(tab => (
                    <li key={tab.id} className="nav-item">
                        <button
                            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
            <ActiveComponent />
        </div>
    )
}

export default Admin