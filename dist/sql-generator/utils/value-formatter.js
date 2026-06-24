export function formatDefaultValue(value, columnType, enumNames) {
    switch (value.kind) {
        case 'CallExpression': {
            const args = value.args.map((arg) => formatValueLiteral(arg, enumNames)).join(', ');
            return args.length > 0 ? `${value.callee}(${args})` : `${value.callee}()`;
        }
        case 'BooleanLiteral':
            return value.value ? 'true' : 'false';
        case 'NumberLiteral':
            return String(value.value);
        case 'Identifier':
            if (enumNames.has(columnType.name)) {
                return `'${escapeSqlString(value.name)}'`;
            }
            return value.name;
        case 'StringLiteral':
            return `'${escapeSqlString(value.value)}'`;
        default:
            throw new Error(`Unsupported default value kind: ${value.kind}`);
    }
}
function formatValueLiteral(value, enumNames) {
    switch (value.kind) {
        case 'BooleanLiteral':
            return value.value ? 'true' : 'false';
        case 'NumberLiteral':
            return String(value.value);
        case 'Identifier':
            return value.name;
        case 'StringLiteral':
            return `'${escapeSqlString(value.value)}'`;
        default:
            throw new Error(`Unsupported default argument kind: ${value.kind}`);
    }
}
export function escapeSqlString(value) {
    return value.replace(/'/g, "''");
}
export function serializeValue(value) {
    return JSON.stringify(value);
}
