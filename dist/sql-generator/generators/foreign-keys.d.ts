import type { Schema } from '../../schema-dsl/ast.js';
import { type ForeignKeyInfo } from '../utils/ast-helpers.js';
export declare function generateForeignKey(foreignKey: ForeignKeyInfo): string;
export declare function generateForeignKeys(schema: Schema): string;
