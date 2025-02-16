import express, {Application} from 'express';
import {Server as HttpServer} from 'http';
import cors from 'cors';
import path, {resolve} from 'path';
import {exec} from 'child_process';

// Import local modules
import config from './config';
import {setupWebSocket} from './services/websocketService';
import ApiManager from "./controllers/api/apiManager";
import kubernetesService from "./services/kubernetesService";
import DeploymentManager from "./features/deployments/controllers/deploymentManager";

class AppServer {
    private readonly app: Application;
    private readonly server: HttpServer;

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
        if (kubernetesService.isRunningInCluster()) await this.installDependencies();
    }

    private async installDependencies(): Promise<void> {
        const scriptDir: string = path.join(config["bmc-path"], "scripts");

        console.log('running install-dependents script');

        return new Promise((resolve, reject) => {
            const process = exec(
                `cd ${scriptDir} && ls && ./install-dependents.sh`
            );

            process.stdout?.on('data', (data) => console.log(data.toString().trim()));
            process.stderr?.on('data', (data) => console.log(data.toString().trim()));

            process.on('close', (code) => {
                if (code !== 0) {
                    const error = new Error(`process exited with code ${code}`);
                    console.log(`install-dependents failed: ${error}`);
                    reject(error);
                    return
                }
                console.log('install-dependents succeeded');
                resolve();
            });
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
            this.app.use(express.static(resolve(__dirname, '../../client/dist')));
            this.app.get('*', (_req, res) => {
                res.sendFile(resolve(__dirname, '../../client/dist/index.html'));
            });
        }

        this.server.listen(3000, () => {
            console.log('Server is listening on port 3000');
        });
    }
}

const appServer = new AppServer();
appServer.start();