import type { RelationMeta } from '../model-meta.js';

export function stitch(
  parents: Record<string, unknown>[],
  children: Record<string, unknown>[],
  relation: RelationMeta,
): void {
  const childrenByForeignKey = bucketChildrenByForeignKey(children, relation);

  for (const parent of parents) {
    const localValue = parent[relation.localKey];
    const bucket = localValue == null ? [] : (childrenByForeignKey.get(localValue) ?? []);

    if (relation.unique) {
      parent[relation.name] = bucket[0] ?? null;
      continue;
    }

    parent[relation.name] = bucket;
  }
}

function bucketChildrenByForeignKey(
  children: Record<string, unknown>[],
  relation: RelationMeta,
): Map<unknown, Record<string, unknown>[]> {
  const buckets = new Map<unknown, Record<string, unknown>[]>();

  for (const child of children) {
    const foreignValue = child[relation.foreignKey];
    if (foreignValue == null) {
      continue;
    }

    const bucket = buckets.get(foreignValue);
    if (bucket) {
      bucket.push(child);
      continue;
    }

    buckets.set(foreignValue, [child]);
  }

  return buckets;
}

export function dedupeKeys(keys: unknown[]): unknown[] {
  return [...new Set(keys.filter((key) => key != null))];
}

export function extractParentKeys(
  parents: Record<string, unknown>[],
  relation: RelationMeta,
): unknown[] {
  return dedupeKeys(parents.map((parent) => parent[relation.localKey]));
}
