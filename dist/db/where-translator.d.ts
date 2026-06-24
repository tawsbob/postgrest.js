import type { ModelMeta } from './model-meta.js';
export type WhereInput = Record<string, unknown>;
export interface WhereClause {
    sql: string;
    params: unknown[];
}
export declare class WhereTranslator {
    private readonly model;
    private readonly scalarFields;
    private paramIndex;
    private readonly startParamIndex;
    constructor(model: ModelMeta, startParamIndex?: number);
    translate(where: WhereInput | undefined): WhereClause;
    getNextParamIndex(): number;
    private translateLogical;
    private translateNested;
    private translateField;
    private translateOperator;
    private nextPlaceholder;
}
