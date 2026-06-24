import { loadEnv } from './load-env.js';
const missingDatabaseUrlMessage = 'DATABASE_URL is not set. Copy .env.example to .env and configure your connection string.';
export function getDatabaseUrl() {
    loadEnv();
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error(missingDatabaseUrlMessage);
    }
    return databaseUrl;
}
