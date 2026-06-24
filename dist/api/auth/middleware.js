import { createJwtResolver } from './jwt-resolver.js';
import { PUBLIC_ROLE } from './types.js';
const defaultPublicContext = { role: PUBLIC_ROLE };
export function createAuthMiddleware(resolver = createJwtResolver()) {
    return async (c, next) => {
        const auth = (await resolver(c)) ?? defaultPublicContext;
        c.set('auth', auth);
        await next();
    };
}
