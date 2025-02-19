import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Types } from "mongoose";
import {verifyInviteEndpoint} from "../../api/auth/verifyInvite";
import {loginEndpoint} from "../../api/auth/login";
import {logoutEndpoint} from "../../api/auth/logout";
import {registerEndpoint} from "../../api/auth/register";
import {verifyLoginEndpoint} from "../../api/auth/verifyLogin";
import {verifyRegistrationEndpoint} from "../../api/auth/verifyRegistration";
import {createK8sTokenEndpoint} from "../../api/admin/createK8sToken";
import {getK8sTokenEndpoint} from "../../api/admin/getK8sToken";
import {deleteK8sTokenEndpoint} from "../../api/admin/deleteK8sToken";
import {listMongoEndpoint} from "../../api/database/listMongo";
import {createMongoEndpoint} from "../../api/database/createMongo";
import {deleteMongoEndpoint} from "../../api/database/deleteMongo";
import {resetMongoPasswordEndpoint} from "../../api/database/resetMongoPassword";
import {listSqlEndpoint} from "../../api/database/listSql";
import {createSqlEndpoint} from "../../api/database/createSql";
import {deleteSqlEndpoint} from "../../api/database/deleteSql";
import {resetSqlPasswordEndpoint} from "../../api/database/resetSqlPassword";
import {createDeploymentEndpoint} from "../../api/deployments/createDeployment";
import {deleteDeploymentEndpoint} from "../../api/deployments/deleteDeployment";
import {restartDeploymentEndpoint} from "../../api/deployments/restartDeployment";
import {toggleDeploymentEndpoint} from "../../api/deployments/toggleDeployment";
import {updateDeploymentContentEndpoint} from "../../api/deployments/updateDeploymentContent";
import {getDeploymentContentEndpoint} from "../../api/deployments/getDeploymentContent";
import {getProxyEndpoint} from "../../api/proxy/getProxy";
import {getProxyContentEndpoint} from "../../api/proxy/getProxyContent";
import {restartProxyEndpoint} from "../../api/proxy/restartProxy";
import {updateProxyContentEndpoint} from "../../api/proxy/updateProxyContent";
import {createInviteCodeEndpoint} from "../../api/invite-codes/createInviteCode";
import {revokeInviteCodeEndpoint} from "../../api/invite-codes/revokeInviteCode";
import {getInviteCodesEndpoint} from "../../api/invite-codes/getInviteCodes";
import {getUsersEndpoint} from "../../api/users/getUsers";
import {setAdminEndpoint} from "../../api/users/setAdmin";
import {resetPasswordEndpoint} from "../../api/users/resetPassword";
import {deleteUserEndpoint} from "../../api/users/deleteUser";
import {getCpuMetricsEndpoint} from "../../api/metrics/getCpuMetrics";
import {getMemoryMetricsEndpoint} from "../../api/metrics/getMemoryMetrics";
import {archiveFileEndpoint} from "../../api/sftp/archiveFile";
import {archiveMultipleEndpoint} from "../../api/sftp/archiveMultiple";
import {createDirectoryEndpoint} from "../../api/sftp/createDirectory";
import {createFileEndpoint} from "../../api/sftp/createFile";
import {deleteDirectoryEndpoint} from "../../api/sftp/deleteDirectory";
import {downloadFileEndpoint} from "../../api/sftp/downloadFile";
import {deleteFileEndpoint} from "../../api/sftp/deleteFile";
import {downloadMultipleEndpoint} from "../../api/sftp/downloadMultiple";
import {getFileContentEndpoint} from "../../api/sftp/getFileContent";
import {getFilesEndpoint} from "../../api/sftp/getFiles";
import {unarchiveFileEndpoint} from "../../api/sftp/unarchiveFile";
import {updateFileContentEndpoint} from "../../api/sftp/updateFileContent";
import {uploadMultipleEndpoint} from "../../api/sftp/uploadFiles";
import {moveFileEndpoint} from "../../api/sftp/moveFile";
import {getDeploymentsEndpoint} from "../../api/deployments/getDeployments";
import {toggleProxyEndpoint} from "../../api/proxy/toggleProxy";
import {AuthType} from "../../api/types";
import {handleAdminAuth, handleBasicAuth} from "../../middleware/auth";
import {getK8sDashboardHostEndpoint} from "../../api/admin/getK8sDashboardHost";
import {getNodesEndpoint} from "../../api/network/getNodes";
import {getDeploymentInstancesEndpoint} from "../../api/deployments/getDeploymentInstances";

export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

export interface ApiRequest<TReq> extends Request {
    body: TReq;
    auth?: {
        authId: Types.ObjectId;
        userId?: Types.ObjectId;
    };
    user?: any;
    files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    file?: MulterFile;
}

export interface ApiResponse<TRes> extends Response {
    json: (body: ApiResponseBody<TRes>) => this;
}

export interface ApiResponseBody<TRes> {
    success: boolean;
    data?: TRes;
    error?: string;
}

export interface ApiEndpoint<TReq = unknown, TRes = unknown> {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    auth: AuthType;
    handler: (req: ApiRequest<TReq>, res: ApiResponse<TRes>) => Promise<void>;
}

export default class ApiManager {
    private static instance: ApiManager;
    private readonly router: Router;
    private endpoints: ApiEndpoint<any, any>[] = [];

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
        this.addEndpoint(createK8sTokenEndpoint);
        this.addEndpoint(deleteK8sTokenEndpoint);
        this.addEndpoint(getK8sDashboardHostEndpoint);
        this.addEndpoint(getK8sTokenEndpoint);

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
        this.addEndpoint(getNodesEndpoint);

        //Proxy
        this.addEndpoint(getProxyEndpoint);
        this.addEndpoint(getProxyContentEndpoint);
        this.addEndpoint(updateProxyContentEndpoint);
        this.addEndpoint(restartProxyEndpoint);
        this.addEndpoint(toggleProxyEndpoint);

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

        //SFTP
        this.addEndpoint(archiveFileEndpoint);
        this.addEndpoint(archiveMultipleEndpoint);
        this.addEndpoint(createDirectoryEndpoint);
        this.addEndpoint(createFileEndpoint);
        this.addEndpoint(deleteDirectoryEndpoint);
        this.addEndpoint(deleteFileEndpoint);
        this.addEndpoint(downloadFileEndpoint);
        this.addEndpoint(downloadMultipleEndpoint);
        this.addEndpoint(getFileContentEndpoint);
        this.addEndpoint(getFilesEndpoint);
        this.addEndpoint(moveFileEndpoint);
        this.addEndpoint(unarchiveFileEndpoint);
        this.addEndpoint(updateFileContentEndpoint);
        this.addEndpoint(uploadMultipleEndpoint);
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
