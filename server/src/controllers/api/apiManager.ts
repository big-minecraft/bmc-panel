import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Types } from "mongoose";
import {verifyInviteEndpoint} from "../../api/auth/endpoints/verifyInvite";
import {loginEndpoint} from "../../api/auth/endpoints/login";
import {logoutEndpoint} from "../../api/auth/endpoints/logout";
import {registerEndpoint} from "../../api/auth/endpoints/register";
import {verifyLoginEndpoint} from "../../api/auth/endpoints/verifyLogin";
import {verifyRegistrationEndpoint} from "../../api/auth/endpoints/verifyRegistration";
import {createK8sTokenEndpoint} from "../../api/admin/endpoints/createK8sToken";
import {getK8sTokenEndpoint} from "../../api/admin/endpoints/getK8sToken";
import {deleteK8sTokenEndpoint} from "../../api/admin/endpoints/deleteK8sToken";
import {listMongoEndpoint} from "../../api/database/endpoints/listMongo";
import {createMongoEndpoint} from "../../api/database/endpoints/createMongo";
import {deleteMongoEndpoint} from "../../api/database/endpoints/deleteMongo";
import {resetMongoPasswordEndpoint} from "../../api/database/endpoints/resetMongoPassword";
import {listSqlEndpoint} from "../../api/database/endpoints/listSql";
import {createSqlEndpoint} from "../../api/database/endpoints/createSql";
import {deleteSqlEndpoint} from "../../api/database/endpoints/deleteSql";
import {resetSqlPasswordEndpoint} from "../../api/database/endpoints/resetSqlPassword";
import {createDeploymentEndpoint} from "../../api/deployments/endpoints/createDeployment";
import {deleteDeploymentEndpoint} from "../../api/deployments/endpoints/deleteDeployment";
import {restartDeploymentEndpoint} from "../../api/deployments/endpoints/restartDeployment";
import {toggleDeploymentEndpoint} from "../../api/deployments/endpoints/toggleDeployment";
import {updateDeploymentContentEndpoint} from "../../api/deployments/endpoints/updateDeploymentContent";
import {getDeploymentContentEndpoint} from "../../api/deployments/endpoints/getDeploymentContent";
import {getProxyEndpoint} from "../../api/proxy/endpoints/getProxy";
import {getProxyContentEndpoint} from "../../api/proxy/endpoints/getProxyContent";
import {restartProxyEndpoint} from "../../api/proxy/endpoints/restartProxy";
import {updateProxyContentEndpoint} from "../../api/proxy/endpoints/updateProxyContent";
import {createInviteCodeEndpoint} from "../../api/invite-codes/endpoints/createInviteCode";
import {revokeInviteCodeEndpoint} from "../../api/invite-codes/endpoints/revokeInviteCode";
import {getInviteCodesEndpoint} from "../../api/invite-codes/endpoints/getInviteCodes";
import {getUsersEndpoint} from "../../api/users/endpoints/getUsers";
import {setAdminEndpoint} from "../../api/users/endpoints/setAdmin";
import {resetPasswordEndpoint} from "../../api/users/endpoints/resetPassword";
import {deleteUserEndpoint} from "../../api/users/endpoints/deleteUser";
import {getInstancesEndpoint} from "../../api/network/endpoints/getInstances";
import {getProxiesEndpoint} from "../../api/network/endpoints/getProxies";
import {getNodesEndpoint} from "../../api/network/endpoints/getNodes";
import {getCpuMetricsEndpoint} from "../../api/metrics/endpoints/getCpuMetrics";
import {getMemoryMetricsEndpoint} from "../../api/metrics/endpoints/getMemoryMetrics";
import {archiveFileEndpoint} from "../../api/sftp/endpoints/archiveFile";
import {archiveMultipleEndpoint} from "../../api/sftp/endpoints/archiveMultiple";
import {createDirectoryEndpoint} from "../../api/sftp/endpoints/createDirectory";
import {createFileEndpoint} from "../../api/sftp/endpoints/createFile";
import {deleteDirectoryEndpoint} from "../../api/sftp/endpoints/deleteDirectory";
import {downloadFileEndpoint} from "../../api/sftp/endpoints/downloadFile";
import {deleteFileEndpoint} from "../../api/sftp/endpoints/deleteFile";
import {downloadMultipleEndpoint} from "../../api/sftp/endpoints/downloadMultiple";
import {getFileContentEndpoint} from "../../api/sftp/endpoints/getFileContent";
import {getFilesEndpoint} from "../../api/sftp/endpoints/getFiles";
import {unarchiveFileEndpoint} from "../../api/sftp/endpoints/unarchiveFile";
import {updateFileContentEndpoint} from "../../api/sftp/endpoints/updateFileContent";
import {uploadMultipleEndpoint} from "../../api/sftp/endpoints/uploadFiles";
import {moveFileEndpoint} from "../../api/sftp/endpoints/moveFile";
import {getDeploymentsEndpoint} from "../../api/deployments/endpoints/getDeployments";
import {toggleProxyEndpoint} from "../../api/proxy/endpoints/toggleProxy";
import {AuthType} from "../../api/types";
import {handleAdminAuth, handleBasicAuth} from "../../middleware/auth";

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

        //Network
        this.addEndpoint(getInstancesEndpoint);
        this.addEndpoint(getProxiesEndpoint);
        this.addEndpoint(getNodesEndpoint);

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
