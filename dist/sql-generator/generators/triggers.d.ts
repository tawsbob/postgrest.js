import type { Model, Schema } from '../../schema-dsl/ast.js';
import { type NormalizedTrigger } from '../utils/ast-helpers.js';
export type { NormalizedTrigger };
export declare function generateCreateTrigger(model: Model, normalized: NormalizedTrigger): string;
export declare function generateDropTrigger(model: Model, normalized: NormalizedTrigger): string;
export declare function generateTriggers(schema: Schema): string;
