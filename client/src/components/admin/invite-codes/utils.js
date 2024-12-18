export const getStatusBadge = (invite) => {
    if (invite.revoked) return { text: 'Revoked', color: 'bg-red-100 text-red-800' };
    if (invite.is_expired) return { text: 'Expired', color: 'bg-yellow-100 text-yellow-800' };
    if (invite.used_by) return { text: 'Used', color: 'bg-green-100 text-green-800' };
    return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
};