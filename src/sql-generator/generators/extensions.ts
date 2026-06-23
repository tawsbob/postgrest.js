import type { Schema } from '../../schema-dsl/ast.js';
import { joinSection } from '../utils/format.js';

export function generateExtensions(schema: Schema): string {
  const statements = schema.extensions.map(
    (extension) => `CREATE EXTENSION IF NOT EXISTS "${extension.name}" WITH SCHEMA public;`,
  );
  return joinSection('Extensions', statements);
}
