import { MongoClient } from 'mongodb';
import config from '../config';

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
        const adminUsername = config.mongodb.username;
        const adminPassword = config.mongodb.password;
        const host = config.mongodb.host;
        const port = config.mongodb.port;
        const defaultDatabase = config.mongodb.database;

        this.uri = `mongodb://${adminUsername}:${adminPassword}@${host}:${port}/${defaultDatabase}`;
        this.client = new MongoClient(this.uri);
    }

    public static getInstance(): MongodbService {
        if (!MongodbService.instance) {
            MongodbService.instance = new MongodbService();
        }
        return MongodbService.instance;
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

            try {
                const users = await this.adminDb.command({ usersInfo: { user: username } });
                if (users.users.length > 0) {
                    throw new Error(`User '${username}' already exists`);
                }
            } catch (error) { }

            const credentialsDb = this.client.db('admin');
            const existingCreds = await credentialsDb
                .collection('database_credentials')
                .findOne({ database_name: name });

            if (existingCreds) {
                throw new Error(`Credentials for database '${name}' already exist`);
            }

            const newDb = this.client.db(name);
            await newDb.createCollection('_init');

            const password = generatePassword();
            await this.adminDb.command({
                createUser: username,
                pwd: password,
                roles: [{ role: 'dbOwner', db: name }]
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
                await this.adminDb.command({ dropUser: `${name}_user` });
                await this.client.db(name).dropDatabase();
                await this.client.db('admin').collection('database_credentials')
                    .deleteOne({ database_name: name });
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
                            host: config['panel-host'],
                            port: config.mongodb.port
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

            await this.adminDb.command({ dropUser: `${name}_user` });
            await this.client.db(name).dropDatabase();
            await this.client.db('admin').collection('database_credentials')
                .deleteOne({ database_name: name });

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

            await this.adminDb.command({
                updateUser: username,
                pwd: newPassword
            });

            await this.client.db('admin').collection('database_credentials')
                .updateOne(
                    { database_name: name },
                    { $set: { password: newPassword } }
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
}

function generatePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
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

export default MongodbService.getInstance();