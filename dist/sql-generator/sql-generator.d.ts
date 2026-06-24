import type { Schema } from '../schema-dsl/ast.js';
export declare class SqlGenerator {
    generate(schema: Schema): string;
    generateFromSource(source: string): string;
}
export { toSnakeCase, toTableName } from './utils/snake-case.js';
