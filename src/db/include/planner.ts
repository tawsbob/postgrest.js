import { MAX_INCLUDE_DEPTH } from '../../constants.js';
import type { ModelMeta } from '../model-meta.js';
import type { OrderByInput } from '../query-builder.js';
import type { WhereInput } from '../where-translator.js';
import type { IncludeInput, IncludeOptions, RelationIncludeArgs, RelationLoadStrategy } from './types.js';

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

export function buildLoadPlan(
  model: ModelMeta,
  include: IncludeInput | undefined,
  registry: ModelRegistry,
  options: IncludeOptions = {},
  depth = 0,
): LoadNode {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error(`Include depth exceeds maximum of ${MAX_INCLUDE_DEPTH} on model ${model.name}`);
  }

  const children: LoadNode[] = [];

  if (include) {
    for (const [relationName, relationInclude] of Object.entries(include)) {
      const relation = model.relationByName.get(relationName);
      if (!relation) {
        throw new Error(`Unknown include relation "${relationName}" on model ${model.name}`);
      }

      const targetModel = registry.get(relation.targetModel);
      if (!targetModel) {
        throw new Error(`Unknown target model "${relation.targetModel}" for relation "${relationName}"`);
      }

      const relationArgs = normalizeRelationInclude(relationInclude);
      const childPlan = buildLoadPlan(
        targetModel,
        relationArgs.include,
        registry,
        options,
        depth + 1,
      );

      childPlan.relation = relation;
      childPlan.where = relationArgs.where;
      childPlan.orderBy = relationArgs.orderBy;
      childPlan.take = relationArgs.take;
      childPlan.skip = relationArgs.skip;
      children.push(childPlan);
    }
  }

  return {
    model,
    children,
    strategy: chooseStrategy(children, options),
  };
}

function normalizeRelationInclude(include: boolean | RelationIncludeArgs): RelationIncludeArgs {
  if (typeof include === 'boolean') {
    return {};
  }

  return include;
}

function chooseStrategy(children: LoadNode[], options: IncludeOptions): RelationLoadStrategy {
  if (options.relationLoadStrategy) {
    return options.relationLoadStrategy;
  }

  const hasManyChildren = children.filter((child) => child.relation?.kind === 'hasMany');
  if (hasManyChildren.length >= 2) {
    return 'split';
  }

  return 'split';
}
