import type { Schema } from '../../schema-dsl/ast.js';
import { joinSection } from '../utils/format.js';
import { escapeSqlString } from '../utils/value-formatter.js';
import { toSnakeCase } from '../utils/snake-case.js';

export function generateEnums(schema: Schema): string {
  const statements = schema.enums.map((enumDef) => {
    const typeName = toSnakeCase(enumDef.name);
    const values = enumDef.values.map((value) => `'${escapeSqlString(value)}'`).join(', ');
    return `CREATE TYPE ${typeName} AS ENUM (${values});`;
  });

  return joinSection('Enums', statements);
}
