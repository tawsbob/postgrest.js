import type { Pool, PoolClient } from 'pg';
type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;
export declare function resetPublicSchema(client: Queryable): Promise<void>;
export {};
