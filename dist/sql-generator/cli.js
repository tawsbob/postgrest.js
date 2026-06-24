import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SqlGenerator } from './sql-generator.js';
const schemaPath = process.argv[2] ?? join(process.cwd(), 'app.schema');
const source = readFileSync(schemaPath, 'utf8');
const sql = new SqlGenerator().generateFromSource(source);
process.stdout.write(sql);
