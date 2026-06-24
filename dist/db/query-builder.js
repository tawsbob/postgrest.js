import { WhereTranslator } from './where-translator.js';
export class QueryBuilder {
    model;
    constructor(model) {
        this.model = model;
    }
    insert(data) {
        const entries = this.model.fields.filter((field) => Object.prototype.hasOwnProperty.call(data, field.name));
        if (entries.length === 0) {
            throw new Error(`No insertable fields provided for model ${this.model.name}`);
        }
        const columns = entries.map((field) => field.columnName);
        const values = entries.map((field) => data[field.name]);
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const sql = `INSERT INTO ${this.model.quotedTableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        return { sql, params: values };
    }
    select(args = {}) {
        const whereTranslator = new WhereTranslator(this.model);
        const whereClause = whereTranslator.translate(args.where);
        const orderByClause = this.buildOrderBy(args.orderBy);
        const params = [...whereClause.params];
        let sql = `SELECT * FROM ${this.model.quotedTableName}`;
        if (whereClause.sql) {
            sql += ` WHERE ${whereClause.sql}`;
        }
        if (orderByClause) {
            sql += ` ${orderByClause}`;
        }
        if (args.take !== undefined) {
            params.push(args.take);
            sql += ` LIMIT $${params.length}`;
        }
        if (args.skip !== undefined) {
            params.push(args.skip);
            sql += ` OFFSET $${params.length}`;
        }
        return { sql, params };
    }
    update(args) {
        const dataEntries = this.model.fields.filter((field) => Object.prototype.hasOwnProperty.call(args.data, field.name));
        if (dataEntries.length === 0) {
            throw new Error(`No updatable fields provided for model ${this.model.name}`);
        }
        const setClauses = [];
        const params = [];
        for (const field of dataEntries) {
            params.push(args.data[field.name]);
            setClauses.push(`${field.columnName} = $${params.length}`);
        }
        const whereTranslator = new WhereTranslator(this.model, params.length + 1);
        const whereClause = whereTranslator.translate(args.where);
        params.push(...whereClause.params);
        let sql = `UPDATE ${this.model.quotedTableName} SET ${setClauses.join(', ')}`;
        if (whereClause.sql) {
            sql += ` WHERE ${whereClause.sql}`;
        }
        sql += ' RETURNING *';
        return { sql, params };
    }
    delete(args = {}) {
        const whereTranslator = new WhereTranslator(this.model);
        const whereClause = whereTranslator.translate(args.where);
        let sql = `DELETE FROM ${this.model.quotedTableName}`;
        if (whereClause.sql) {
            sql += ` WHERE ${whereClause.sql}`;
        }
        sql += ' RETURNING *';
        return { sql, params: whereClause.params };
    }
    count(args = {}) {
        const whereTranslator = new WhereTranslator(this.model);
        const whereClause = whereTranslator.translate(args.where);
        let sql = `SELECT COUNT(*)::int AS count FROM ${this.model.quotedTableName}`;
        if (whereClause.sql) {
            sql += ` WHERE ${whereClause.sql}`;
        }
        return { sql, params: whereClause.params };
    }
    buildOrderBy(orderBy) {
        if (!orderBy) {
            return '';
        }
        const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
        const parts = [];
        for (const entry of entries) {
            for (const [fieldName, direction] of Object.entries(entry)) {
                const field = this.model.fieldByName.get(fieldName);
                if (!field) {
                    throw new Error(`Unknown orderBy field "${fieldName}" on model ${this.model.name}`);
                }
                parts.push(`${field.columnName} ${direction.toUpperCase()}`);
            }
        }
        return parts.length > 0 ? `ORDER BY ${parts.join(', ')}` : '';
    }
}
