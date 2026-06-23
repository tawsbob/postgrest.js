import type { Schema } from '../../schema-dsl/ast.js';
import {
  getDirectives,
  getModelNames,
  normalizeIndexDirective,
} from '../utils/ast-helpers.js';
import { joinSection } from '../utils/format.js';
import { quoteIdentifier, toSnakeCase, toTableName } from '../utils/snake-case.js';

export function generateIndexes(schema: Schema): string {
  const modelNames = getModelNames(schema);
  const statements: string[] = [];

  for (const model of schema.models) {
    const tableName = quoteIdentifier(toTableName(model.name));
    const indexDirectives = getDirectives(model, 'index');

    for (const directive of indexDirectives) {
      const normalized = normalizeIndexDirective(directive, model, modelNames);
      const columns = normalized.fields.map(toSnakeCase).join(', ');
      const indexName = normalized.name ?? buildIndexName(toTableName(model.name), normalized.fields);
      const uniqueKeyword = normalized.unique ? 'UNIQUE ' : '';
      const usingClause =
        normalized.type && normalized.type.toUpperCase() !== 'BTREE'
          ? ` USING ${normalized.type.toLowerCase()}`
          : normalized.type?.toUpperCase() === 'BTREE'
            ? ' USING btree'
            : '';
      const whereClause = normalized.where ? ` WHERE ${normalized.where}` : '';

      statements.push(
        `CREATE ${uniqueKeyword}INDEX ${indexName} ON ${tableName}${usingClause} (${columns})${whereClause};`,
      );
    }
  }

  return joinSection('Create indexes', statements);
}

function buildIndexName(tableName: string, fields: string[]): string {
  const fieldPart = fields.map(toSnakeCase).join('_');
  return `${tableName}_${fieldPart}_idx`;
}
