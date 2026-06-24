import { Pool } from 'pg';
import type { MiddlewareHandler } from 'hono';
import { createDbClient } from 'generated/db.js';
import type { DbClient } from 'generated/db.js';
import { getDatabaseUrl } from '../../db/config.js';
import type { AppEnv } from '../types.js';

const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db: DbClient = createDbClient(pool);

export function createDbMiddleware(options: { pool?: Pool } = {}): MiddlewareHandler<AppEnv> {
  const client = options.pool ? createDbClient(options.pool) : db;

  return async (c, next) => {
    c.set('db', client);
    await next();
  };
}
