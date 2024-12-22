export interface DatabaseCredentials {
    username: string;
    password: string;
    host: string;
    port: number;
}

export interface Database {
    name: string;
    size: string;
    tables: number;
    credentials: DatabaseCredentials;
}

export interface DatabaseCardProps {
    database: Database;
    databaseType: 'sql' | 'mongo';
    showCredentials: boolean;
    onShowCredentials: (name: string) => void;
    onDelete: (name: string, type: 'sql' | 'mongo') => void;
    onReset: (name: string, type: 'sql' | 'mongo') => void;
}