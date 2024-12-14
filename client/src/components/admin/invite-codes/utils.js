export const getStatusBadge = (invite) => {
    if (invite.revoked) return { text: 'Revoked', color: 'bg-danger' };
    if (invite.is_expired) return { text: 'Expired', color: 'bg-warning' };
    if (invite.used_by) return { text: 'Used', color: 'bg-success' };
    return { text: 'Active', color: 'bg-primary' };
};