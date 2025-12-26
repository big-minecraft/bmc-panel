import * as K8s from '@kubernetes/client-node';
import { v4 as uuidv4 } from 'uuid';
import { FileEditSession, FileOperationError, FileOperationErrorCode } from '../types/fileSession';
import KubernetesService from './kubernetesService';
import { RedisManager } from './redisService';
import DeploymentManager from '../features/deployments/controllers/deploymentManager';
import { PulumiDeploymentService } from './pulumi/pulumiDeploymentService';
import Redis from 'ioredis';
import ConfigManager from '../features/config/controllers/configManager';

export default class FileSessionService {
    private static instance: FileSessionService;
    private timeoutChecker: NodeJS.Timeout | null = null;
    private readonly REDIS_TTL_SECONDS = 30 * 60; // 30 minutes
    private readonly POD_NAMESPACE = 'default';

    private get TIMEOUT_MINUTES(): number {
        return ConfigManager.getConfig().fileEditSession?.timeoutMinutes || 15;
    }

    private constructor() {
        console.log('FileSessionService initialized');
    }

    public static getInstance(): FileSessionService {
        return FileSessionService.instance;
    }

    public static init(): void {
        FileSessionService.instance = new FileSessionService();
    }

    // Session lifecycle methods

    public async createSession(deploymentName: string, userId: string): Promise<FileEditSession> {
        try {
            // Validate deployment exists
            const deployment = DeploymentManager.getDeploymentByName(deploymentName);
            if (!deployment) {
                throw new FileOperationError(
                    `Deployment ${deploymentName} not found`,
                    FileOperationErrorCode.DEPLOYMENT_NOT_FOUND
                );
            }

            const deploymentType = deployment.type

            const sessionId = uuidv4();
            const podName = `file-edit-session-${deploymentName}-${sessionId.substring(0, 8)}`;

            // Find PVC by labels instead of name
            const pvcName = await this.findPVCByLabels(deploymentName, deploymentType.identifier, this.POD_NAMESPACE);

            const session: FileEditSession = {
                id: sessionId,
                deploymentName,
                podName,
                pvcName,
                userId,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                status: 'creating',
                namespace: this.POD_NAMESPACE,
            };

            // Store session in Redis
            await this.storeSession(session);

            // Get SFTP port from deployment
            const sftpPort = deployment.getSftpPort();
            if (!sftpPort) {
                throw new FileOperationError(
                    `Deployment ${deploymentName} does not have an SFTP port assigned`,
                    FileOperationErrorCode.DEPLOYMENT_NOT_FOUND
                );
            }

            // Create pod using Pulumi
            const pulumiService = PulumiDeploymentService.getInstance();
            const result = await pulumiService.createFileSession(
                sessionId,
                podName,
                deploymentName,
                pvcName,
                sftpPort
            );

            if (!result.success) {
                session.status = 'error';
                await this.updateSessionStatus(sessionId, 'error');
                throw new FileOperationError(
                    `Failed to create file session pods: ${result.error?.message}`,
                    FileOperationErrorCode.POD_NOT_READY
                );
            }

            // Wait for pod to be ready
            const isReady = await this.waitForPodReady(podName, this.POD_NAMESPACE, 60000);

            if (isReady) {
                session.status = 'ready';
                await this.updateSessionStatus(sessionId, 'ready');
            } else {
                session.status = 'error';
                await this.updateSessionStatus(sessionId, 'error');
                throw new FileOperationError(
                    `Pod ${podName} failed to become ready`,
                    FileOperationErrorCode.POD_NOT_READY
                );
            }

            console.log(`Created file edit session ${sessionId} for deployment ${deploymentName}`);
            return session;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    public async terminateSession(sessionId: string): Promise<void> {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new FileOperationError(
                    `Session ${sessionId} not found`,
                    FileOperationErrorCode.SESSION_NOT_FOUND
                );
            }

            // Update status to terminating
            await this.updateSessionStatus(sessionId, 'terminating');

            // Destroy file session using Pulumi
            const pulumiService = PulumiDeploymentService.getInstance();
            const result = await pulumiService.destroyFileSession(sessionId);

            if (!result.success) {
                console.error(`Failed to destroy file session ${sessionId} via Pulumi:`, result.error);
                // Continue with cleanup even if Pulumi fails
            }

            // Remove session from Redis
            await this.removeSession(sessionId);

            console.log(`Terminated session ${sessionId}`);
        } catch (error) {
            console.error('Error terminating session:', error);
            throw error;
        }
    }

    public async refreshActivity(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new FileOperationError(
                `Session ${sessionId} not found`,
                FileOperationErrorCode.SESSION_NOT_FOUND
            );
        }

        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            await redis.hset(`file-session:${sessionId}`, 'lastActivity', Date.now().toString());
            await redis.expire(`file-session:${sessionId}`, this.REDIS_TTL_SECONDS);
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    // Query methods

    public async getSession(sessionId: string): Promise<FileEditSession | null> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessionData = await redis.hgetall(`file-session:${sessionId}`);
            if (!sessionData || Object.keys(sessionData).length === 0) {
                return null;
            }

            const session: FileEditSession = {
                id: sessionData.id,
                deploymentName: sessionData.deploymentName,
                podName: sessionData.podName,
                pvcName: sessionData.pvcName,
                userId: sessionData.userId,
                createdAt: parseInt(sessionData.createdAt),
                lastActivity: parseInt(sessionData.lastActivity),
                status: sessionData.status as FileEditSession['status'],
                namespace: sessionData.namespace,
            };

            // Add SFTP credentials if session is ready
            if (session.status === 'ready') {
                session.sftpCredentials = this.assembleSftpCredentials(session.deploymentName);
            }

            return session;
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    public async listSessionsByDeployment(deploymentName: string): Promise<FileEditSession[]> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessionIds = await redis.smembers(`file-session:by-deployment:${deploymentName}`);
            const sessions: FileEditSession[] = [];

            for (const sessionId of sessionIds) {
                const session = await this.getSession(sessionId);
                if (session) {
                    sessions.push(session);
                }
            }

            return sessions;
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    public async listSessionsByUser(userId: string): Promise<FileEditSession[]> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessionIds = await redis.smembers(`file-session:by-user:${userId}`);
            const sessions: FileEditSession[] = [];

            for (const sessionId of sessionIds) {
                const session = await this.getSession(sessionId);
                if (session) {
                    sessions.push(session);
                }
            }

            return sessions;
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    public async listAllActiveSessions(): Promise<FileEditSession[]> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessions: FileEditSession[] = [];
            let cursor = '0';
            const pattern = 'file-session:*';

            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;

                for (const key of keys) {
                    // Skip the by-deployment and by-user keys
                    if (key.includes(':by-')) continue;

                    const sessionId = key.replace('file-session:', '');
                    const session = await this.getSession(sessionId);
                    if (session) {
                        sessions.push(session);
                    }
                }
            } while (cursor !== '0');

            return sessions;
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    // Health & validation methods

    public async validateSession(sessionId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) {
            return false;
        }

        if (session.status !== 'ready') {
            return false;
        }

        // Check if pod still exists and is running
        const podReady = await this.checkPodReady(session.podName, session.namespace);
        return podReady;
    }

    public async checkPodReady(podName: string, namespace: string): Promise<boolean> {
        try {
            const k8s = KubernetesService.getInstance();
            const coreV1Api = k8s.kc.makeApiClient(K8s.CoreV1Api);

            const pod = await coreV1Api.readNamespacedPod(podName, namespace);

            if (pod.body.status?.phase !== 'Running') {
                return false;
            }

            const containerStatuses = pod.body.status?.containerStatuses || [];
            return containerStatuses.every(status => status.ready === true);
        } catch (error: any) {
            if (error.statusCode === 404) {
                return false;
            }
            console.error(`Error checking pod ${podName} status:`, error);
            return false;
        }
    }

    // Background task

    public startTimeoutChecker(): void {
        if (this.timeoutChecker) {
            console.warn('Timeout checker already running');
            return;
        }

        console.log('Starting file session timeout checker');
        this.timeoutChecker = setInterval(async () => {
            try {
                await this.checkAndTerminateExpiredSessions();
            } catch (error) {
                console.error('Error in timeout checker:', error);
            }
        }, 60000); // Check every 60 seconds
    }

    public stopTimeoutChecker(): void {
        if (this.timeoutChecker) {
            clearInterval(this.timeoutChecker);
            this.timeoutChecker = null;
            console.log('Stopped file session timeout checker');
        }
    }

    private async checkAndTerminateExpiredSessions(): Promise<void> {
        const sessions = await this.listAllActiveSessions();
        const now = Date.now();
        const timeoutMs = this.TIMEOUT_MINUTES * 60 * 1000;

        for (const session of sessions) {
            if (now - session.lastActivity > timeoutMs) {
                console.log(`Session ${session.id} expired (idle for ${Math.floor((now - session.lastActivity) / 60000)} minutes)`);
                try {
                    await this.terminateSession(session.id);
                } catch (error) {
                    console.error(`Error terminating expired session ${session.id}:`, error);
                }
            }
        }
    }

    // Private helper methods

    private assembleSftpCredentials(deploymentName: string): { host: string; port: number; username: string; password: string } | undefined {
        try {
            const deployment = DeploymentManager.getDeploymentByName(deploymentName);
            if (!deployment) return undefined;

            const sftpPort = deployment.getSftpPort();
            if (!sftpPort) return undefined;

            const config = ConfigManager.getConfig();
            const host = config.panel.panelHost;
            if (!host) return undefined;

            return {
                host,
                port: sftpPort,
                username: `${deploymentName}_user`,
                password: config.sftp.password
            };
        } catch (error) {
            console.error('Error assembling SFTP credentials:', error);
            return undefined;
        }
    }

    private async storeSession(session: FileEditSession): Promise<void> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessionKey = `file-session:${session.id}`;
            const deploymentKey = `file-session:by-deployment:${session.deploymentName}`;
            const userKey = `file-session:by-user:${session.userId}`;

            // Store session data
            await redis.hset(sessionKey, {
                id: session.id,
                deploymentName: session.deploymentName,
                podName: session.podName,
                pvcName: session.pvcName,
                userId: session.userId,
                createdAt: session.createdAt.toString(),
                lastActivity: session.lastActivity.toString(),
                status: session.status,
                namespace: session.namespace,
            });

            // Set TTL
            await redis.expire(sessionKey, this.REDIS_TTL_SECONDS);

            // Add to deployment index
            await redis.sadd(deploymentKey, session.id);

            // Add to user index
            await redis.sadd(userKey, session.id);
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    private async removeSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) {
            return;
        }

        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            const sessionKey = `file-session:${sessionId}`;
            const deploymentKey = `file-session:by-deployment:${session.deploymentName}`;
            const userKey = `file-session:by-user:${session.userId}`;

            await redis.del(sessionKey);
            await redis.srem(deploymentKey, sessionId);
            await redis.srem(userKey, sessionId);
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    private async updateSessionStatus(sessionId: string, status: FileEditSession['status']): Promise<void> {
        const redis: Redis = await RedisManager.getInstance().redisPool.acquire();
        try {
            await redis.hset(`file-session:${sessionId}`, 'status', status);
        } finally {
            await RedisManager.getInstance().redisPool.release(redis);
        }
    }

    private async findPVCByLabels(deploymentName: string, deploymentType: string, namespace: string): Promise<string> {
        try {
            const k8s = KubernetesService.getInstance();
            const coreV1Api = k8s.kc.makeApiClient(K8s.CoreV1Api);

            // Build label selector: app=<deploymentName>,kyriji.dev/deployment-type=<deploymentType>
            const labelSelector = `app=${deploymentName},kyriji.dev/deployment-type=${deploymentType}`;

            const response = await coreV1Api.listNamespacedPersistentVolumeClaim(
                namespace,
                undefined, // pretty
                undefined, // allowWatchBookmarks
                undefined, // continue
                undefined, // fieldSelector
                labelSelector // labelSelector
            );

            if (!response.body.items || response.body.items.length === 0) {
                throw new FileOperationError(
                    `No PVC found with labels app=${deploymentName} and kyriji.dev/deployment-type=${deploymentType} in namespace ${namespace}`,
                    FileOperationErrorCode.PVC_NOT_FOUND
                );
            }

            if (response.body.items.length > 1) {
                console.warn(`Multiple PVCs found with labels app=${deploymentName} and kyriji.dev/deployment-type=${deploymentType}, using first one: ${response.body.items[0].metadata?.name}`);
            }

            const pvcName = response.body.items[0].metadata?.name;
            if (!pvcName) {
                throw new FileOperationError(
                    `PVC found but has no name in namespace ${namespace}`,
                    FileOperationErrorCode.PVC_NOT_FOUND
                );
            }

            console.log(`Found PVC ${pvcName} for deployment ${deploymentName} (type: ${deploymentType})`);
            return pvcName;
        } catch (error: any) {
            if (error instanceof FileOperationError) {
                throw error;
            }
            console.error('Error finding PVC by labels:', error);
            throw new FileOperationError(
                `Failed to find PVC for deployment ${deploymentName} (type: ${deploymentType}): ${error.message}`,
                FileOperationErrorCode.PVC_NOT_FOUND
            );
        }
    }

    private async waitForPodReady(podName: string, namespace: string, timeoutMs: number): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const ready = await this.checkPodReady(podName, namespace);
            if (ready) {
                return true;
            }

            // Wait 2 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return false;
    }
}
