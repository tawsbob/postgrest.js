import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
let loaded = false;
export function loadEnv() {
    if (loaded) {
        return;
    }
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
        process.loadEnvFile(envPath);
    }
    loaded = true;
}
export function resetLoadEnvForTests() {
    loaded = false;
}
export function markEnvLoadedForTests() {
    loaded = true;
}
