import type { PoolClient } from 'pg';
export interface MigrationFile {
    id: number;
    name: string;
    filename: string;
    path: string;
}
export declare function getMigrationsDir(cwd?: string): string;
export declare function ensureMigrationsDir(cwd?: string): string;
export declare function listMigrationFiles(cwd?: string): MigrationFile[];
export declare function createMigration(name: string, sql: string, cwd?: string): MigrationFile;
export declare function ensureMigrationsTable(client: PoolClient): Promise<void>;
export declare function getAppliedMigrationFilenames(client: PoolClient): Promise<Set<string>>;
export declare function listPendingMigrations(client: PoolClient, cwd?: string): Promise<MigrationFile[]>;
export declare function recordAppliedMigration(client: PoolClient, migration: MigrationFile): Promise<void>;
export declare function readMigrationSql(migration: MigrationFile): string;
export declare const DESTRUCTIVE_MIGRATION_KINDS: Set<string>;
