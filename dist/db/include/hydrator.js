export function stitch(parents, children, relation) {
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
function bucketChildrenByForeignKey(children, relation) {
    const buckets = new Map();
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
export function dedupeKeys(keys) {
    return [...new Set(keys.filter((key) => key != null))];
}
export function extractParentKeys(parents, relation) {
    return dedupeKeys(parents.map((parent) => parent[relation.localKey]));
}
