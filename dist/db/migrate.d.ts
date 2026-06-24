import { DatabaseClient } from './client.js';
import { type MigrationFile } from './migrations.js';
export declare function applyPendingMigrations(schemaPath?: string, client?: Pick<DatabaseClient, 'withClient'>, cwd?: string): Promise<MigrationFile[]>;
