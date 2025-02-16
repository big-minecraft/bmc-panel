import {motion, AnimatePresence} from 'framer-motion';
import InviteCodeCard from './InviteCodeCard';

const InviteCodeList = ({inviteCodes, onRevokeClick}) => {
    if (inviteCodes.length === 0) {
        return (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
                <div className="p-12 text-center">
                    <h5 className="text-xl font-medium text-gray-500">No Invite Codes Found</h5>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="space-y-4"
        >
            <AnimatePresence>
                {inviteCodes.map((invite) => (
                    <motion.div
                        key={invite.code}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.2}}
                    >
                        <InviteCodeCard
                            invite={invite}
                            onRevokeClick={onRevokeClick}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default InviteCodeList;