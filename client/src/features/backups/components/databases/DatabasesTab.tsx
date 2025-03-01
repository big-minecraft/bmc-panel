import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import axiosInstance from "../../../../utils/auth";
import DatabaseList from './DatabaseList.tsx';
import LoadingSpinner from '../../../../common/zold/LoadingSpinner';
import {Plus, Search} from 'lucide-react';

const DatabasesTab = () => {
    const [databases, setDatabases] = useState([]);
    const [filteredDatabases, setFilteredDatabases] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInviteCodes();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredDatabases(databases);
            return;
        }

        const filtered = databases.filter(code =>
            code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (code.used_by && code.used_by.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredDatabases(filtered);
    }, [searchTerm, databases]);

    const fetchInviteCodes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/database/sql');
            setDatabases(response.data.data.databases);
            setFilteredDatabases(response.data.data.databases);
            setError(null);
        } catch (err) {
            setError('Failed to load invite codes');
            console.error('error fetching invite codes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingSpinner/>;

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                    <input
                        type="text"
                        placeholder="Search invite codes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <motion.button
                    whileHover={{scale: 1.02}}
                    whileTap={{scale: 0.98}}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18}/>
                    Create Code
                </motion.button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
                    {error}
                </div>
            )}

            <DatabaseList
                databases={filteredDatabases}/>
        </div>
    );
};

export default DatabasesTab;