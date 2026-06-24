import type { Model, Schema } from '../../schema-dsl/ast.js';
import {
  getDirectives,
  getModelNames,
  normalizeIndexDirective,
} from '../utils/ast-helpers.js';
import { joinSection } from '../utils/format.js';
import { quoteIdentifier, toSnakeCase, toTableName } from '../utils/snake-case.js';

export interface NormalizedIndex {
  fields: string[];
  where?: string;
  unique?: boolean;
  name?: string;
  type?: string;
}

export function buildIndexName(tableName: string, fields: string[]): string {
  const fieldPart = fields.map(toSnakeCase).join('_');
  return `${tableName}_${fieldPart}_idx`;
}

export function resolveIndexName(tableName: string, normalized: NormalizedIndex): string {
  return normalized.name ?? buildIndexName(tableName, normalized.fields);
}

export function generateCreateIndex(model: Model, normalized: NormalizedIndex): string {
  const tableName = quoteIdentifier(toTableName(model.name));
  const columns = normalized.fields.map(toSnakeCase).join(', ');
  const indexName = resolveIndexName(toTableName(model.name), normalized);
  const uniqueKeyword = normalized.unique ? 'UNIQUE ' : '';
  const usingClause =
    normalized.type && normalized.type.toUpperCase() !== 'BTREE'
      ? ` USING ${normalized.type.toLowerCase()}`
      : normalized.type?.toUpperCase() === 'BTREE'
        ? ' USING btree'
        : '';
  const whereClause = normalized.where ? ` WHERE ${normalized.where}` : '';

  return `CREATE ${uniqueKeyword}INDEX ${indexName} ON ${tableName}${usingClause} (${columns})${whereClause};`;
}

export function generateDropIndex(model: Model, normalized: NormalizedIndex): string {
  const indexName = resolveIndexName(toTableName(model.name), normalized);
  return `DROP INDEX IF EXISTS ${indexName};`;
}

export function generateIndexes(schema: Schema): string {
  const modelNames = getModelNames(schema);
  const statements: string[] = [];

  for (const model of schema.models) {
    const indexDirectives = getDirectives(model, 'index');

    for (const directive of indexDirectives) {
      const normalized = normalizeIndexDirective(directive, model, modelNames);
      statements.push(generateCreateIndex(model, normalized));
    }
  }

  return joinSection('Create indexes', statements);
}
