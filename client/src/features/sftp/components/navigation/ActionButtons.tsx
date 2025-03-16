import CreateNewButton from '../actions/CreateNewButton';
import UploadButton from '../actions/UploadButton';
import DeployButton from "../actions/DeployButton.tsx";

const ActionButtons = () => {
    return (
        <div className="flex items-center gap-3 ml-4">
            <DeployButton/>
            <CreateNewButton/>
            <UploadButton/>
        </div>
    );
};

export default ActionButtons;