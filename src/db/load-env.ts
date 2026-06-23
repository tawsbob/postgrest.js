import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

export function loadEnv(): void {
  if (loaded) {
    return;
  }

  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }

  loaded = true;
}

export function resetLoadEnvForTests(): void {
  loaded = false;
}

export function markEnvLoadedForTests(): void {
  loaded = true;
}
