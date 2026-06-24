import type { Model, Schema, TypeExpr } from '../schema-dsl/ast.js';
export interface FieldMeta {
    name: string;
    columnName: string;
    type: TypeExpr;
    optional: boolean;
    hasDefault: boolean;
    isId: boolean;
    isUnique: boolean;
    isEnum: boolean;
    isNumeric: boolean;
    isString: boolean;
    isBoolean: boolean;
}
export interface ModelMetaSnapshot {
    name: string;
    tableName: string;
    quotedTableName: string;
    primaryKeyFields: string[];
    fields: FieldMeta[];
    fieldByName: Record<string, FieldMeta>;
    columnToField: Record<string, string>;
}
export interface ModelMeta {
    name: string;
    tableName: string;
    quotedTableName: string;
    primaryKeyFields: string[];
    fields: FieldMeta[];
    fieldByName: Map<string, FieldMeta>;
    columnToField: Map<string, string>;
}
export declare function buildModelMeta(model: Model, schema: Schema): ModelMeta;
export declare function buildModelMetaSnapshot(model: Model, schema: Schema): ModelMetaSnapshot;
export declare function hydrateModelMeta(snapshot: ModelMetaSnapshot): ModelMeta;
export declare function buildModelMetas(schema: Schema): ModelMeta[];
