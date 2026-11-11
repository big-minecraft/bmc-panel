import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import {verifyInviteEndpoint} from "../../../api/auth/verifyInvite";
import {loginEndpoint} from "../../../api/auth/login";
import {logoutEndpoint} from "../../../api/auth/logout";
import {registerEndpoint} from "../../../api/auth/register";
import {verifyLoginEndpoint} from "../../../api/auth/verifyLogin";
import {verifyRegistrationEndpoint} from "../../../api/auth/verifyRegistration";
import {getAuthProvidersEndpoint} from "../../../api/auth/getAuthProviders";
import {oidcStartEndpoint} from "../../../api/auth/oidcStart";
import {oidcCallbackEndpoint} from "../../../api/auth/oidcCallback";
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

// Profile
import {getProfileEndpoint} from "../../../api/profile/getProfile";
import {getSshKeysEndpoint} from "../../../api/profile/getSshKeys";
import {addSshKeyEndpoint} from "../../../api/profile/addSshKey";
import {deleteSshKeyEndpoint} from "../../../api/profile/deleteSshKey";

// File Sessions
import {createSessionEndpoint} from "../../../api/files/session/createSession";
import {endSessionEndpoint} from "../../../api/files/session/endSession";
import {getSessionStatusEndpoint} from "../../../api/files/session/getSessionStatus";
import {listSessionsEndpoint} from "../../../api/files/session/listSessions";
import {refreshSessionEndpoint} from "../../../api/files/session/refreshSession";
import {internalRefreshSessionEndpoint} from "../../../api/files/session/internalRefreshSession";

// File Operations
import {listFilesEndpoint} from "../../../api/files/listFiles";
import {getFileContentEndpoint} from "../../../api/files/getFileContent";
import {createFileEndpoint} from "../../../api/files/createFile";
import {updateFileEndpoint} from "../../../api/files/updateFile";
import {deletePathsEndpoint} from "../../../api/files/deletePaths";
import {createDirectoryEndpoint} from "../../../api/files/createDirectory";
import {moveFileEndpoint} from "../../../api/files/moveFile";
import {uploadFilesEndpoint} from "../../../api/files/uploadFiles";
import {createDownloadTokenEndpoint} from "../../../api/files/createDownloadToken";
import {downloadFileEndpoint} from "../../../api/files/downloadFile";
import {archiveEndpoint} from "../../../api/files/archive";
import {unarchiveFileEndpoint} from "../../../api/files/unarchive";


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
        this.addEndpoint(getAuthProvidersEndpoint);
        this.addEndpoint(oidcStartEndpoint);
        this.addEndpoint(oidcCallbackEndpoint);

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

        //Profile
        this.addEndpoint(getProfileEndpoint);
        this.addEndpoint(getSshKeysEndpoint);
        this.addEndpoint(addSshKeyEndpoint);
        this.addEndpoint(deleteSshKeyEndpoint);

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
        this.addEndpoint(listFilesEndpoint);
        this.addEndpoint(getFileContentEndpoint);
        this.addEndpoint(createFileEndpoint);
        this.addEndpoint(updateFileEndpoint);
        this.addEndpoint(deletePathsEndpoint);
        this.addEndpoint(createDirectoryEndpoint);
        this.addEndpoint(moveFileEndpoint);
        this.addEndpoint(uploadFilesEndpoint);
        this.addEndpoint(createDownloadTokenEndpoint);
        this.addEndpoint(downloadFileEndpoint);
        this.addEndpoint(archiveEndpoint);
        this.addEndpoint(unarchiveFileEndpoint);
    }

    private setupMiddleware() {
        this.router.use(express.json({ limit: '16mb' }));

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
