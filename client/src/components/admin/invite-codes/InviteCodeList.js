import React from 'react';
import InviteCodeCard from './InviteCodeCard';

const InviteCodeList = ({ inviteCodes, onRevokeClick }) => {
    if (inviteCodes.length === 0) {
        return (
            <div className="row g-4">
                <div className="col-12">
                    <div className="card shadow-sm border">
                        <div className="card-body text-center py-5">
                            <h5 className="card-title mb-0 text-muted">No Invite Codes Found</h5>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row g-4">
            {inviteCodes.map((invite) => (
                <div key={invite.code} className="col-12">
                    <InviteCodeCard
                        invite={invite}
                        onRevokeClick={onRevokeClick}
                    />
                </div>
            ))}
        </div>
    );
};

export default InviteCodeList;