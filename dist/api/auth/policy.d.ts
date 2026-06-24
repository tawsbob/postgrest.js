import type { WhereInput } from '../../db/where-translator.js';
import { type NormalizedPolicy, type PolicyOperation } from 'generated/policies.js';
import type { AuthContext } from './types.js';
export { ForbiddenError, UnauthorizedError } from './errors.js';
export declare function assertPolicy(model: string, role: string, operation: PolicyOperation): NormalizedPolicy;
export declare function resolvePolicyWhere(policy: NormalizedPolicy, auth: AuthContext): WhereInput | undefined;
export declare function mergeWhere(primary: Record<string, unknown>, policyWhere?: WhereInput): Record<string, unknown>;
