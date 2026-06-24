import type { TypeExpr, Value } from '../../schema-dsl/ast.js';
export declare function formatDefaultValue(value: Value, columnType: TypeExpr, enumNames: Set<string>): string;
export declare function escapeSqlString(value: string): string;
export declare function serializeValue(value: Value): string;
