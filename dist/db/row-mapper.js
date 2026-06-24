import { toCamelCase } from './utils/naming.js';
export function mapRow(row, model) {
    const mapped = {};
    for (const [column, value] of Object.entries(row)) {
        const fieldName = model.columnToField.get(column) ?? toCamelCase(column);
        const field = model.fieldByName.get(fieldName);
        mapped[fieldName] = field ? coerceValue(value, field) : value;
    }
    return mapped;
}
export function mapRows(rows, model) {
    return rows.map((row) => mapRow(row, model));
}
function coerceValue(value, field) {
    if (value === null || value === undefined) {
        return null;
    }
    const typeName = field.type.name;
    if (typeName === 'TIMESTAMP') {
        return value instanceof Date ? value : new Date(String(value));
    }
    if (typeName === 'BOOLEAN') {
        return Boolean(value);
    }
    if (typeName === 'JSONB') {
        if (typeof value === 'string') {
            return JSON.parse(value);
        }
        return value;
    }
    if (field.type.array && typeName === 'TEXT') {
        return value;
    }
    if (typeName === 'DECIMAL') {
        return typeof value === 'string' ? value : String(value);
    }
    if (field.isNumeric && typeof value === 'string') {
        return Number(value);
    }
    return value;
}
