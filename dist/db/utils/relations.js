import { getFieldAttribute, getIdentifierNames, getModelNames, getOptionalKvPair, getPrimaryKey, } from '../../sql-generator/utils/ast-helpers.js';
export function buildRelations(model, schema) {
    const modelNames = getModelNames(schema);
    const relations = [];
    for (const field of model.fields) {
        if (!modelNames.has(field.type.name)) {
            continue;
        }
        const parsed = parseRelationField(field);
        if (parsed?.localFields && parsed.foreignFields) {
            relations.push({
                name: field.name,
                kind: resolveDirectRelationKind(field),
                targetModel: field.type.name,
                localKey: parsed.localFields[0],
                foreignKey: parsed.foreignFields[0],
                unique: !field.type.array,
                relationName: parsed.relationName,
            });
            continue;
        }
        const inverse = findInverseRelation(model, field, schema, parsed?.relationName);
        if (!inverse) {
            continue;
        }
        relations.push({
            name: field.name,
            kind: field.type.array ? 'hasMany' : 'hasOne',
            targetModel: field.type.name,
            localKey: inverse.localKey,
            foreignKey: inverse.foreignKey,
            unique: !field.type.array,
            relationName: parsed?.relationName,
        });
    }
    return relations;
}
function parseRelationField(field) {
    const relation = getFieldAttribute(field, 'relation');
    if (!relation?.args || relation.args.kind !== 'KeyValueArgs') {
        return null;
    }
    const namePair = getOptionalKvPair(relation.args, 'name');
    const fieldsPair = getOptionalKvPair(relation.args, 'fields');
    const referencesPair = getOptionalKvPair(relation.args, 'references');
    return {
        relationName: namePair ? readIdentifierValue(namePair.value) : undefined,
        localFields: fieldsPair ? getIdentifierNames(fieldsPair.value) : undefined,
        foreignFields: referencesPair ? getIdentifierNames(referencesPair.value) : undefined,
    };
}
function readIdentifierValue(value) {
    if (value.kind === 'Identifier') {
        return value.name;
    }
    if (value.kind === 'StringLiteral' && 'value' in value) {
        return value.value;
    }
    return undefined;
}
function resolveDirectRelationKind(field) {
    if (field.type.array) {
        return 'hasMany';
    }
    return 'belongsTo';
}
function findInverseRelation(sourceModel, field, schema, sourceRelationName) {
    const targetModel = schema.models.find((candidate) => candidate.name === field.type.name);
    if (!targetModel) {
        return undefined;
    }
    const sourcePrimaryKey = getPrimaryKey(sourceModel)?.fields ?? ['id'];
    for (const targetField of targetModel.fields) {
        if (targetField.type.name !== sourceModel.name) {
            continue;
        }
        const targetRelation = parseRelationField(targetField);
        if (!targetRelation?.localFields || !targetRelation.foreignFields) {
            continue;
        }
        if (sourceRelationName && targetRelation.relationName !== sourceRelationName) {
            continue;
        }
        if (!sourceRelationName && targetRelation.relationName) {
            continue;
        }
        const localKey = targetRelation.foreignFields[0];
        const foreignKey = targetRelation.localFields[0];
        if (!sourcePrimaryKey.includes(localKey)) {
            continue;
        }
        return { localKey, foreignKey };
    }
    return undefined;
}
