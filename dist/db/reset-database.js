const RESET_SQL = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgrest;
GRANT ALL ON SCHEMA public TO public;
`.trim();
export async function resetPublicSchema(client) {
    await client.query(RESET_SQL);
}
