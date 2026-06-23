import type { Schema } from '../../schema-dsl/ast.js';
import {
  assertKeyValueArgs,
  getDirectives,
  getKvPair,
  getOptionalKvPair,
} from '../utils/ast-helpers.js';
import { joinSection } from '../utils/format.js';
import { quoteIdentifier, toTableName } from '../utils/snake-case.js';

export function generateTriggers(schema: Schema): string {
  const statements: string[] = [];

  for (const model of schema.models) {
    const tableName = quoteIdentifier(toTableName(model.name));
    const triggerDirectives = getDirectives(model, 'trigger');

    for (const directive of triggerDirectives) {
      const args = assertKeyValueArgs(directive.args);
      const timing = getKvPair(args, 'timing').value;
      const event = getKvPair(args, 'event').value;
      const execute = getKvPair(args, 'execute').value;
      const levelPair = getOptionalKvPair(args, 'level');

      if (timing.kind !== 'Identifier' || event.kind !== 'Identifier') {
        throw new Error('Trigger timing and event must be identifiers');
      }

      if (execute.kind !== 'TripleStringLiteral') {
        throw new Error('Trigger execute must be a triple-quoted string');
      }

      const timingValue = timing.name.toLowerCase();
      const eventValue = event.name.toLowerCase();
      const levelValue =
        levelPair?.value.kind === 'Identifier' ? levelPair.value.name.toUpperCase() : 'ROW';
      const forEachClause = levelValue === 'STATEMENT' ? 'FOR EACH STATEMENT' : 'FOR EACH ROW';
      const baseName = `${toTableName(model.name)}_${timingValue}_${eventValue}`;
      const functionName = `${baseName}_trigger_func`;
      const triggerName = `${baseName}_trigger`;
      const executeBody = execute.value.trim();

      statements.push(
        [
          `CREATE OR REPLACE FUNCTION ${functionName}()`,
          'RETURNS TRIGGER AS $$',
          'BEGIN',
          indentTriggerBody(executeBody),
          'END;',
          '$$ LANGUAGE plpgsql;',
        ].join('\n'),
      );

      statements.push(
        [
          `CREATE TRIGGER ${triggerName}`,
          `  ${timing.name} ${event.name} ON ${tableName}`,
          `  ${forEachClause}`,
          `  EXECUTE FUNCTION ${functionName}();`,
        ].join('\n'),
      );
    }
  }

  return joinSection('Create triggers', statements);
}

function indentTriggerBody(body: string): string {
  return body
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join('\n');
}
