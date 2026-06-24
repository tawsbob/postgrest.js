import { join } from 'node:path';
import type { PoolClient } from 'pg';
import { DatabaseClient } from './client.js';
import {
  listPendingMigrations,
  readMigrationSql,
  recordAppliedMigration,
  type MigrationFile,
} from './migrations.js';
import { writeSnapshot } from './schema-state.js';

export async function applyPendingMigrations(
  schemaPath = join(process.cwd(), 'app.schema'),
  client: Pick<DatabaseClient, 'withClient'> = new DatabaseClient(),
  cwd = process.cwd(),
): Promise<MigrationFile[]> {
  const applied: MigrationFile[] = [];

  await client.withClient(async (pgClient) => {
    const pending = await listPendingMigrations(pgClient, cwd);
    if (pending.length === 0) {
      return;
    }

    for (const migration of pending) {
      await applyMigration(pgClient, migration);
      applied.push(migration);
    }

    writeSnapshot(schemaPath, cwd);
  });

  return applied;
}

async function applyMigration(client: PoolClient, migration: MigrationFile): Promise<void> {
  const sql = readMigrationSql(migration);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await recordAppliedMigration(client, migration);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
