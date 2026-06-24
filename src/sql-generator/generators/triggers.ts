import type { Model, Schema } from '../../schema-dsl/ast.js';
import {
  getDirectives,
  normalizeTriggerDirective,
  resolveTriggerNames,
  type NormalizedTrigger,
} from '../utils/ast-helpers.js';
import { joinSection } from '../utils/format.js';
import { quoteIdentifier, toTableName } from '../utils/snake-case.js';

export type { NormalizedTrigger };

export function generateCreateTrigger(model: Model, normalized: NormalizedTrigger): string {
  const tableName = quoteIdentifier(toTableName(model.name));
  const { functionName, triggerName } = resolveTriggerNames(
    model,
    normalized.timing,
    normalized.event,
  );
  const forEachClause =
    normalized.level === 'STATEMENT' ? 'FOR EACH STATEMENT' : 'FOR EACH ROW';

  const functionStatement = [
    `CREATE OR REPLACE FUNCTION ${functionName}()`,
    'RETURNS TRIGGER AS $$',
    'BEGIN',
    indentTriggerBody(normalized.execute),
    'END;',
    '$$ LANGUAGE plpgsql;',
  ].join('\n');

  const triggerStatement = [
    `CREATE TRIGGER ${triggerName}`,
    `  ${normalized.timing} ${normalized.event} ON ${tableName}`,
    `  ${forEachClause}`,
    `  EXECUTE FUNCTION ${functionName}();`,
  ].join('\n');

  return `${functionStatement}\n\n${triggerStatement}`;
}

export function generateDropTrigger(model: Model, normalized: NormalizedTrigger): string {
  const tableName = quoteIdentifier(toTableName(model.name));
  const { functionName, triggerName } = resolveTriggerNames(
    model,
    normalized.timing,
    normalized.event,
  );

  return [
    `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};`,
    `DROP FUNCTION IF EXISTS ${functionName}();`,
  ].join('\n');
}

export function generateTriggers(schema: Schema): string {
  const statements: string[] = [];

  for (const model of schema.models) {
    for (const directive of getDirectives(model, 'trigger')) {
      const normalized = normalizeTriggerDirective(directive);
      statements.push(generateCreateTrigger(model, normalized));
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
