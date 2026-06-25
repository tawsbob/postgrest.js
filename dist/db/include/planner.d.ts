import type { ModelMeta } from '../model-meta.js';
import type { OrderByInput } from '../query-builder.js';
import type { WhereInput } from '../where-translator.js';
import type { IncludeInput, IncludeOptions, RelationLoadStrategy } from './types.js';
export interface LoadNode {
    model: ModelMeta;
    relation?: ModelMeta['relations'][number];
    where?: WhereInput;
    orderBy?: OrderByInput | OrderByInput[];
    take?: number;
    skip?: number;
    children: LoadNode[];
    strategy: RelationLoadStrategy;
}
export type ModelRegistry = Map<string, ModelMeta>;
export declare function buildLoadPlan(model: ModelMeta, include: IncludeInput | undefined, registry: ModelRegistry, options?: IncludeOptions, depth?: number): LoadNode;
