import type { Field, Model, Schema } from '../../schema-dsl/ast.js';
import {
  collectValidationComments,
  getDefaultExpression,
  getEnumNames,
  getModelNames,
  getPrimaryKey,
  getStoredFields,
  fieldHasAttribute,
} from '../utils/ast-helpers.js';
import { formatCreateTable, joinSection } from '../utils/format.js';
import { mapColumnType } from '../utils/type-mapper.js';
import { quoteIdentifier, toSnakeCase, toTableName } from '../utils/snake-case.js';

export function generateTables(schema: Schema): string {
  const enumNames = getEnumNames(schema);
  const modelNames = getModelNames(schema);
  const statements = schema.models.map((model) => generateTable(model, enumNames, modelNames));
  return joinSection('Create tables', statements);
}

export function generateTable(model: Model, enumNames: Set<string>, modelNames: Set<string>): string {
  const primaryKey = getPrimaryKey(model);
  const blocks: string[][] = [];

  for (const field of getStoredFields(model, modelNames)) {
    const columnParts: string[] = [];
    const columnName = toSnakeCase(field.name);

    columnParts.push(columnName);
    columnParts.push(mapColumnType(field.type, enumNames));

    const isSingleFieldPrimaryKey =
      primaryKey && !primaryKey.composite && primaryKey.fields.length === 1 && primaryKey.fields[0] === field.name;

    if (isSingleFieldPrimaryKey) {
      columnParts.push('PRIMARY KEY');
    }

    if (fieldHasAttribute(field, 'unique')) {
      columnParts.push('UNIQUE');
    }

    const defaultExpression = getDefaultExpression(field, enumNames);
    if (defaultExpression) {
      columnParts.push(`DEFAULT ${defaultExpression}`);
    }

    if (!field.type.optional) {
      columnParts.push('NOT NULL');
    }

    const block = [columnParts.join(' ')];
    block.push(...collectValidationComments(field));
    blocks.push(block);
  }

  if (primaryKey?.composite) {
    const pkColumns = primaryKey.fields.map(toSnakeCase).join(', ');
    blocks.push([`PRIMARY KEY (${pkColumns})`]);
  }

  const tableName = quoteIdentifier(toTableName(model.name));
  return formatCreateTable(tableName, blocks);
}

export function generateColumnDefinition(
  field: Field,
  model: Model,
  enumNames: Set<string>,
  modelNames: Set<string>,
): string {
  const primaryKey = getPrimaryKey(model);
  const columnParts: string[] = [];
  const columnName = toSnakeCase(field.name);

  columnParts.push(columnName);
  columnParts.push(mapColumnType(field.type, enumNames));

  const isSingleFieldPrimaryKey =
    primaryKey && !primaryKey.composite && primaryKey.fields.length === 1 && primaryKey.fields[0] === field.name;

  if (isSingleFieldPrimaryKey) {
    columnParts.push('PRIMARY KEY');
  }

  if (fieldHasAttribute(field, 'unique')) {
    columnParts.push('UNIQUE');
  }

  const defaultExpression = getDefaultExpression(field, enumNames);
  if (defaultExpression) {
    columnParts.push(`DEFAULT ${defaultExpression}`);
  }

  if (!field.type.optional) {
    columnParts.push('NOT NULL');
  }

  return columnParts.join(' ');
}
