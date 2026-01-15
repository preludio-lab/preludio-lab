import 'dotenv/config';
import type { Config } from 'drizzle-kit';

import { config } from 'dotenv';
config({ path: '.env.local' });

export default {
    schema: './src/infrastructure/database/schema/index.ts',
    out: './drizzle',
    dialect: 'turso',
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
} satisfies Config;
