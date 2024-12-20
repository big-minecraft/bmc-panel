export interface DatabaseCredentials {
    username: string
    password: string
    host: string
    port: number
}

export interface Database {
    name: string
    size: string
    tables: number
    credentials: DatabaseCredentials
}

export interface DatabaseCardProps {
    database: Database
    showCredentials: boolean
    onShowCredentials: (name: string) => void
    onDelete: (name: string) => void
    onReset: (name: string) => void
}