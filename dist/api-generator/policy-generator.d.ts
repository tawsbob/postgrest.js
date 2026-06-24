import type { Schema } from '../schema-dsl/ast.js';
import { type NormalizedPolicy, type PolicyOperation } from './utils/policy.js';
export declare class PolicyGenerator {
    private readonly schema;
    constructor(schema: Schema);
    generate(): string;
}
export declare function generatePoliciesFile(schema: Schema): string;
export type { NormalizedPolicy, PolicyOperation };
