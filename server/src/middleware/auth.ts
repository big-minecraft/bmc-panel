import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiRequest, ApiResponse } from "../api/types";
import ConfigManager from "../features/config/controllers/configManager";
import configManager from "../features/config/controllers/configManager";
import KubernetesService from "../services/kubernetesService";
import DatabaseService from "../services/databaseService";

export const hasValidBasicAuth = async (token: string): Promise<boolean> => {
    try {
        await verifyTokenWithBasicAuth(token);
        return true;
    } catch (err) {
        return false;
    }
};

export const hasValidAdminAuth = async (token: string): Promise<boolean> => {
    try {
        await verifyTokenWithAdminAuth(token);
        return true;
    } catch (err) {
        return false;
    }
};

export const verifyTokenWithBasicAuth = async (token: string): Promise<any> => {
    const decoded = jwt.verify(token, ConfigManager.getString("panel-secret"));
    const user = decoded.username;

    const dbUser = await DatabaseService.getInstance().getUser(user);
    const last_logout = dbUser.last_logout;

    if (last_logout) {
        const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;

        if (decoded.iat < lastLogoutTimestamp && KubernetesService.getInstance().isRunningInCluster()) {
            throw new Error('Token has expired');
        }
    }

    return decoded;
};

export const verifyTokenWithAdminAuth = async (token: string): Promise<any> => {
    const decoded = jwt.verify(token, configManager.getString("panel-secret"));
    const user = decoded.username;

    const dbUser = await DatabaseService.getInstance().getUser(user);
    const last_logout = dbUser.last_logout;

    if (last_logout) {
        const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;

        if (decoded.iat < lastLogoutTimestamp && KubernetesService.getInstance().isRunningInCluster()) {
            throw new Error('Token has expired');
        }
    }

    if (!dbUser.is_admin) {
        throw new Error('Unauthorized');
    }

    return decoded;
};

export const handleBasicAuth: RequestHandler = async (
    req: ApiRequest<unknown>,
    res: ApiResponse<unknown>,
    next
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(403).json({
            success: false,
            error: 'No token provided'
        });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(403).json({
            success: false,
            error: 'Invalid token format'
        });
        return;
    }

    try {
        const decoded = await verifyTokenWithBasicAuth(token);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: err.message === 'Token has expired' ? 'Token has expired' : 'Failed to authenticate token'
        });
    }
};

export const handleAdminAuth: RequestHandler = async (
    req: ApiRequest<unknown>,
    res: ApiResponse<unknown>,
    next
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(403).json({
            success: false,
            error: 'No token provided'
        });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(403).json({
            success: false,
            error: 'Invalid token format'
        });
        return;
    }

    try {
        const decoded = await verifyTokenWithAdminAuth(token);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: err.message === 'Unauthorized' ? 'Unauthorized' :
                err.message === 'Token has expired' ? 'Token has expired' :
                    'Failed to authenticate token'
        });
    }
};