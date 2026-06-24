import type { Enum, Schema } from '../../schema-dsl/ast.js';
export declare function generateEnum(enumDef: Enum): string;
export declare function generateAddEnumValue(enumName: string, value: string): string;
export declare function generateEnums(schema: Schema): string;
