import { mapPgError } from './errors.js';
import { QueryBuilder } from './query-builder.js';
import { mapRow, mapRows } from './row-mapper.js';
export function createModelClient(model, pool) {
    const builder = new QueryBuilder(model);
    async function execute(sql, params) {
        try {
            const result = await pool.query(sql, params);
            return result.rows;
        }
        catch (error) {
            throw mapPgError(error, model.name, model.columnToField);
        }
    }
    return {
        async create(data) {
            const query = builder.insert(data);
            const rows = await execute(query.sql, query.params);
            return mapRow(rows[0], model);
        },
        async findUnique(where) {
            const query = builder.select({ where, take: 1 });
            const rows = await execute(query.sql, query.params);
            return rows[0] ? mapRow(rows[0], model) : null;
        },
        async findFirst(args) {
            const query = builder.select({
                where: args?.where,
                orderBy: args?.orderBy,
                take: 1,
            });
            const rows = await execute(query.sql, query.params);
            return rows[0] ? mapRow(rows[0], model) : null;
        },
        async findMany(args) {
            const query = builder.select({
                where: args?.where,
                orderBy: args?.orderBy,
                take: args?.take,
                skip: args?.skip,
            });
            const rows = await execute(query.sql, query.params);
            return mapRows(rows, model);
        },
        async count(args) {
            const query = builder.count({ where: args?.where });
            const rows = await execute(query.sql, query.params);
            return rows[0]?.count ?? 0;
        },
        async update(args) {
            const query = builder.update({
                where: args.where,
                data: args.data,
            });
            const rows = await execute(query.sql, query.params);
            if (!rows[0]) {
                throw new Error(`Update returned no rows for model ${model.name}`);
            }
            return mapRow(rows[0], model);
        },
        async updateMany(args) {
            const query = builder.update({
                where: args.where,
                data: args.data,
            });
            const rows = await execute(query.sql, query.params);
            return { count: rows.length };
        },
        async delete(where) {
            const query = builder.delete({ where: where });
            const rows = await execute(query.sql, query.params);
            if (!rows[0]) {
                throw new Error(`Delete returned no rows for model ${model.name}`);
            }
            return mapRow(rows[0], model);
        },
        async deleteMany(args) {
            const query = builder.delete({ where: args?.where });
            const rows = await execute(query.sql, query.params);
            return { count: rows.length };
        },
    };
}
