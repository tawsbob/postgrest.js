import type { Pool } from 'pg';
import type { ModelMeta } from './model-meta.js';
export interface ModelClient<T, TCreate, TUpdate, TWhere, TOrderBy> {
    create(data: TCreate): Promise<T>;
    findUnique(where: Record<string, unknown>): Promise<T | null>;
    findFirst(args?: {
        where?: TWhere;
        orderBy?: TOrderBy;
    }): Promise<T | null>;
    findMany(args?: {
        where?: TWhere;
        orderBy?: TOrderBy | TOrderBy[];
        take?: number;
        skip?: number;
    }): Promise<T[]>;
    count(args?: {
        where?: TWhere;
    }): Promise<number>;
    update(args: {
        where: Record<string, unknown>;
        data: TUpdate;
    }): Promise<T>;
    updateMany(args: {
        where?: TWhere;
        data: TUpdate;
    }): Promise<{
        count: number;
    }>;
    delete(where: Record<string, unknown>): Promise<T>;
    deleteMany(args?: {
        where?: TWhere;
    }): Promise<{
        count: number;
    }>;
}
export declare function createModelClient<T, TCreate, TUpdate, TWhere, TOrderBy>(model: ModelMeta, pool: Pool): ModelClient<T, TCreate, TUpdate, TWhere, TOrderBy>;
