import type { Model, Schema } from '../../schema-dsl/ast.js';
import type { RelationMeta } from '../model-meta.js';
export declare function buildRelations(model: Model, schema: Schema): RelationMeta[];
