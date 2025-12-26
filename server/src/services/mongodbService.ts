import { MongoClient } from 'mongodb';
import path from "path";
import {BackupService} from "./backupService";
import {createReadStream, createWriteStream, mkdirSync} from "node:fs";
import {existsSync} from "fs";
import {pipeline, Readable, Transform} from "node:stream";
import {readFile, writeFile} from "node:fs/promises";
import ConfigManager from "../features/config/controllers/configManager";

interface DatabaseCredentials {
    username: string;
    password: string;
}

export interface DatabaseInfo {
    name: string;
    size: string;
    collections: number;
    credentials: {
        username: string;
        password: string;
        host: string;
        port: number;
    };
}

class MongodbService {
    private static instance: MongodbService;
    private readonly client: MongoClient;
    private adminDb: any;
    private readonly uri: string;

    private constructor() {
        let config = ConfigManager.getConfig();

        const adminUsername = config.mongoDB.username;
        const adminPassword = config.mongoDB.initPassword;
        const host = config.mongoDB.host;
        const port = config.mongoDB.port;
        const defaultDatabase = config.mongoDB.database;

        this.uri = `mongodb://${adminUsername}:${adminPassword}@${host}:${port}/${defaultDatabase}`;
        this.client = new MongoClient(this.uri);
    }

    public static getInstance(): MongodbService {
        return MongodbService.instance;
    }

    public static init() {
        MongodbService.instance = new MongodbService();
    }

    private async connect() {
        if (!this.adminDb) {
            await this.client.connect();
            this.adminDb = this.client.db('admin');
        }
    }

    private async disconnect() {
        if (this.client) {
            await this.client.close();
            this.adminDb = null;
        }
    }

    async createMongoDatabase(name: string): Promise<{ name: string; credentials: DatabaseCredentials }> {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        try {
            await this.connect();

            const dbs = await this.client.db().admin().listDatabases();
            if (dbs.databases.some(db => db.name === name)) {
                throw new Error(`Database '${name}' already exists`);
            }

            const username = `${name}_user`;

            const credentialsDb = this.client.db('admin');
            const existingCreds = await credentialsDb
                .collection('database_credentials')
                .findOne({database_name: name});

            if (existingCreds) {
                throw new Error(`Credentials for database '${name}' already exist`);
            }

            const newDb = this.client.db(name);
            await newDb.createCollection('_init');

            const password = generatePassword();
            await newDb.command({
                createUser: username,
                pwd: password,
                roles: [{role: 'dbOwner', db: name}]
            });

            await credentialsDb.collection('database_credentials').insertOne({
                database_name: name,
                username,
                password,
                created_at: new Date()
            });

            return {
                name,
                credentials: {
                    username,
                    password
                }
            };
        } catch (error) {
            try {
                await this.client.db(name).dropDatabase();
                await this.client.db('admin').collection('database_credentials')
                    .deleteOne({database_name: name});
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }
            throw new Error(`Failed to create database: ${error.message}`);
        } finally {
            await this.disconnect();
        }
    }

    async listMongoDatabases(): Promise<DatabaseInfo[]> {
        try {
            await this.connect();

            const adminDb = this.client.db('admin');
            const dbs = await this.client.db().admin().listDatabases();

            const credentials = await adminDb
                .collection('database_credentials')
                .find({}).toArray();

            const credMap = new Map(credentials.map(cred =>
                [cred.database_name, cred]
            ));

            const systemDbs = ['admin', 'config', 'local'];
            const dbList = await Promise.all(dbs.databases
                .filter(db => !systemDbs.includes(db.name))
                .map(async db => {
                    const dbInstance = this.client.db(db.name);
                    const collections = await dbInstance.listCollections().toArray();
                    const creds = credMap.get(db.name);

                    return {
                        name: db.name,
                        size: `${Math.round(db.sizeOnDisk / 1024 / 1024 * 100) / 100}MB`,
                        collections: collections.length,
                        credentials: creds ? {
                            username: `${db.name}_user`,
                            password: creds.password,
                            host: ConfigManager.getConfig().panel.panelHost,
                            port: 30017
                        } : null
                    };
                }));

            return dbList;
        } catch (error) {
            throw new Error(`Failed to list databases: ${error.message}`);
        } finally {
            await this.disconnect();
        }
    }

    async deleteMongoDatabase(name: string): Promise<void> {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        try {
            await this.connect();

            const username = `${name}_user`;

            // Try to drop user from admin db (for old databases)
            try {
                await this.adminDb.command({dropUser: username});
            } catch (error) {
                // User might not exist in admin
            }

            // Try to drop user from the specific database (for new databases)
            try {
                await this.client.db(name).command({dropUser: username});
            } catch (error) {
                // User might not exist in this db
            }

            await this.client.db(name).dropDatabase();
            await this.client.db('admin').collection('database_credentials')
                .deleteOne({database_name: name});

        } catch (error) {
            throw new Error(`Failed to delete database: ${error.message}`);
        } finally {
            await this.disconnect();
        }
    }

    async resetMongoDatabasePassword(name: string): Promise<DatabaseCredentials> {

        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        try {
            await this.connect();

            const username = `${name}_user`;
            const newPassword = generatePassword();

            await this.client.db(name).command({
                updateUser: username,
                pwd: newPassword
            });

            await this.client.db('admin').collection('database_credentials')
                .updateOne(
                    {database_name: name},
                    {$set: {password: newPassword}}
                );

            return {
                username,
                password: newPassword
            };
        } catch (error) {
            throw new Error(`Failed to reset password: ${error.message}`);
        } finally {
            await this.disconnect();
        }
    }

    private createTransformStream(): Transform {
        return new Transform({
            objectMode: true,
            transform(chunk: any, encoding: string, callback: (error?: Error | null, data?: any) => void) {
                const jsonString = JSON.stringify(chunk) + '\n';
                callback(null, jsonString);
            }
        });
    }

    async backup(databaseName: string): Promise<string> {
        try {
            await this.connect();
            const db = this.client.db(databaseName);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFolder = BackupService.getInstance().getBackupFolder() + "/mongodb/";
            const backupDir = path.join(backupFolder, `backup-${databaseName}-${timestamp}`);

            if (!existsSync(backupDir)) {
                mkdirSync(backupDir, {recursive: true});
            }

            const collections = await db.listCollections().toArray();

            const metadata = {
                database: databaseName,
                collections: collections.map(col => ({
                    name: col.name
                })),
                timestamp: timestamp,
                version: '1.0'
            };

            await writeFile(
                path.join(backupDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            await Promise.all(collections.map(async (collection) => {
                const collectionName = collection.name;
                const cursor = db.collection(collectionName).find({});

                const writeStream = createWriteStream(
                    path.join(backupDir, `${collectionName}.json`)
                );

                const transformStream = this.createTransformStream();
                const readableStream = Readable.from(cursor);

                return new Promise((resolve, reject) => {
                    pipeline(
                        readableStream,
                        transformStream,
                        writeStream,
                        (err) => {
                            if (err) reject(err);
                            else resolve(undefined);
                        }
                    );
                });
            }));

            console.log(`Backup created at: ${backupDir}`);
            return backupDir;

        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }


    async restore(backupPath: string) {
        try {
            await this.connect();
            const metadata = JSON.parse(
                await readFile(path.join(backupPath, 'metadata.json'), 'utf-8')
            );

            const existingDatabases = await this.client.db().admin().listDatabases();
            const databaseExists = existingDatabases.databases.some(db => db.name === metadata.database);

            if (!databaseExists) {
                await this.createMongoDatabase(metadata.database);
            }

            const db = this.client.db(metadata.database);

            for (const collectionMeta of metadata.collections) {
                const collectionName = collectionMeta.name;

                try {
                    await db.collection(collectionName).drop();
                } catch (error) { }

                const collection = await db.createCollection(
                    collectionName,
                    collectionMeta.options
                );

                const collectionFilePath = path.join(backupPath, `${collectionName}.json`);
                const fileStream = createReadStream(collectionFilePath, {encoding: 'utf-8'});
                const documents: any[] = [];

                let buffer = '';

                for await (const chunk of fileStream) {
                    buffer += chunk;
                    const lines = buffer.split('\n');

                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim()) {
                            documents.push(JSON.parse(line));

                            if (documents.length >= 1000) {
                                await collection.insertMany(documents);
                                documents.length = 0;
                            }
                        }
                    }
                }

                if (documents.length > 0) {
                    await collection.insertMany(documents);
                }
            }

            console.log(`Restored database ${metadata.database} from ${backupPath}`);

        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

function generatePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

function isValidDatabaseName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    if (name.length === 0 || name.length > 64) return false;
    return /^[a-zA-Z0-9_]+$/.test(name);
}

export default MongodbService;