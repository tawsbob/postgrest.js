import { DatabaseClient } from './client.js';
async function main() {
    const client = new DatabaseClient();
    try {
        const result = await client.query('SELECT 1 AS ok');
        const ok = result.rows[0]?.ok;
        if (ok !== 1) {
            throw new Error(`Unexpected ping result: ${String(ok)}`);
        }
        process.stdout.write('Database connection OK (SELECT 1)\n');
    }
    finally {
        await client.close();
    }
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Database connection failed: ${message}\n`);
    process.exitCode = 1;
});
