import { useState } from 'react';
import { Send } from 'lucide-react';
import { useSFTPState } from '../../context/SFTPContext';
import { useDeployButton } from '../../context/DeployButtonContext.tsx';

const DeployButton = ({ disabled = false }) => {
    const [isDeploying, setIsDeploying] = useState(false);
    const { isVisible } = useDeployButton();

    const { currentDirectory } = useSFTPState();
    const parts = currentDirectory.split('/').filter(Boolean);

    const handleDeploy = () => {
        if (disabled || isDeploying) return;

        console.log(currentDirectory)
        console.log(parts)

        setIsDeploying(true);

        setTimeout(() => {
            setIsDeploying(false);
        }, 2000);
    };

    if (!isVisible) return null;

    return (
        <div className="relative">
            <button
                onClick={handleDeploy}
                disabled={disabled || isDeploying}
                className="h-12 px-4 flex items-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-all disabled:opacity-75"
            >
                <Send size={20} className="mr-2" />
                <span className="text-sm font-medium">
                    {isDeploying ? 'Deploying...' : 'Deploy Changes'}
                </span>
            </button>
        </div>
    );
};

export default DeployButton;