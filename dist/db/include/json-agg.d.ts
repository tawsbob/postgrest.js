import type { Pool } from 'pg';
import type { ModelMeta } from '../model-meta.js';
import type { FindArgs } from '../query-builder.js';
import type { LoadNode } from './planner.js';
export declare function fetchRootWithJsonAgg<T extends Record<string, unknown>>(model: ModelMeta, plan: LoadNode, args: FindArgs, pool: Pool): Promise<T[]>;
