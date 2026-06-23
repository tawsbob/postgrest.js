import type { Schema } from '../../schema-dsl/ast.js';
import { collectForeignKeys } from '../utils/ast-helpers.js';
import { joinSection } from '../utils/format.js';
import { quoteIdentifier } from '../utils/snake-case.js';

export function generateForeignKeys(schema: Schema): string {
  const statements = collectForeignKeys(schema).map((foreignKey) => {
    const constraintName = `${foreignKey.sourceTable}_${foreignKey.sourceColumns.join('_')}_fkey`;
    const sourceColumns = foreignKey.sourceColumns.join(', ');
    const targetColumns = foreignKey.targetColumns.join(', ');
    const lines = [
      `ALTER TABLE ${quoteIdentifier(foreignKey.sourceTable)} ADD CONSTRAINT ${constraintName}`,
      `  FOREIGN KEY (${sourceColumns}) REFERENCES ${quoteIdentifier(foreignKey.targetTable)} (${targetColumns})`,
    ];

    if (foreignKey.onDelete) {
      lines.push(`  ON DELETE ${foreignKey.onDelete}`);
    }

    if (foreignKey.onUpdate) {
      lines.push(`  ON UPDATE ${foreignKey.onUpdate}`);
    }

    return lines.join('\n') + ';';
  });

  return joinSection('Alter tables (foreign keys)', statements);
}
