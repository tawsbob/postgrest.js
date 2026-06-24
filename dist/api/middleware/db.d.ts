import { Pool } from 'pg';
import type { MiddlewareHandler } from 'hono';
import type { DbClient } from 'generated/db.js';
import type { AppEnv } from '../types.js';
export declare const db: DbClient;
export declare function createDbMiddleware(options?: {
    pool?: Pool;
}): MiddlewareHandler<AppEnv>;
