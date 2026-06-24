import { joinSection } from '../utils/format.js';
import { quoteIdentifier, toTableName } from '../utils/snake-case.js';
export function generateDropTables(schema) {
    const statements = [...schema.models]
        .reverse()
        .map((model) => `DROP TABLE IF EXISTS ${quoteIdentifier(toTableName(model.name))} CASCADE;`);
    return joinSection('Drop tables', statements);
}
