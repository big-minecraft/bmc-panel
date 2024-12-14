import React from 'react';
import UserCard from './UserCard';

const UsersList = ({ users, onToggleAdmin, onResetPassword, onDeleteUser }) => {
    return (
        <div className="row g-4">
            {users.map((user) => (
                <div key={user.id} className="col-12">
                    <UserCard
                        user={user}
                        onToggleAdmin={onToggleAdmin}
                        onResetPassword={onResetPassword}
                        onDeleteUser={onDeleteUser}
                    />
                </div>
            ))}
        </div>
    );
};

export default UsersList;