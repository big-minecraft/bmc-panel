import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Key, Shield, ShieldOff } from 'lucide-react';

const UserCard = ({ user, onToggleAdmin, onResetPassword, onDeleteUser }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative bg-white rounded-lg border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow transition-all"
        >
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                                {user.username.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                {user.username}
                                {Boolean(user.is_admin) && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Admin
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onResetPassword(user)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Key size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onToggleAdmin(user.id, user.is_admin)}
                            className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                            {user.is_admin ? <ShieldOff size={18} /> : <Shield size={18} />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDeleteUser(user)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserCard;