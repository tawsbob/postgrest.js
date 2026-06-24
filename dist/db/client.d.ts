import { type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
export declare class DatabaseClient {
    private readonly pool;
    constructor(connectionString?: string);
    query<T extends QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
    withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
