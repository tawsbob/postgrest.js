import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { generateApi, generateClient } from './generate.js';
import { DEFAULT_OUTPUT_DIR } from './paths.js';
export async function runDev(schemaPath) {
    await generateClient(schemaPath);
    await generateApi(schemaPath);
    const appPath = path.resolve(DEFAULT_OUTPUT_DIR, 'app.ts');
    execFileSync(process.execPath, ['--import', 'tsx', appPath], { stdio: 'inherit', cwd: process.cwd() });
}
