import express, {Application} from 'express';
import {Server as HttpServer} from 'http';
import cors from 'cors';
import path, {resolve} from 'path';

// import files that should be included in build
import '../config.example.json';

// Import local modules
import {setupWebSocket} from './services/websocketService';
import ApiManager from "./features/api/controllers/apiManager";
import DeploymentManager from "./features/deployments/controllers/deploymentManager";
import ConfigManager from "./features/config/controllers/configManager";
import RedisService from "./services/redisService";
import KubernetesService from "./services/kubernetesService";
import DatabaseService from "./services/databaseService";
import AuthService from "./services/authService";
import MongodbService from "./services/mongodbService";
import PrometheusService from "./services/prometheusService";
import InviteCodeService from "./services/inviteCodeService";
import K8sDashboardService from "./services/k8sDashboardService";
import MariadbService from "./services/mariadbService";
import FileSessionService from "./services/fileSessionService";
import PVCFileOperationsService from "./services/pvcFileOperationsService";
import SocketManager from "./features/socket/controllers/socket-manager";
import StorageInitService from "./services/storageInitService";

class App {
    private readonly app: Application;
    private readonly server: HttpServer;
    public socketManager: SocketManager;

    constructor() {
        ConfigManager.init();

        console.log("----------------------------------");
        console.log(ConfigManager.getConfig());
        console.log("----------------------------------");

        this.app = express();
        this.server = new HttpServer(this.app);
        this.configureMiddleware();
        this.configureRoutes();
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
        // Initialize storage first
        await StorageInitService.init();

        RedisService.init();
        KubernetesService.init();
        DatabaseService.init();
        AuthService.init();
        MongodbService.init();
        PrometheusService.init();
        InviteCodeService.init();
        K8sDashboardService.init();
        MariadbService.init();
        FileSessionService.init();
        PVCFileOperationsService.init();

        // Start file session timeout checker
        FileSessionService.getInstance().startTimeoutChecker();

        this.socketManager = new SocketManager(this.server);
        PVCFileOperationsService.getInstance().setSocketManager(this.socketManager);
        setupWebSocket(this.server);
    }

    public async start() {
        // Initialize all services first (including storage)
        await this.initializeServices();

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

const app = new App();
app.start();

export { app };