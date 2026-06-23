import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { getDatabaseUrl } from './config.js';

export class DatabaseClient {
  private readonly pool: Pool;

  constructor(connectionString = getDatabaseUrl()) {
    this.pool = new Pool({ connectionString });
  }

  async query<T extends QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
