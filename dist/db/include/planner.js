import { MAX_INCLUDE_DEPTH } from '../../constants.js';
export function buildLoadPlan(model, include, registry, options = {}, depth = 0) {
    if (depth > MAX_INCLUDE_DEPTH) {
        throw new Error(`Include depth exceeds maximum of ${MAX_INCLUDE_DEPTH} on model ${model.name}`);
    }
    const children = [];
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
            const childPlan = buildLoadPlan(targetModel, relationArgs.include, registry, options, depth + 1);
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
function normalizeRelationInclude(include) {
    if (typeof include === 'boolean') {
        return {};
    }
    return include;
}
function chooseStrategy(children, options) {
    if (options.relationLoadStrategy) {
        return options.relationLoadStrategy;
    }
    const hasManyChildren = children.filter((child) => child.relation?.kind === 'hasMany');
    if (hasManyChildren.length >= 2) {
        return 'split';
    }
    return 'split';
}
