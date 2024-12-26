import express, {Application} from 'express';
import {Server as HttpServer} from 'http';
import cors from 'cors';
import path from 'path';
import {exec} from 'child_process';

// Import local modules
import config from './config';
import router from './routes';
import {setupWebSocket} from './services/websocketService';
import {databaseInit} from './controllers/database';
import {authInit} from './controllers/authentication';
import kubernetesClient from "./controllers/k8s";

class AppServer {
    private app: Application;
    private server: HttpServer;

    constructor() {
        this.app = express();
        this.server = new HttpServer(this.app);
        this.configureMiddleware();
        this.configureRoutes();
        this.initializeServices();
    }

    private configureMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(cors());
    }

    private configureRoutes(): void {
        this.app.use('/', router);
    }

    private async initializeServices(): Promise<void> {
        // Setup WebSocket handling
        setupWebSocket(this.server);

        // Initialize other services
        await databaseInit();
        await authInit();
        if (kubernetesClient.isRunningInCluster()) await this.installDependencies();
    }

    private async installDependencies(): Promise<void> {
        const scriptDir: string = path.join(config["bmc-path"], "scripts");

        console.log('Installing dependencies...');

        return new Promise((resolve, reject) => {
            exec(
                `cd ${scriptDir} && ls && ./install-dependents.sh`,
                (error: Error | null, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        reject(error);
                        return;
                    }

                    if (stderr) {
                        console.error(`Failed to install dependencies: ${stderr}`);
                    }

                    // console.log(`stdout: ${stdout}`);
                    resolve();
                }
            );
        });
    }

    public start(): void {
        this.server.listen(3001, () => {
            console.log('Server is listening on port 3001');
        });
    }
}

// Initialize and start the server
const appServer = new AppServer();
appServer.start();