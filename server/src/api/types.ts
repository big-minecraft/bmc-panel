import { Request, Response } from 'express';
import { Types } from "mongoose";
import {ApiRequest} from "../controllers/api/apiManager";

interface MulterFile {
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
}