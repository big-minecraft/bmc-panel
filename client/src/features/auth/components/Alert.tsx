import {motion} from 'framer-motion';
import {AlertTriangle} from 'lucide-react';

export const Alert = ({message}) => {
    return (
        <motion.div
            initial={{opacity: 0, height: 0}}
            animate={{opacity: 1, height: 'auto'}}
            exit={{opacity: 0, height: 0}}
            className="rounded-lg bg-red-50 p-4 mb-6"
        >
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400"/>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">{message}</p>
                </div>
            </div>
        </motion.div>
    );
};