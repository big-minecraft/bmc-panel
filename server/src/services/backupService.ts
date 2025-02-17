import config from "../config";

export class BackupService {
    private static instance: BackupService;

    public getBackupFolder() :string {
        return config["bmc-path"] + "/backups";
    }

    public static getInstance(): BackupService {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }
}

export default BackupService.getInstance();