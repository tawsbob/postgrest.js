import type { DbClient } from 'generated/db.js';
import type { AuthContext } from './auth/types.js';
export type AppEnv = {
    Variables: {
        db: DbClient;
        auth: AuthContext;
    };
};
