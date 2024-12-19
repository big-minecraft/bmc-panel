import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from './UserCard.js';
import { UserX } from 'lucide-react';

const UsersList = ({ users, onToggleAdmin, onResetPassword, onDeleteUser }) => {
    if (!users.length) {
        return (
            <div className="text-center py-12">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Users Found</h3>
                <p className="text-gray-500">No users match your current filters.</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <AnimatePresence>
                {users.map((user) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <UserCard
                            user={user}
                            onToggleAdmin={onToggleAdmin}
                            onResetPassword={onResetPassword}
                            onDeleteUser={onDeleteUser}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default UsersList;