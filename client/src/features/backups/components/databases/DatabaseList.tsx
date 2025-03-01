import {motion, AnimatePresence} from 'framer-motion';
import DatabaseCard from './DatabaseCard.tsx';

const DatabaseList = ({databases}) => {
    if (databases.length === 0) {
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

    const onViewBackups = (bac) => {

    }

    const onRestoreBackup = (backup) => {

    }

    const onDownloadBackup = (backup) => {

    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="space-y-4"
        >
            <AnimatePresence>
                {databases.map((database) => (
                    <motion.div
                        key={database.name}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.2}}
                    >
                        <DatabaseCard
                            database={database}
                            onViewBackups={onViewBackups}
                            onRestoreBackup={onRestoreBackup}
                            onDownloadBackup={onDownloadBackup}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default DatabaseList;