import type { TypeExpr, Value } from '../../schema-dsl/ast.js';

export function formatDefaultValue(value: Value, columnType: TypeExpr, enumNames: Set<string>): string {
  switch (value.kind) {
    case 'CallExpression': {
      const args = value.args.map((arg) => formatValueLiteral(arg, enumNames)).join(', ');
      return args.length > 0 ? `${value.callee}(${args})` : `${value.callee}()`;
    }
    case 'BooleanLiteral':
      return value.value ? 'true' : 'false';
    case 'NumberLiteral':
      return String(value.value);
    case 'Identifier':
      if (enumNames.has(columnType.name)) {
        return `'${escapeSqlString(value.name)}'`;
      }
      return value.name;
    case 'StringLiteral':
      return `'${escapeSqlString(value.value)}'`;
    default:
      throw new Error(`Unsupported default value kind: ${(value as Value).kind}`);
  }
}

function formatValueLiteral(value: Value, enumNames: Set<string>): string {
  switch (value.kind) {
    case 'BooleanLiteral':
      return value.value ? 'true' : 'false';
    case 'NumberLiteral':
      return String(value.value);
    case 'Identifier':
      return value.name;
    case 'StringLiteral':
      return `'${escapeSqlString(value.value)}'`;
    default:
      throw new Error(`Unsupported default argument kind: ${(value as Value).kind}`);
  }
}

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export function serializeValue(value: Value): string {
  return JSON.stringify(value);
}
