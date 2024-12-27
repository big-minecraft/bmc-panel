export const InstanceState = {
    STARTING: {
        key: 'STARTING',
        display: 'Starting Up',
        color: 'text-yellow-500'
    },
    RUNNING: {
        key: 'RUNNING',
        display: 'Online',
        color: 'text-green-500'
    },
    BLOCKED: {
        key: 'BLOCKED',
        display: 'Blocked',
        color: 'text-red-500'
    },
    STOPPING: {
        key: 'STOPPING',
        display: 'Shutting Down',
        color: 'text-orange-500'
    },
    STOPPED: {
        key: 'STOPPED',
        display: 'Offline',
        color: 'text-gray-500'
    }
};

export const getInstanceStateDetails = (state) => {
    return InstanceState[state] || {
        key: state,
        display: state,
        color: 'text-gray-600'
    };
};
