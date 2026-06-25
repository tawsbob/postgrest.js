import { mapPgError } from '../errors.js';
import { QueryBuilder } from '../query-builder.js';
import { mapRows } from '../row-mapper.js';
import { loadIncludes } from './executor.js';
import { fetchRootWithJsonAgg } from './json-agg.js';
import { buildLoadPlan } from './planner.js';
export async function fetchWithIncludes(model, registry, pool, rootArgs, options = {}) {
    if (!rootArgs.include) {
        throw new Error('fetchWithIncludes requires include');
    }
    const plan = buildLoadPlan(model, rootArgs.include, registry, options);
    plan.where = rootArgs.where;
    plan.orderBy = rootArgs.orderBy;
    plan.take = rootArgs.take;
    plan.skip = rootArgs.skip;
    if (plan.strategy === 'join') {
        return fetchRootWithJsonAgg(model, plan, rootArgs, pool);
    }
    const rows = await executeRootSelect(model, pool, rootArgs);
    const mapped = mapRows(rows, model);
    await loadIncludes(mapped, plan, pool);
    return mapped;
}
export async function attachIncludes(model, registry, pool, rootRows, include, rootArgs, options = {}) {
    if (rootRows.length === 0) {
        return rootRows;
    }
    const plan = buildLoadPlan(model, include, registry, options);
    plan.where = rootArgs.where;
    plan.orderBy = rootArgs.orderBy;
    plan.take = rootArgs.take;
    plan.skip = rootArgs.skip;
    await loadIncludes(rootRows, plan, pool);
    return rootRows;
}
async function executeRootSelect(model, pool, args) {
    const builder = new QueryBuilder(model);
    const query = builder.select(args);
    try {
        const result = await pool.query(query.sql, query.params);
        return result.rows;
    }
    catch (error) {
        throw mapPgError(error, model.name, model.columnToField);
    }
}
