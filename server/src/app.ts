import express, {Application} from 'express';
import {Server as HttpServer} from 'http';
import cors from 'cors';
import path, {resolve} from 'path';
import {exec} from 'child_process';

// Import local modules
import config from './config';
import {setupWebSocket} from './services/websocketService';
import ApiManager from "./controllers/api/apiManager";
import databaseService from "./services/databaseService";
import authService from "./services/authService";
import kubernetesService from "./services/kubernetesService";
import DeploymentManager from "./features/deployments/controllers/deploymentManager";

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
        this.app.use(ApiManager.getInstance().getRouter());
    }

    private async initializeServices(): Promise<void> {
        setupWebSocket(this.server);

        await databaseService;
        await authService;
        if (kubernetesService.isRunningInCluster()) await this.installDependencies();
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

                    resolve();
                }
            );
        });
    }

    public async start() {
        await DeploymentManager.init();

        if (process.env.NODE_ENV === 'development') {
            const { createProxyMiddleware } = require('http-proxy-middleware');
            this.app.use(createProxyMiddleware({
                target: 'http://localhost:3001',
                changeOrigin: true,
                ws: true
            }));
        } else if (process.env.NODE_ENV === 'production') {
            this.app.use(express.static(resolve(__dirname, '../../client/build')));
            this.app.get('*', (req, res) => {
                res.sendFile(resolve(__dirname, '../../client/build/index.html'));
            });
        }

        this.server.listen(3000, () => {
            console.log('Server is listening on port 3000');
        });
    }
}

const appServer = new AppServer();
appServer.start();