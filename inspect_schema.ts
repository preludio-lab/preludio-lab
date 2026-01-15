import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env.local' });

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error("Missing credentials");
        process.exit(1);
    }

    const client = createClient({
        url,
        authToken,
    });

    try {
        const result = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='article_translations'");
        console.log("Schema Definition:", result.rows[0]);
    } catch (e) {
        console.error("Query failed:", e);
    }
}

main();
