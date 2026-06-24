import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types.js';
import type { AuthResolver } from './types.js';
export declare function createAuthMiddleware(resolver?: AuthResolver): MiddlewareHandler<AppEnv>;
