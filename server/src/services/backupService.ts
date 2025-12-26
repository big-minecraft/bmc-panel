import ConfigManager from "../features/config/controllers/configManager";

export class BackupService {
    private static instance: BackupService;

    public getBackupFolder() :string {
        return ConfigManager.getConfig().panel.storagePath + "/backups";
    }

    public static getInstance(): BackupService {
        return BackupService.instance;
    }

    public static init(): void {
        BackupService.instance = new BackupService();
    }
}

export default BackupService;