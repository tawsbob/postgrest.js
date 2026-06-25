import type { Pool } from 'pg';
import type { LoadNode } from './planner.js';
export declare function loadIncludes(parentRows: Record<string, unknown>[], plan: LoadNode, pool: Pool): Promise<void>;
