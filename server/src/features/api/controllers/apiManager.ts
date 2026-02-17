import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import {verifyInviteEndpoint} from "../../../api/auth/verifyInvite";
import {loginEndpoint} from "../../../api/auth/login";
import {logoutEndpoint} from "../../../api/auth/logout";
import {registerEndpoint} from "../../../api/auth/register";
import {verifyLoginEndpoint} from "../../../api/auth/verifyLogin";
import {verifyRegistrationEndpoint} from "../../../api/auth/verifyRegistration";
import {listMongoEndpoint} from "../../../api/database/listMongo";
import {createMongoEndpoint} from "../../../api/database/createMongo";
import {deleteMongoEndpoint} from "../../../api/database/deleteMongo";
import {resetMongoPasswordEndpoint} from "../../../api/database/resetMongoPassword";
import {listSqlEndpoint} from "../../../api/database/listSql";
import {createSqlEndpoint} from "../../../api/database/createSql";
import {deleteSqlEndpoint} from "../../../api/database/deleteSql";
import {resetSqlPasswordEndpoint} from "../../../api/database/resetSqlPassword";
import {createDeploymentEndpoint} from "../../../api/deployments/createDeployment";
import {deleteDeploymentEndpoint} from "../../../api/deployments/deleteDeployment";
import {restartDeploymentEndpoint} from "../../../api/deployments/restartDeployment";
import {toggleDeploymentEndpoint} from "../../../api/deployments/toggleDeployment";
import {updateDeploymentContentEndpoint} from "../../../api/deployments/updateDeploymentContent";
import {getDeploymentContentEndpoint} from "../../../api/deployments/getDeploymentContent";
import {createInviteCodeEndpoint} from "../../../api/invite-codes/createInviteCode";
import {revokeInviteCodeEndpoint} from "../../../api/invite-codes/revokeInviteCode";
import {getInviteCodesEndpoint} from "../../../api/invite-codes/getInviteCodes";
import {getUsersEndpoint} from "../../../api/users/getUsers";
import {setAdminEndpoint} from "../../../api/users/setAdmin";
import {resetPasswordEndpoint} from "../../../api/users/resetPassword";
import {deleteUserEndpoint} from "../../../api/users/deleteUser";
import {getCpuMetricsEndpoint} from "../../../api/metrics/getCpuMetrics";
import {getMemoryMetricsEndpoint} from "../../../api/metrics/getMemoryMetrics";
import {getInstanceMetricsEndpoint} from "../../../api/metrics/getInstanceMetrics";
import {getDeploymentsEndpoint} from "../../../api/deployments/getDeployments";
import {ApiEndpoint, AuthType} from "../../../api/types";
import {handleAdminAuth, handleBasicAuth, handleServiceTokenAuth} from "../../../middleware/auth";
import {getDeploymentInstancesEndpoint} from "../../../api/deployments/getDeploymentInstances";
import {getManagerTimestampEndpoint} from "../../../api/network/getManagerTimestamp";

// File Sessions
import {createSessionEndpoint} from "../../../api/files/session/createSession";
import {endSessionEndpoint} from "../../../api/files/session/endSession";
import {getSessionStatusEndpoint} from "../../../api/files/session/getSessionStatus";
import {listSessionsEndpoint} from "../../../api/files/session/listSessions";
import {refreshSessionEndpoint} from "../../../api/files/session/refreshSession";
import {internalRefreshSessionEndpoint} from "../../../api/files/session/internalRefreshSession";

// File Operations
import {listFilesEndpoint as listFilesNewEndpoint} from "../../../api/files/listFiles";
import {getFileContentEndpoint as getFileContentNewEndpoint} from "../../../api/files/getFileContent";
import {createFileEndpoint as createFileNewEndpoint} from "../../../api/files/createFile";
import {updateFileEndpoint} from "../../../api/files/updateFile";
import {deleteFileEndpoint as deleteFileNewEndpoint} from "../../../api/files/deleteFile";
import {createDirectoryEndpoint as createDirectoryNewEndpoint} from "../../../api/files/createDirectory";
import {deleteDirectoryEndpoint as deleteDirectoryNewEndpoint} from "../../../api/files/deleteDirectory";
import {moveFileEndpoint as moveFileNewEndpoint} from "../../../api/files/moveFile";
import {uploadFilesEndpoint} from "../../../api/files/uploadFiles";
import {downloadFileEndpoint as downloadFileNewEndpoint} from "../../../api/files/downloadFile";
import {downloadMultipleEndpoint as downloadMultipleNewEndpoint} from "../../../api/files/downloadMultiple";
import {archiveFileEndpoint as archiveFileNewEndpoint} from "../../../api/files/archiveFile";
import {archiveMultipleEndpoint} from "../../../api/files/archiveMultiple";
import {unarchiveFileEndpoint as unarchiveFileNewEndpoint} from "../../../api/files/unarchiveFile";


export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpoint[] = [];

    private constructor() {
        this.router = express.Router();
        this.setupMiddleware();
        this.registerEndpoints();
    }

    private registerEndpoints() {

        //Auth
        this.addEndpoint(loginEndpoint);
        this.addEndpoint(logoutEndpoint);
        this.addEndpoint(registerEndpoint);
        this.addEndpoint(verifyInviteEndpoint);
        this.addEndpoint(verifyLoginEndpoint);
        this.addEndpoint(verifyRegistrationEndpoint);

        //Admin

        //Database
        this.addEndpoint(listMongoEndpoint);
        this.addEndpoint(createMongoEndpoint);
        this.addEndpoint(deleteMongoEndpoint);
        this.addEndpoint(resetMongoPasswordEndpoint);
        this.addEndpoint(listSqlEndpoint);
        this.addEndpoint(createSqlEndpoint);
        this.addEndpoint(deleteSqlEndpoint);
        this.addEndpoint(resetSqlPasswordEndpoint);

        //Deployments
        this.addEndpoint(getDeploymentsEndpoint);
        this.addEndpoint(createDeploymentEndpoint);
        this.addEndpoint(deleteDeploymentEndpoint);
        this.addEndpoint(restartDeploymentEndpoint);
        this.addEndpoint(toggleDeploymentEndpoint);
        this.addEndpoint(updateDeploymentContentEndpoint);
        this.addEndpoint(getDeploymentContentEndpoint);
        this.addEndpoint(updateDeploymentContentEndpoint);
        this.addEndpoint(getDeploymentInstancesEndpoint);

        //Network
        this.addEndpoint(getManagerTimestampEndpoint);

        //Invite Codes
        this.addEndpoint(createInviteCodeEndpoint);
        this.addEndpoint(revokeInviteCodeEndpoint);
        this.addEndpoint(getInviteCodesEndpoint);

        //Users
        this.addEndpoint(getUsersEndpoint);
        this.addEndpoint(setAdminEndpoint);
        this.addEndpoint(resetPasswordEndpoint);
        this.addEndpoint(deleteUserEndpoint);

        //Metrics
        this.addEndpoint(getCpuMetricsEndpoint);
        this.addEndpoint(getMemoryMetricsEndpoint);
        this.addEndpoint(getInstanceMetricsEndpoint);

        //File Sessions
        this.addEndpoint(createSessionEndpoint);
        this.addEndpoint(endSessionEndpoint);
        this.addEndpoint(getSessionStatusEndpoint);
        this.addEndpoint(listSessionsEndpoint);
        this.addEndpoint(refreshSessionEndpoint);
        this.addEndpoint(internalRefreshSessionEndpoint);

        //File Operations (PVC)
        this.addEndpoint(listFilesNewEndpoint);
        this.addEndpoint(getFileContentNewEndpoint);
        this.addEndpoint(createFileNewEndpoint);
        this.addEndpoint(updateFileEndpoint);
        this.addEndpoint(deleteFileNewEndpoint);
        this.addEndpoint(createDirectoryNewEndpoint);
        this.addEndpoint(deleteDirectoryNewEndpoint);
        this.addEndpoint(moveFileNewEndpoint);
        this.addEndpoint(uploadFilesEndpoint);
        this.addEndpoint(downloadFileNewEndpoint);
        this.addEndpoint(downloadMultipleNewEndpoint);
        this.addEndpoint(archiveFileNewEndpoint);
        this.addEndpoint(archiveMultipleEndpoint);
        this.addEndpoint(unarchiveFileNewEndpoint);
    }

    private setupMiddleware() {
        this.router.use(express.json());

        this.router.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });

        this.router.use((req, res, next) => {
            if (!req.path.startsWith('/api')) {
                next();
                return;
            }

            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            next();
        });

        this.router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
    }

    private addEndpoint<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>) {
        this.endpoints.push(endpoint);

        const handlers: RequestHandler[] = [];

        if (endpoint.auth === AuthType.Basic) {
            handlers.push(handleBasicAuth);
        } else if (endpoint.auth === AuthType.Admin) {
            handlers.push(handleAdminAuth);
        } else if (endpoint.auth === AuthType.ServiceToken) {
            handlers.push(handleServiceTokenAuth);
        }

        handlers.push(endpoint.handler);

        this.router[endpoint.method](endpoint.path, ...handlers);
        console.log(`registered api endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    getRouter(): Router {
        return this.router;
    }

    static getInstance(): ApiManager {
        if (!ApiManager.instance) {
            ApiManager.instance = new ApiManager();
        }
        return ApiManager.instance;
    }
}
