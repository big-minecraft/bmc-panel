import { Request, Response } from 'express';
import {Types} from "mongoose";

// export interface MulterFile {
//     fieldname: string;
//     originalname: string;
//     encoding: string;
//     mimetype: string;
//     size: number;
//     destination: string;
//     filename: string;
//     path: string;
//     buffer: Buffer;
// }

export interface ApiRequest<TReq> extends Request {
    body: TReq;
    auth?: {
        authId: Types.ObjectId;
        userId?: Types.ObjectId;
    };
    user?: any;
    // files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    // file?: MulterFile;
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

export enum AuthType {
    None = 'none',
    Basic = 'basic',
    Admin = 'admin',
    ServiceToken = 'service-token',
}