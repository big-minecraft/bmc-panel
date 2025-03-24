import CreateNewButton from '../actions/CreateNewButton';
import UploadButton from '../actions/UploadButton';
import SyncStatus from '../actions/SyncStatus';
import React from "react";
import {useSFTPState} from "../../context/SFTPContext.tsx";
import {Enum} from "../../../../../../shared/enum/enum.ts";

const ActionButtons = () => {
    const { currentDirectoryDeploymentType } = useSFTPState();

    return (
        <div className="flex items-center gap-3 ml-4">

            {currentDirectoryDeploymentType !== Enum.DeploymentType.PERSISTENT.identifier && <SyncStatus />}
            <UploadButton />
            <CreateNewButton />
        </div>
    );
};

export default ActionButtons;