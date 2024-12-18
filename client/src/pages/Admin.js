import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UsersTab from "../components/admin/users/UserTab";
import InviteCodesTab from "../components/admin/invite-codes/InviteCodesTab";
import { Users, Ticket } from 'lucide-react';

export const ADMIN_TABS = [
    {
        id: 'users',
        label: 'Users',
        component: UsersTab,
        icon: Users
    },
    {
        id: 'invites',
        label: 'Invite Codes',
        component: InviteCodesTab,
        icon: Ticket
    }
];

const Admin = () => {
    const [activeTab, setActiveTab] = useState(ADMIN_TABS[0].id);
    const ActiveComponent = ADMIN_TABS.find(tab => tab.id === activeTab)?.component || ADMIN_TABS[0].component;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-8">
                        {ADMIN_TABS.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group relative py-4 px-1 flex items-center gap-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 transition-colors ${
                                            activeTab === tab.id
                                                ? 'text-blue-600'
                                                : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                    />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"
                                            initial={false}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl bg-white shadow"
                    >
                        <ActiveComponent />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Admin;