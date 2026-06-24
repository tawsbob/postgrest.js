import type { Schema } from '../../schema-dsl/ast.js';
export declare function generateCreateExtension(name: string): string;
export declare function generateDropExtension(name: string): string;
export declare function generateExtensions(schema: Schema): string;
