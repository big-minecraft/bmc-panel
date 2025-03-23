import express, {Application} from 'express';
import {Server as HttpServer} from 'http';
import cors from 'cors';
import path, {resolve} from 'path';
import {exec} from 'child_process';

// Import local modules
import {setupWebSocket} from './services/websocketService';
import ApiManager from "./features/api/controllers/apiManager";
import DeploymentManager from "./features/deployments/controllers/deploymentManager";
import ConfigManager from "./features/config/controllers/configManager";
import RedisService from "./services/redisService";
import KubernetesService from "./services/kubernetesService";
import SftpService from "./services/sftpService";
import DatabaseService from "./services/databaseService";
import AuthService from "./services/authService";
import MongodbService from "./services/mongodbService";
import PrometheusService from "./services/prometheusService";
import InviteCodeService from "./services/inviteCodeService";
import K8sDashboardService from "./services/k8sDashboardService";
import UnzipService from "./services/unzipService";
import MariadbService from "./services/mariadbService";

// import files that should be included in build
import '../config.example.json';

class AppServer {
    private readonly app: Application;
    private readonly server: HttpServer;

    constructor() {
        ConfigManager.init();

        console.log("----------------------------------");
        console.log(ConfigManager.getConfig());
        console.log("----------------------------------");

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
        RedisService.init();
        KubernetesService.init();
        SftpService.init();
        DatabaseService.init();
        AuthService.init();
        MongodbService.init();
        PrometheusService.init();
        InviteCodeService.init();
        K8sDashboardService.init();
        UnzipService.init();
        MariadbService.init();

        setupWebSocket(this.server);
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
            this.app.use(express.static(resolve(__dirname, '../../client')));
            this.app.get('*', (_req, res) => {
                console.log(resolve(__dirname, '../../client/index.html'))
                res.sendFile(resolve(__dirname, '../../client/index.html'));
            });
        }

        this.server.listen(3000, () => {
            console.log('server is listening on port 3000');
        });
    }
}

const appServer = new AppServer();
appServer.start();