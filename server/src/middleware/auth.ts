import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import {ApiRequest} from "../controllers/api/apiManager";
import {ApiResponse} from "../api/types";
import databaseService from "../services/databaseService";
import ConfigManager from "../controllers/config/controllers/configManager";
import configManager from "../controllers/config/controllers/configManager";
import KubernetesService from "../services/kubernetesService";

export enum AuthType {
    None = 'none',
    Basic = 'basic',
    Admin = 'admin',
}

export const handleBasicAuth: RequestHandler = async (
    req: ApiRequest<any>,
    res: ApiResponse<any>,
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
        const decoded = jwt.verify(token, ConfigManager.getString("token-secret"));
        const user = decoded.username;

        const dbUser = await databaseService.getUser(user);
        const last_logout = dbUser.last_logout;

        if (last_logout) {
            const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;

            if (decoded.iat < lastLogoutTimestamp && KubernetesService.getInstance().isRunningInCluster()) {
                res.status(401).json({
                    success: false,
                    error: 'Token has expired'
                });
                return;
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: 'Failed to authenticate token',
        });
    }
};

export const handleAdminAuth: RequestHandler = async (
    req: ApiRequest<any>,
    res: ApiResponse<any>,
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
        const decoded = jwt.verify(token, configManager.getString("token-secret"));
        const user = decoded.username;

        const dbUser = await databaseService.getUser(user);
        const last_logout = dbUser.last_logout;

        if (last_logout) {
            const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;

            if (decoded.iat < lastLogoutTimestamp && KubernetesService.getInstance().isRunningInCluster()) {
                res.status(401).json({
                    success: false,
                    error: 'Token has expired'
                });
                return;
            }
        }

        if (!dbUser.is_admin) {
            res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
            return;
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: 'Failed to authenticate token',
        });
    }
};