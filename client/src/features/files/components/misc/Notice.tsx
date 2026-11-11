import {useEffect} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {CheckCircle, X, XCircle} from 'lucide-react';
import {useFilesDispatch, useFilesState} from '../../context/FilesContext';

const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200'
};

const Notice = () => {
    const {notice} = useFilesState();
    const dispatch = useFilesDispatch();

    useEffect(() => {
        if (!notice) return;

        const timer = window.setTimeout(
            () => dispatch({type: 'SET_NOTICE', payload: null}),
            notice.type === 'error' ? 8000 : 4000
        );

        return () => window.clearTimeout(timer);
    }, [notice, dispatch]);

    return (
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
            <AnimatePresence>
                {notice && (
                    <motion.div
                        key={notice.id}
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className={`${styles[notice.type]} px-4 py-3 rounded-lg border shadow-sm flex items-start max-w-md`}
                        role="alert"
                    >
                        {notice.type === 'error'
                            ? <XCircle size={18} className="mt-0.5 mr-2 shrink-0"/>
                            : <CheckCircle size={18} className="mt-0.5 mr-2 shrink-0"/>}
                        <span className="text-sm font-medium break-words">{notice.message}</span>
                        <button
                            className="ml-4 text-gray-400 hover:text-gray-600 shrink-0"
                            onClick={() => dispatch({type: 'SET_NOTICE', payload: null})}
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Notice;
