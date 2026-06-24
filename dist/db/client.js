import { Pool } from 'pg';
import { getDatabaseUrl } from './config.js';
export class DatabaseClient {
    pool;
    constructor(connectionString = getDatabaseUrl()) {
        this.pool = new Pool({ connectionString });
    }
    async query(sql, params = []) {
        return this.pool.query(sql, params);
    }
    async withClient(fn) {
        const client = await this.pool.connect();
        try {
            return await fn(client);
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
}
