import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Database} from 'lucide-react';
import DatabasesTab from "../components/databases/DatabasesTab.tsx";

export const BACKUP_TABS = [
    {
        id: 'databases',
        label: 'Databases',
        component: DatabasesTab,
        icon: Database
    },
];

const Backups = () => {
    const [activeTab, setActiveTab] = useState(BACKUP_TABS[0].id);
    const ActiveComponent = BACKUP_TABS.find(tab => tab.id === activeTab)?.component || BACKUP_TABS[0].component;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-8">
                        {BACKUP_TABS.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group relative py-4 px-1 flex items-center gap-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 transition-colors ${
                                            activeTab === tab.id
                                                ? 'text-blue-600'
                                                : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                    />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"
                                            initial={false}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.2}}
                        className="rounded-xl bg-white shadow"
                    >
                        <ActiveComponent/>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Backups;