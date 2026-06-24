import type { AuthResolver } from './types.js';
export interface JwtResolverOptions {
    secret?: string;
    roleClaim?: string;
    userIdClaim?: string;
}
export declare function createJwtResolver(options?: JwtResolverOptions): AuthResolver;
