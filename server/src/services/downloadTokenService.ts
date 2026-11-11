import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { RedisManager } from './redisService';
import { FileSpec } from '../types/fileSession';

const KEY_PREFIX = 'file-download-token:';
const TTL_SECONDS = 120;

export interface DownloadGrant {
    sessionId: string;
    files: FileSpec[];
    fileName: string;
    archive: boolean;
}

export default class DownloadTokenService {
    public static async issue(grant: DownloadGrant): Promise<string> {
        const token = randomBytes(32).toString('base64url');

        await DownloadTokenService.withRedis(redis =>
            redis.set(KEY_PREFIX + token, JSON.stringify(grant), 'EX', TTL_SECONDS)
        );

        return token;
    }

    public static async consume(token: string): Promise<DownloadGrant | null> {
        if (!token) return null;

        const raw = await DownloadTokenService.withRedis(async (redis) => {
            const key = KEY_PREFIX + token;
            const [[, value]] = await redis.multi().get(key).del(key).exec();
            return value as string | null;
        });

        if (!raw) return null;

        try {
            return JSON.parse(raw) as DownloadGrant;
        } catch (error) {
            console.error('Discarding malformed download token payload:', error);
            return null;
        }
    }

    private static async withRedis<T>(work: (redis: Redis) => Promise<T>): Promise<T> {
        const pool = RedisManager.getInstance().redisPool;
        const redis: Redis = await pool.acquire();
        try {
            return await work(redis);
        } finally {
            await pool.release(redis);
        }
    }
}
