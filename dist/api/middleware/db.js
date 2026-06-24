import { Pool } from 'pg';
import { createDbClient } from 'generated/db.js';
import { getDatabaseUrl } from '../../db/config.js';
const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = createDbClient(pool);
export function createDbMiddleware(options = {}) {
    const client = options.pool ? createDbClient(options.pool) : db;
    return async (c, next) => {
        c.set('db', client);
        await next();
    };
}
