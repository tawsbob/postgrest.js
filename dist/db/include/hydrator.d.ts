import type { RelationMeta } from '../model-meta.js';
export declare function stitch(parents: Record<string, unknown>[], children: Record<string, unknown>[], relation: RelationMeta): void;
export declare function dedupeKeys(keys: unknown[]): unknown[];
export declare function extractParentKeys(parents: Record<string, unknown>[], relation: RelationMeta): unknown[];
