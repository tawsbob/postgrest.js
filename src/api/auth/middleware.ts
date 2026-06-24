import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types.js';
import { createJwtResolver } from './jwt-resolver.js';
import type { AuthContext, AuthResolver } from './types.js';
import { PUBLIC_ROLE } from './types.js';

const defaultPublicContext: AuthContext = { role: PUBLIC_ROLE };

export function createAuthMiddleware(resolver: AuthResolver = createJwtResolver()): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const auth = (await resolver(c)) ?? defaultPublicContext;
    c.set('auth', auth);
    await next();
  };
}
