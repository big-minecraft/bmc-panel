import ConfigManager from "../controllers/config/controllers/configManager";

export class BackupService {
    private static instance: BackupService;

    public getBackupFolder() :string {
        return ConfigManager.getString("bmc-path") + "/backups";
    }

    public static getInstance(): BackupService {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }
}

export default BackupService.getInstance();