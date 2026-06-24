import type { Schema } from '../schema-dsl/ast.js';
export interface AppGeneratorOptions {
    customRoutesDir?: string;
}
export declare class AppGenerator {
    private readonly schema;
    private readonly options;
    constructor(schema: Schema, options?: AppGeneratorOptions);
    generate(): string;
}
export declare function generateAppFile(schema: Schema, options?: AppGeneratorOptions): string;
