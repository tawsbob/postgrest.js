import type { ModelMeta } from './model-meta.js';
export declare function mapRow<T>(row: Record<string, unknown>, model: ModelMeta): T;
export declare function mapRows<T>(rows: Record<string, unknown>[], model: ModelMeta): T[];
