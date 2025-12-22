import {useState} from 'react';
import {Plus} from 'lucide-react';
import CreateModal from './CreateModal';

const CreateNewButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="h-12 px-4 flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all"
            >
                <Plus size={20} className="mr-2"/>
                <span className="text-sm font-medium">Create New</span>
            </button>
            <CreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default CreateNewButton;