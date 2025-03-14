import ConfigManager from "../controllers/config/controllers/configManager";

export class BackupService {
    private static instance: BackupService;

    public getBackupFolder() :string {
        return ConfigManager.getString("bmc-path") + "/backups";
    }

    public static getInstance(): BackupService {
        return BackupService.instance;
    }

    public static init(): void {
        BackupService.instance = new BackupService();
    }
}

export default BackupService;